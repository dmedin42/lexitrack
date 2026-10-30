import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Failed to parse request JSON.");
    }

    const { audioBase64, referenceText, studentId, passageTitle, gradingStrictness, retellTranscription } = body;

    if (!audioBase64 || !referenceText) throw new Error("Missing audio or reference text.");

    // 1. SANITIZATION
    const sanitize = (str: string) =>
      str
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[^\x00-\x7F]/g, "");

    const textArray = referenceText.trim().split(/\s+/);
    const slicedText = sanitize(textArray.slice(0, 350).join(" "));
    const currentThreshold = gradingStrictness ? Math.round(gradingStrictness * 10) : 90;

    const speechKey = Deno.env.get("AZURE_SPEECH_KEY");
    const speechRegion = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";

    // 2. AUDIO DECODING
    const base64Clean = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
    const binaryString = atob(base64Clean);
    const audioBuffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBuffer[i] = binaryString.charCodeAt(i);
    }

    // 3. AZURE PARAMS
    const pronAssessmentParams = {
      ReferenceText: slicedText,
      GradingSystem: "HundredMark",
      Granularity: "Phoneme",
      Dimension: "Comprehensive",
      EnableMiscue: true,
      PhonemeAlphabet: "SAPI",
      GradingThreshold: currentThreshold,
    };

    const pronHeader = btoa(
      encodeURIComponent(JSON.stringify(pronAssessmentParams)).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );

    // 4. AZURE CALL
    const url = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
    const azureResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey!,
        "Pronunciation-Assessment": pronHeader,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "X-Opt-Out-Of-Content-Logging": "true",
      },
      body: audioBuffer,
    });

    const result = await azureResponse.json();
    const nbest = result.NBest?.[0] || {};
    const words = nbest.Words || [];

    // 5. WORD & PHONEME MAPPING
    let totalAcc = 0;
    let attemptedCount = 0;

    const mappedWords = words.map((w: any, idx: number) => {
      const score = w.AccuracyScore ?? w.PronunciationAssessment?.AccuracyScore ?? 0;
      const errorType = (w.ErrorType ?? w.PronunciationAssessment?.ErrorType ?? "None").toLowerCase();

      if (errorType !== "omission") {
        totalAcc += score;
        attemptedCount++;
      }

      return {
        word: w.Word,
        accuracy_score: Math.round(score),
        error_type: errorType === "none" ? "correct" : errorType,
        phonemes:
          w.Phonemes?.map((p: any) => ({
            phoneme: p.Phoneme,
            accuracy_score: p.AccuracyScore,
          })) || [],
      };
    });

    const finalAccuracy = attemptedCount > 0 ? Math.round(totalAcc / attemptedCount) : 0;

    // Use wall-clock session duration if provided, else fall back to Azure ticks
    const sessionDurationMs = body.sessionDurationMs;
    const totalAudioSeconds = sessionDurationMs
      ? sessionDurationMs / 1000
      : (result.Duration || 0) / 10000000;
    const safeSeconds = Math.max(totalAudioSeconds, 5);
    const wpm = attemptedCount > 0 ? Math.round(attemptedCount / (safeSeconds / 60)) : 0;

    console.log(`[Lexi-Timer] Words: ${attemptedCount}, Seconds: ${safeSeconds.toFixed(2)}, WPM: ${wpm}, Source: ${sessionDurationMs ? "wall-clock" : "azure"}`);

    // Build word_analysis JSONB for storage
    const wordAnalysis = words.map((w: any, idx: number) => {
      const score = w.AccuracyScore ?? w.PronunciationAssessment?.AccuracyScore ?? 0;
      const errorType = (w.ErrorType ?? w.PronunciationAssessment?.ErrorType ?? "None").toLowerCase();
      return {
        word: w.Word,
        word_index: idx,
        accuracy_score: Math.round(score),
        error_type: errorType === "none" ? "correct" : errorType,
        offset_ms: w.Offset ? Math.round(w.Offset / 10000) : 0,
        duration_ms: w.Duration ? Math.round(w.Duration / 10000) : 0,
        phonemes: (w.Phonemes ?? []).map((p: any) => ({
          phoneme: p.Phoneme,
          accuracy_score: p.AccuracyScore ?? p.PronunciationAssessment?.AccuracyScore ?? 0,
          offset_ms: p.Offset ? Math.round(p.Offset / 10000) : 0,
          duration_ms: p.Duration ? Math.round(p.Duration / 10000) : 0,
        })),
      };
    });

    // 6. DATABASE SAVE
    let assessmentId = null;
    if (studentId) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

      const shouldReview = finalAccuracy === 0 || wpm === 0;

      const { data: mainData, error: mainError } = await supabase
        .from("assessments")
        .insert({
          student_id: studentId,
          passage_title: sanitize(passageTitle ?? "Untitled"),
          accuracy_score: finalAccuracy,
          wpm: wpm,
          word_analysis: wordAnalysis,
          retell_transcription: retellTranscription || null,
          date: new Date().toISOString(),
          in_review: shouldReview,
        })
        .select("id")
        .single();

      if (mainError) console.error("Assessment save failed:", mainError);
      if (mainData) assessmentId = mainData.id;
    }

    // Return in the shape the frontend expects
    return new Response(
      JSON.stringify({
        final_scores: {
          accuracy_score: finalAccuracy,
          fluency_score: wpm,
          completeness_score: null,
          prosody_score: null,
        },
        wpm,
        final_words: wordAnalysis,
        assessmentId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
