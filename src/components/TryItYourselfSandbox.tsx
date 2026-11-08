import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, Timer, RotateCcw, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useAudioRecorder, blobToBase64 } from "@/hooks/useAudioRecorder";
import WordMap from "@/components/WordMap";
import { DEFAULT_GRADING_STRICTNESS } from "@/lib/grading";

const SANDBOX_PASSAGE =
  "The long trail goes high into the big mountains. Every step on the dusty path shows a new view of the green valley below. A cold wind blows through the trees. It makes a soft whistling sound. Small gray squirrels run across the trail to hide in the grass. High above, a large eagle flies in the blue sky. The air is cold and fresh at the top. You can see for miles in every way. It is a long walk to the reach the peak. But the beautiful view is worth all of the hard work.";

const RECORDING_LIMIT = 20;

type SandboxState = "idle" | "recording" | "analyzing" | "results";

interface SandboxResult {
  words: any[];
  wpm: number;
  accuracy: number;
}

const TryItYourselfSandbox = () => {
  const { isRecording, audioBlob, startRecording, stopRecording, resetAudio } = useAudioRecorder();
  const [state, setState] = useState<SandboxState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(RECORDING_LIMIT);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SandboxResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef(false);
  

  // Countdown timer
  useEffect(() => {
    if (state === "recording") {
      setSecondsLeft(RECORDING_LIMIT);
      autoStopRef.current = false;
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            autoStopRef.current = true;
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, stopRecording]);

  // When blob arrives, submit for analysis
  useEffect(() => {
    if (audioBlob && state === "recording") {
      handleAnalyze(audioBlob);
    }
  }, [audioBlob]);

  const handleStart = async () => {
    setError("");
    setResult(null);
    resetAudio();
    await startRecording();
    setState("recording");
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleAnalyze = useCallback(async (blob: Blob) => {
    setState("analyzing");
    setError("");
    try {
      const audioBase64 = await blobToBase64(blob);
      const sessionDurationMs = (RECORDING_LIMIT - secondsLeft) * 1000;
      const { data, error: fnErr } = await supabase.functions.invoke("assess-pronunciation", {
        body: {
          audioBase64,
          referenceText: SANDBOX_PASSAGE,
          studentId: "sandbox-demo",
          passageTitle: "Try It Yourself",
          skipSave: true,
          sessionDurationMs,
          gradingStrictness: DEFAULT_GRADING_STRICTNESS,
        },
      });
      if (fnErr) throw new Error(fnErr.message || "Assessment failed");

      let parsed = data;
      if (parsed?._type === "String" && typeof parsed.value === "string") {
        parsed = JSON.parse(parsed.value);
      } else if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      if (parsed?.error) throw new Error(parsed.error);

      const mappedWords = (parsed.final_words ?? []).map((w: any) => ({
        id: `word-${w.word_index}`,
        word: w.word,
        errorType: w.error_type,
        detectedWord: w.error_type !== "correct" ? w.word : undefined,
        phonemes: (w.phonemes ?? []).map((p: any) => ({
          phoneme: p.phoneme,
          expected: p.expected,
          quality: p.accuracy_score,
        })),
        confidence: w.accuracy_score,
        offsetMs: w.offset_ms,
        durationMs: w.duration_ms,
        vouched: false,
      }));

      const finalScores = parsed.final_scores ?? {};
      setResult({
        words: mappedWords,
        wpm: parsed.wpm ?? 0,
        accuracy: finalScores.accuracy_score ?? 0,
      });
      setState("results");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setState("idle");
    }
  }, []);

  const handleReset = () => {
    resetAudio();
    setResult(null);
    setError("");
    setState("idle");
    setSecondsLeft(RECORDING_LIMIT);
  };

  const formatTime = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  const isTimerWarning = secondsLeft <= 5 && secondsLeft > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {/* IDLE — Show passage + start button */}
        {state === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border shadow-elevated overflow-hidden">
              <CardContent className="p-0">
                {/* Passage area */}
                <div className="p-6 sm:p-8 bg-secondary/30 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Reading Passage</p>
                  <p className="text-lg sm:text-xl leading-relaxed text-foreground font-medium line-clamp-3">
                    {SANDBOX_PASSAGE}
                  </p>
                </div>

                {/* Controls */}
                <div className="p-6 sm:p-8 flex flex-col items-center gap-4">

                  {error && (
                    <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg w-full text-center">
                      {error}
                    </p>
                  )}
                  <Button onClick={handleStart} size="lg" className="w-full max-w-xs h-14 text-lg gap-3 rounded-2xl">
                    <Mic className="w-5 h-5" /> Start Recording
                  </Button>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    20-second recording — read as much as you can!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* RECORDING */}
        {state === "recording" && (
          <motion.div key="recording" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border shadow-elevated overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 sm:p-8 bg-secondary/30 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Read this aloud</p>
                  <p className="text-lg sm:text-xl leading-relaxed text-foreground font-medium">
                    {SANDBOX_PASSAGE}
                  </p>
                </div>

                <div className="p-6 sm:p-8 flex flex-col items-center gap-4">
                  {/* Timer */}
                  <div className={`flex items-center gap-3 font-mono text-4xl font-bold tabular-nums transition-colors ${
                    isTimerWarning ? "text-destructive" : "text-foreground"
                  }`}>
                    <Timer className={`w-7 h-7 ${isTimerWarning ? "animate-pulse" : ""}`} />
                    {formatTime(secondsLeft)}
                  </div>

                  <div className="flex items-center gap-3 text-destructive font-bold text-lg">
                    <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    Recording... Read out loud!
                  </div>

                  <Button onClick={handleStop} size="lg" variant="destructive" className="w-full max-w-xs h-14 text-lg gap-3 rounded-2xl">
                    <Square className="w-5 h-5" /> Stop Early
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ANALYZING */}
        {state === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-border shadow-elevated">
              <CardContent className="py-16 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <h3 className="font-display font-extrabold text-2xl text-foreground">Analyzing your reading...</h3>
                <p className="text-muted-foreground">Our AI is processing your pronunciation right now.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* RESULTS — full analytics */}
        {state === "results" && result && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border shadow-card">
                <CardContent className="p-5 text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Words Per Minute</p>
                  <p className="text-4xl font-display font-extrabold text-primary">{result.wpm}</p>
                  <p className="text-xs text-muted-foreground mt-1">WPM</p>
                </CardContent>
              </Card>
              <Card className="border-border shadow-card">
                <CardContent className="p-5 text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Accuracy</p>
                  <p className="text-4xl font-display font-extrabold text-primary">{result.accuracy}%</p>
                  <p className="text-xs text-muted-foreground mt-1">correct</p>
                </CardContent>
              </Card>
            </div>

            {/* Word Map */}
            <Card className="border-border shadow-elevated">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg text-foreground mb-1">Your Reading Map</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tap any highlighted word for a phoneme-level deep dive.
                </p>
                <WordMap words={result.words} enableDeepDive={true} showVouch={false} />
              </CardContent>
            </Card>

            {/* Try again */}
            <div className="flex justify-center">
              <Button onClick={handleReset} variant="outline" size="lg" className="gap-2 rounded-2xl">
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TryItYourselfSandbox;
