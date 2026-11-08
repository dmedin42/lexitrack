import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileJson, Mic, Square, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useClasses, useStudents } from "@/hooks/useStudents";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const NewAssessment = () => {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const { data: students } = useStudents(selectedClassId || undefined);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [passageTitle, setPassageTitle] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      toast({ title: "Microphone Error", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  // Convert blob to WAV-like base64 for Azure
  const blobToBase64 = async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Mutation: Send audio to Azure edge function
  const assessAudio = useMutation({
    mutationFn: async () => {
      if (!audioBlob) throw new Error("No audio recorded");
      if (!referenceText.trim()) throw new Error("Reference text is required");

      const audioBase64 = await blobToBase64(audioBlob);

      const { data, error } = await supabase.functions.invoke("assess-pronunciation", {
        body: { audioBase64, referenceText: referenceText.trim() },
      });

      if (error) throw new Error(error.message || "Azure assessment failed");
      // Unwrap Supabase's {"_type":"String","value":"..."} wrapper if present
      let parsed = data;
      if (parsed?._type === "String" && typeof parsed.value === "string") {
        parsed = JSON.parse(parsed.value);
      } else if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      console.log("💎 UNWRAPPED DATA SHAPE:", {
        hasRecognitionStatus: !!parsed?.RecognitionStatus,
        hasFinalScores: !!parsed?.final_scores,
        topLevelKeys: parsed ? Object.keys(parsed) : [],
        accuracyScore: parsed?.PronunciationAssessment?.AccuracyScore ?? parsed?.final_scores?.accuracy_score ?? "N/A",
      });
      if (parsed?.error) throw new Error(parsed.error);
      return await saveAssessment(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-detail"] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast({ title: "Assessment saved!", description: "Azure pronunciation assessment stored." });
      setAudioBlob(null);
      setReferenceText("");
      setPassageTitle("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Shared: save parsed Azure JSON to Supabase
  const saveAssessment = async (parsed: any) => {
    // Support both edge function shape (final_scores/final_words) and raw Azure shape
    const scores = parsed.final_scores ?? parsed.NBest?.[0]?.PronunciationAssessment ?? parsed.PronunciationAssessment ?? {};
    const accuracyScore = Math.round(scores.accuracy_score ?? scores.AccuracyScore ?? parsed.accuracyScore ?? 0);
    const fluencyScore = Math.round(scores.fluency_score ?? scores.FluencyScore ?? parsed.fluencyScore ?? 0);
    const completenessScore = Math.round(scores.completeness_score ?? scores.CompletenessScore ?? 0);
    const prosodyScore = scores.prosody_score ?? scores.ProsodyScore ?? null;

    const words: any[] = parsed.final_words ?? parsed.NBest?.[0]?.Words ?? parsed.Words ?? parsed.words ?? [];

    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .insert({
        student_id: selectedStudentId,
        passage_title: passageTitle || "Untitled Passage",
        fluency_score: fluencyScore,
        accuracy_score: accuracyScore,
        duration_seconds: Math.round(parsed.duration_seconds ?? scores.duration_seconds ?? (parsed.Duration ?? 0) / 10000000),
        completeness_score: completenessScore,
        prosody_score: prosodyScore != null ? Math.round(prosodyScore) : null,
        wpm: Math.round(parsed.wpm ?? scores.wpm ?? 0),
        last_attempted_segment: referenceText?.trim() ?? null,
      })
      .select("id")
      .single();
    if (aErr) throw aErr;

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

    if (wordRows.length > 0) {
      const { data: insertedWords, error: wErr } = await supabase
        .from("word_assessments")
        .insert(wordRows)
        .select("id, word_index");
      if (wErr) throw wErr;

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

      if (phonemeRows.length > 0) {
        const { error: pErr } = await supabase.from("phoneme_details").insert(phonemeRows);
        if (pErr) throw pErr;
      }
    }
  };

  // Mutation: Import from pasted JSON
  const submitJsonAssessment = useMutation({
    mutationFn: async () => {
      setParseError("");
      let parsed: any;
      try {
        parsed = JSON.parse(jsonInput);
      } catch {
        throw new Error("Invalid JSON. Please paste valid Azure PronunciationAssessment JSON.");
      }
      return await saveAssessment(parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-detail"] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast({ title: "Assessment saved!", description: "Word and phoneme data has been stored." });
      setJsonInput("");
      setPassageTitle("");
    },
    onError: (err: any) => {
      setParseError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const isProcessing = assessAudio.isPending || submitJsonAssessment.isPending;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-3xl font-display font-extrabold text-foreground">New Assessment</h1>
          <p className="text-muted-foreground mt-1">Record audio or paste Azure JSON to create an assessment</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Student selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={v => { setSelectedClassId(v); setSelectedStudentId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.grade})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClassId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.avatar} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Passage Title</Label>
            <Input value={passageTitle} onChange={e => setPassageTitle(e.target.value)} placeholder="The Cat on the Mat" />
          </div>

          {/* Two modes: Record or Paste */}
          <Tabs defaultValue="record">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record" className="gap-1.5"><Mic className="w-3.5 h-3.5" /> Record Audio</TabsTrigger>
              <TabsTrigger value="json" className="gap-1.5"><FileJson className="w-3.5 h-3.5" /> Paste JSON</TabsTrigger>
            </TabsList>

            {/* === RECORD TAB === */}
            <TabsContent value="record" className="space-y-4 mt-4">
              <div>
                <Label>Reference Text (what the student should read)</Label>
                <Textarea
                  value={referenceText}
                  onChange={e => setReferenceText(e.target.value)}
                  placeholder="The little cat sat on the warm mat and watched the birds fly over the tall fence."
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
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Recording...
                  </span>
                )}

                {audioBlob && !isRecording && (
                  <span className="text-sm text-muted-foreground">
                    ✓ Audio recorded ({(audioBlob.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>

              <Button
                onClick={() => assessAudio.mutate()}
                disabled={!selectedStudentId || !audioBlob || !referenceText.trim() || isProcessing}
                className="gap-2"
              >
                {assessAudio.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Azure...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Assess & Import</>
                )}
              </Button>
            </TabsContent>

            {/* === JSON TAB === */}
            <TabsContent value="json" className="space-y-4 mt-4">
              <div>
                <Label className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" /> Azure JSON
                </Label>
                <Textarea
                  value={jsonInput}
                  onChange={e => { setJsonInput(e.target.value); setParseError(""); }}
                  placeholder='Paste Azure PronunciationAssessment JSON here...'
                  className="font-mono text-xs min-h-[200px]"
                />
                {parseError && <p className="text-sm text-destructive mt-1">{parseError}</p>}
              </div>

              <Button
                onClick={() => submitJsonAssessment.mutate()}
                disabled={!selectedStudentId || !jsonInput || isProcessing}
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
      </motion.div>
    </AppLayout>
  );
};

export default NewAssessment;
