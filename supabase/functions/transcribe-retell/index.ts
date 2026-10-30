import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // 1. Handle Preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- 2. Smart Body Parsing (Binary vs JSON) ---
    const contentType = req.headers.get("content-type") || "";
    let audioBuffer;

    if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
      console.log("📦 Processing binary audio stream...");
      audioBuffer = new Uint8Array(await req.arrayBuffer());
    } else {
      console.log("📄 Processing JSON base64 payload...");
      const payload = await req.json();
      const { audioBase64 } = payload;

      if (!audioBase64) {
        return new Response(JSON.stringify({ error: "No audio data provided", status: "EmptyRequest" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const base64Clean = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
      audioBuffer = Uint8Array.from(atob(base64Clean), (c) => c.charCodeAt(0));
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Audio buffer is empty after parsing.");
    }

    // --- 3. Azure Configuration ---
    const speechKey = Deno.env.get("AZURE_SPEECH_KEY");
    const speechRegion = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";

    if (!speechKey) {
      console.error("❌ AZURE_SPEECH_KEY missing.");
      return new Response(JSON.stringify({ error: "Server configuration error", status: "MissingKey" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 4. Call Azure STT (With Security Headers) ---
    const url = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        Accept: "application/json",
        // CRITICAL: Ross Rogers / LearnPlatform Privacy Compliance
        // Ensures no student audio is retained for Microsoft's model training
        "X-Opt-Out-Of-Content-Logging": "true",
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Azure API Error (${response.status}):`, errorData);
      return new Response(JSON.stringify({ error: "Azure STT service error", status: "AzureError" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const transcript = data.DisplayText || "";
    const recognitionStatus = data.RecognitionStatus || "Unknown";

    console.log(`✅ STT Complete. Status: ${recognitionStatus}. Characters: ${transcript.length}`);

    return new Response(
      JSON.stringify({
        transcript,
        status: recognitionStatus,
        raw: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("❌ CRITICAL UNHANDLED ERROR:", err.message);
    return new Response(JSON.stringify({ error: "Internal server error", message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
