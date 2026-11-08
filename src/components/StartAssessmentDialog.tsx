import { useState } from "react";
import { Mic, Square, Upload, FileJson, Loader2, BookOpen } from "lucide-react";
import { useAudioRecorder, blobToBase64 } from "@/hooks/useAudioRecorder";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { usePassages } from "@/hooks/usePassages";
import { runClusterAnalysis } from "@/lib/clusterAnalysis";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface StartAssessmentDialogProps {
  studentId: string;
  studentName: string;
}

const StartAssessmentDialog = ({ studentId, studentName }: StartAssessmentDialogProps) => {
  const { data: passages } = usePassages();
  const [open, setOpen] = useState(false);
  const [selectedPassageId, setSelectedPassageId] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [passageTitle, setPassageTitle] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Audio recording (PCM WAV for Azure Speech SDK)
  const { isRecording, audioBlob, startRecording, stopRecording, resetAudio } = useAudioRecorder();

  // When selecting a passage from the library
  const handlePassageSelect = (passageId: string) => {
    setSelectedPassageId(passageId);
    const passage = passages?.find(p => p.id === passageId);
    if (passage) {
      setReferenceText(passage.content);
      setPassageTitle(passage.title);
    }
  };


  const saveAssessment = async (parsed: any) => {
    // ═══════════════════════════════════════════════
    // 🔍 DEEP DEBUG: Full response structure
    // ═══════════════════════════════════════════════
    console.log("🔍 [1] FULL RAW RESPONSE (top-level keys):", Object.keys(parsed ?? {}));
    console.log("🔍 [2] RecognitionStatus:", parsed?.RecognitionStatus);
    console.log("🔍 [3] Has final_scores?", !!parsed?.final_scores, "→", parsed?.final_scores);
    console.log("🔍 [4] Has PronunciationAssessment?", !!parsed?.PronunciationAssessment, "→", JSON.stringify(parsed?.PronunciationAssessment));
    console.log("🔍 [5] Has NBest?", !!parsed?.NBest, "NBest[0] keys:", parsed?.NBest?.[0] ? Object.keys(parsed.NBest[0]) : "none");
    console.log("🔍 [6] Has Words?", !!parsed?.Words, "count:", parsed?.Words?.length ?? 0);
    console.log("🔍 [7] Has final_words?", !!parsed?.final_words, "count:", parsed?.final_words?.length ?? 0);
    console.log("🔍 [8] wpm:", parsed?.wpm, "duration_seconds:", parsed?.duration_seconds, "Duration:", parsed?.Duration);
    if (parsed?.Words?.length > 0) {
      console.log("🔍 [9] First word sample:", JSON.stringify(parsed.Words[0]));
    }
    if (parsed?.final_words?.length > 0) {
      console.log("🔍 [10] First final_word sample:", JSON.stringify(parsed.final_words[0]));
    }

    // Support both edge function shape (final_scores/final_words) and raw Azure shape
    const scores = parsed.final_scores ?? parsed.NBest?.[0]?.PronunciationAssessment ?? parsed.PronunciationAssessment ?? {};
    const accuracyScore = Math.round(scores.accuracy_score ?? scores.AccuracyScore ?? parsed.accuracyScore ?? 0);
    const fluencyScore = Math.round(scores.fluency_score ?? scores.FluencyScore ?? parsed.fluencyScore ?? 0);
    const completenessScore = Math.round(scores.completeness_score ?? scores.CompletenessScore ?? 0);
    const prosodyScore = scores.prosody_score ?? scores.ProsodyScore ?? null;
    const durationSeconds = Math.round(parsed.duration_seconds ?? scores.duration_seconds ?? (parsed.Duration ?? 0) / 10000000);
    const wpm = Math.round(parsed.wpm ?? scores.wpm ?? 0);

    console.log("🔍 [11] SCORES RESOLVED → accuracy:", accuracyScore, "fluency:", fluencyScore, "completeness:", completenessScore, "prosody:", prosodyScore, "duration:", durationSeconds, "wpm:", wpm);

    const words: any[] = parsed.final_words ?? parsed.NBest?.[0]?.Words ?? parsed.Words ?? parsed.words ?? [];
    console.log("🔍 [12] Words array source:", parsed.final_words ? "final_words" : parsed.NBest?.[0]?.Words ? "NBest[0].Words" : parsed.Words ? "Words" : "none", "count:", words.length);

    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .insert({
        student_id: studentId,
        passage_title: passageTitle || "Untitled Passage",
        passage_id: selectedPassageId && !selectedPassageId.startsWith("demo-") ? selectedPassageId : null,
        fluency_score: fluencyScore,
        accuracy_score: accuracyScore,
        duration_seconds: durationSeconds,
        completeness_score: completenessScore,
        prosody_score: prosodyScore != null ? Math.round(prosodyScore) : null,
        wpm,
        last_attempted_segment: referenceText?.trim() ?? null,
      })
      .select("id")
      .single();
    if (aErr) {
      console.error("🔴 [DB] assessments insert failed:", aErr);
      throw aErr;
    }
    console.log("✅ [DB] Assessment inserted, id:", assessment.id);

    const wordRows = words.map((w: any, i: number) => {
      const pa = w.PronunciationAssessment ?? {};
      let errorType = (w.error_type ?? pa.ErrorType ?? "correct").toLowerCase();
      if (errorType === "none") errorType = "correct";
      if (!["correct", "substitution", "mispronunciation", "omission", "insertion"].includes(errorType)) {
        errorType = "correct";
      }
      return {
        assessment_id: assessment.id,
        word_index: w.word_index ?? i,
        word: w.word ?? w.Word ?? "",
        error_type: errorType,
        detected_word: errorType !== "correct" ? (w.word ?? w.Word ?? null) : null,
        confidence: Math.round(w.accuracy_score ?? pa.AccuracyScore ?? 0),
        offset_ms: w.offset_ms ?? Math.round((w.Offset ?? 0) / 10000),
        duration_ms: w.duration_ms ?? Math.round((w.Duration ?? 0) / 10000),
      };
    });
    console.log("🔍 [13] Sample word row:", JSON.stringify(wordRows[0]));

    if (wordRows.length > 0) {
      const { data: insertedWords, error: wErr } = await supabase
        .from("word_assessments")
        .insert(wordRows)
        .select("id, word_index");
      if (wErr) {
        console.error("🔴 [DB] word_assessments insert failed:", wErr);
        throw wErr;
      }
      console.log("✅ [DB] Words inserted:", insertedWords?.length);

      const phonemeRows: any[] = [];
      (insertedWords ?? []).forEach(iw => {
        const sourceWord = words[iw.word_index];
        const phonemes = sourceWord?.phonemes ?? sourceWord?.Phonemes ?? sourceWord?.PronunciationAssessment?.Phonemes ?? [];
        phonemes.forEach((p: any) => {
          phonemeRows.push({
            word_assessment_id: iw.id,
            phoneme: p.phoneme ?? p.Phoneme ?? "",
            expected: p.phoneme ?? p.Phoneme ?? p.expected ?? "",
            quality: Math.round(p.accuracy_score ?? p.PronunciationAssessment?.AccuracyScore ?? p.quality ?? 0),
          });
        });
      });
      console.log("🔍 [14] Phoneme rows to insert:", phonemeRows.length, "sample:", JSON.stringify(phonemeRows[0]));

      if (phonemeRows.length > 0) {
        const { error: pErr } = await supabase.from("phoneme_details").insert(phonemeRows);
        if (pErr) {
          console.error("🔴 [DB] phoneme_details insert failed:", pErr);
          throw pErr;
        }
        console.log("✅ [DB] Phonemes inserted:", phonemeRows.length);
      }
    }

    // Fire-and-forget cluster analysis (non-blocking, non-fatal)
    supabase
      .from("students")
      .select("class_id")
      .eq("id", studentId)
      .single()
      .then(({ data: studentRow }) => {
        if (studentRow?.class_id) {
          runClusterAnalysis(studentId, studentRow.class_id, wordRows).then(() => {
            queryClient.invalidateQueries({ queryKey: ["clusters"] });
          });
        }
      });
  };

  const assessAudio = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error("No audio recorded");
      if (!referenceText.trim()) throw new Error("Reference text is required");

      console.log("🎙️ [AUDIO] Blob size:", audioBlob.size, "bytes, type:", audioBlob.type);
      const audioBase64 = await blobToBase64(audioBlob);
      console.log("🎙️ [AUDIO] Base64 length:", audioBase64.length, "first 20 chars:", audioBase64.slice(0, 20));

      console.log("🚀 [EDGE] Calling assess-pronunciation with referenceText length:", referenceText.trim().length);
      const { data, error } = await supabase.functions.invoke("assess-pronunciation", {
        body: { audioBase64, referenceText: referenceText.trim() },
      });

      console.log("🚀 [EDGE] Raw invoke result → error:", error, "data type:", typeof data, "data:", JSON.stringify(data)?.slice(0, 300));

      if (error) throw new Error(error.message || "Azure assessment failed");

      // Unwrap Supabase's {"_type":"String","value":"..."} wrapper if present
      let parsed = data;
      if (parsed?._type === "String" && typeof parsed.value === "string") {
        console.log("🔄 [UNWRAP] Detected _type:String wrapper, parsing .value");
        parsed = JSON.parse(parsed.value);
      } else if (typeof parsed === "string") {
        console.log("🔄 [UNWRAP] Detected plain string response, parsing");
        parsed = JSON.parse(parsed);
      } else {
        console.log("🔄 [UNWRAP] Data is already an object, no unwrapping needed");
      }

      if (parsed?.error) throw new Error(parsed.error);
      return await saveAssessment(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-detail"] });
      queryClient.invalidateQueries({ queryKey: ["student-card-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast({ title: "Assessment saved!", description: `Assessment for ${studentName} stored.` });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const submitJsonAssessment = useMutation({
    mutationFn: async () => {
      setParseError("");
      let parsed: any;
      try { parsed = JSON.parse(jsonInput); } catch {
        throw new Error("Invalid JSON.");
      }
      return await saveAssessment(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-detail"] });
      queryClient.invalidateQueries({ queryKey: ["student-card-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast({ title: "Assessment saved!" });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setParseError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedPassageId("");
    setReferenceText("");
    setPassageTitle("");
    setJsonInput("");
    setParseError("");
    resetAudio();
  };

  const isProcessing = assessAudio.isPending || submitJsonAssessment.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Mic className="w-4 h-4" /> Start Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Assessment for {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Passage selector */}
          <div>
            <Label>Select Passage from Library</Label>
            <Select value={selectedPassageId} onValueChange={handlePassageSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a saved passage..." />
              </SelectTrigger>
              <SelectContent>
                {(passages ?? []).length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No passages yet. Add some in the Assessments Library.
                  </div>
                ) : (
                  (passages ?? []).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{p.title}</span>
                        <span className="text-xs text-muted-foreground">({p.word_count} words)</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="record">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record" className="gap-1.5"><Mic className="w-3.5 h-3.5" /> Record Audio</TabsTrigger>
              <TabsTrigger value="json" className="gap-1.5"><FileJson className="w-3.5 h-3.5" /> Paste JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-4 mt-4">
              <div>
                <Label>Reference Text</Label>
                <Textarea
                  value={referenceText}
                  onChange={e => setReferenceText(e.target.value)}
                  placeholder="The text the student should read..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} variant="outline" className="gap-2" disabled={isProcessing}>
                    <Mic className="w-4 h-4" /> Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="gap-2">
                    <Square className="w-4 h-4" /> Stop Recording
                  </Button>
                )}
                {isRecording && (
                  <span className="flex items-center gap-2 text-sm text-destructive">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" /> Recording...
                  </span>
                )}
                {audioBlob && !isRecording && (
                  <span className="text-sm text-muted-foreground">✓ Audio recorded ({(audioBlob.size / 1024).toFixed(0)} KB)</span>
                )}
              </div>

              <Button
                onClick={() => assessAudio.mutate()}
                disabled={!audioBlob || !referenceText.trim() || isProcessing}
                className="gap-2"
              >
                {assessAudio.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Assess & Import</>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2"><FileJson className="w-4 h-4" /> Azure JSON</Label>
                <Textarea
                  value={jsonInput}
                  onChange={e => { setJsonInput(e.target.value); setParseError(""); }}
                  placeholder="Paste Azure PronunciationAssessment JSON here..."
                  className="font-mono text-xs min-h-[200px]"
                />
                {parseError && <p className="text-sm text-destructive mt-1">{parseError}</p>}
              </div>
              <Button
                onClick={() => submitJsonAssessment.mutate()}
                disabled={!jsonInput || isProcessing}
                className="gap-2"
              >
                {submitJsonAssessment.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Import Assessment</>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartAssessmentDialog;
