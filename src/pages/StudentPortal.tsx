/**
 * StudentPortal — Zero-Distraction Assessment Environment
 *
 * HB 273 Non-Addictive Design Compliance (2026):
 * - No infinite scroll, autoplay, or time-based gamification rewards
 * - Single-task UI focused solely on the reading assessment
 * - Minimal chrome: no navigation links, no social features, no notifications
 * - Recording requires explicit user action; timer is academic, not engagement-driven
 * - "Attempts" limit (MAX_RECORDING_ATTEMPTS) is pedagogical, not retention-based
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import lexitrackLogo from "@/assets/lexitrack-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, LogOut, BookOpen, Timer, Send, RotateCcw, MessageCircle, Star } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { getStudentSession, clearStudentSession } from "@/hooks/useStudentSession";
import { useAudioRecorder, blobToBase64 } from "@/hooks/useAudioRecorder";
import { useQueryClient } from "@tanstack/react-query";
import { runClusterAnalysis } from "@/lib/clusterAnalysis";
import { notifyAssessmentSaved } from "@/hooks/useRealtimeSync";
import { runSanityCheck } from "@/lib/sanityCheck";
import WordMap from "@/components/WordMap";
import VoiceMeter from "@/components/VoiceMeter";
import LexiController from "@/components/LexiController";

const DEFAULT_RECORDING_SECONDS = 60;
const RETELL_RECORDING_LIMIT = 60;

interface AssignmentData {
  id: string;
  passage_id: string;
  passage_title: string;
  passage_content: string;
  is_open: boolean;
  word_map_enabled: boolean;
  deep_dive_enabled: boolean;
}

type PortalState = "loading" | "assignment" | "recording" | "review" | "analyzing" | "retell" | "done" | "no-assignment";

const StudentPortal = () => {
  const navigate = useNavigate();
  const { teacherCode } = useParams<{ teacherCode: string }>();
  const queryClient = useQueryClient();
  const session = getStudentSession();
  const { isRecording, audioBlob, mediaStream, startRecording, stopRecording, resetAudio } = useAudioRecorder();

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [portalState, setPortalState] = useState<PortalState>("loading");
  const [error, setError] = useState("");
  const [resultWords, setResultWords] = useState<any[]>([]);
  const [resultScores, setResultScores] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [recordingAttempt, setRecordingAttempt] = useState(1);
  const [savedAudioBlob, setSavedAudioBlob] = useState<Blob | null>(null);
  const [fontSize, setFontSize] = useState<"standard" | "large" | "xlarge">("standard");
  const [savedAssessmentId, setSavedAssessmentId] = useState<string | null>(null);
  const savedAssessmentIdRef = useRef<string | null>(null);
  const [sanityFlag, setSanityFlag] = useState<string | null>(null);

  // Background processing indicator
  const [bgProcessing, setBgProcessing] = useState(false);

  // Retell state
  const [isRetelling, setIsRetelling] = useState(false);
  const [retellTranscript, setRetellTranscript] = useState<string | null>(null);
  const [retellAnalyzing, setRetellAnalyzing] = useState(false);
  const [retellError, setRetellError] = useState("");
  const [retellSecondsLeft, setRetellSecondsLeft] = useState(RETELL_RECORDING_LIMIT);
  const retellTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retellAutoStopRef = useRef(false);
  const {
    isRecording: isRetellRecording,
    audioBlob: retellBlob,
    mediaStream: retellStream,
    startRecording: startRetellRecording,
    stopRecording: stopRetellRecording,
    resetAudio: resetRetellAudio,
  } = useAudioRecorder();

  // Database-driven timer settings
  const [showTimer, setShowTimer] = useState(false);
  const [recordingLimit, setRecordingLimit] = useState<number>(DEFAULT_RECORDING_SECONDS);
  const [secondsLeft, setSecondsLeft] = useState<number>(DEFAULT_RECORDING_SECONDS);
  const [classSettingsLoaded, setClassSettingsLoaded] = useState(false);
  const [enableRetell, setEnableRetell] = useState(false);
  const [classWordMap, setClassWordMap] = useState(false);
  const [classDeepDive, setClassDeepDive] = useState(false);
  const [showRetellTranscript, setShowRetellTranscript] = useState(false);
  const [gradingStrictness, setGradingStrictness] = useState(8.5);
  const [showWpmToStudent, setShowWpmToStudent] = useState(false);
  const [showAccuracyToStudent, setShowAccuracyToStudent] = useState(false);
  const [maxRecordingAttempts, setMaxRecordingAttempts] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lexi mic check — required before every assessment (not persisted)
  const [lexiOnboardingDone, setLexiOnboardingDone] = useState(false);
  const handleLexiComplete = useCallback(() => {
    setLexiOnboardingDone(true);
  }, []);

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate(`/student/${teacherCode ?? ""}`);
  }, []);

  // Fetch class settings
  useEffect(() => {
    if (!session?.classId) return;
    const fetchClassSettings = async () => {
      console.log("📚 Fetching class settings for classId:", session.classId);
      const { data, error: fetchErr } = await (supabase as any)
        .from("classes")
        .select("default_time_limit, show_timer_to_student, enable_retell, word_map_enabled, deep_dive_enabled, grading_strictness, show_wpm_to_student, show_accuracy_to_student, allow_second_attempt, show_retell_transcript")
        .eq("id", session.classId)
        .single();
      console.log("📚 Class settings response:", data, "error:", fetchErr);
      if (data) {
        const limit = data.default_time_limit ?? DEFAULT_RECORDING_SECONDS;
        setRecordingLimit(limit);
        setSecondsLeft(limit);
        setShowTimer(data.show_timer_to_student ?? false);
        setEnableRetell(data.enable_retell ?? false);
        setClassWordMap(data.word_map_enabled ?? false);
        setClassDeepDive(data.deep_dive_enabled ?? false);
        setGradingStrictness(data.grading_strictness ?? 8.5);
        setShowWpmToStudent(data.show_wpm_to_student ?? false);
        setShowAccuracyToStudent(data.show_accuracy_to_student ?? false);
        setMaxRecordingAttempts(data.allow_second_attempt ? 2 : 1);
        setShowRetellTranscript(data.show_retell_transcript ?? false);
      }
      setClassSettingsLoaded(true);
    };
    fetchClassSettings();
  }, [session?.classId]);

  // Session storage for completed assignments
  const getCompletedAssignments = (): string[] => {
    try {
      return JSON.parse(sessionStorage.getItem("lexitrack-completed-assignments") || "[]");
    } catch { return []; }
  };
  const markAssignmentCompleted = (assignmentId: string) => {
    try {
      const completed = getCompletedAssignments();
      if (!completed.includes(assignmentId)) {
        completed.push(assignmentId);
        sessionStorage.setItem("lexitrack-completed-assignments", JSON.stringify(completed));
      }
    } catch {}
  };

  // Fetch assignment on mount
  useEffect(() => {
    if (!session) return;
    const fetchAssignment = async () => {
      setPortalState("loading");
      const { data, error } = await (supabase as any).rpc("get_assignment_for_student", {
        student_id_input: session.studentId,
      });
      if (error) {
        console.error("Assignment fetch error:", error);
        setPortalState("no-assignment");
        return;
      }
      const rows = data as AssignmentData[];
      if (!rows || rows.length === 0) {
        setPortalState("no-assignment");
        return;
      }
      const asgn = rows[0];
      const alreadyDone = !asgn.is_open || getCompletedAssignments().includes(asgn.id);
      setAssignment(asgn);
      setPortalState(alreadyDone ? "no-assignment" : "assignment");
    };
    fetchAssignment();
  }, [session?.studentId]);

  // Countdown timer while recording
  const autoStopRef = useRef(false);
  useEffect(() => {
    if (portalState === "recording") {
      autoStopRef.current = false;
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [portalState]);

  // Auto-stop recording when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && portalState === "recording" && isRecording && !autoStopRef.current) {
      autoStopRef.current = true;
      stopRecording();
    }
  }, [secondsLeft, portalState, isRecording]);

  // ─── AUTO-SUBMIT LOGIC ───
  // When recording stops and blob is ready:
  //   - If repeat OFF (maxRecordingAttempts === 1): auto-submit immediately
  //   - If repeat ON: go to review screen for "Try Again" / "Keep Going"
  useEffect(() => {
    if (audioBlob && portalState === "recording") {
      setSavedAudioBlob(audioBlob);
      if (maxRecordingAttempts <= 1) {
        // Auto-submit: skip review screen entirely
        autoSubmitRecording(audioBlob);
      } else {
        setPortalState("review");
      }
    }
  }, [audioBlob]);

  // When retell blob arrives, send for STT
  useEffect(() => {
    if (retellBlob && isRetelling) {
      handleRetellAnalyze(retellBlob);
    }
  }, [retellBlob]);

  const handleStartRecording = async () => {
    setSecondsLeft(recordingLimit);
    resetAudio();
    setSavedAudioBlob(null);
    setError("");
    await startRecording();
    setPortalState("recording");
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleReRecord = async () => {
    if (recordingAttempt >= maxRecordingAttempts) return;
    setRecordingAttempt(prev => prev + 1);
    setSavedAudioBlob(null);
    setSecondsLeft(recordingLimit);
    resetAudio();
    setError("");
    await startRecording();
    setPortalState("recording");
  };

  // ─── Core submission logic (used by both auto-submit and manual submit) ───
  const submitRecordingBlob = async (blob: Blob) => {
    if (!assignment || !session) return;
    setError("");
    try {
      const audioBase64 = await blobToBase64(blob);
      const sessionDurationMs = (recordingLimit - secondsLeft) * 1000;

      const { data, error: fnErr } = await supabase.functions.invoke("assess-pronunciation", {
        body: {
          audioBase64,
          referenceText: assignment.passage_content,
          studentId: session.studentId,
          passageTitle: assignment.passage_title,
          gradingStrictness,
          sessionDurationMs,
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

      console.log("📊 FULL parsed response keys:", Object.keys(parsed));

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
      setResultWords(mappedWords);

      const finalScores = parsed.final_scores ?? {};
      const rawWpm = parsed.wpm ?? 0;
      const rawAccuracy = finalScores.accuracy_score ?? 0;

      // ── Sanity Check Guardrail ──
      const sanity = runSanityCheck(rawWpm, rawAccuracy);
      setSanityFlag(sanity.flag);
      const capturedWpm = sanity.wpm;
      const capturedAccuracy = sanity.accuracy;

      if (sanity.flag === "high_interference") {
        console.warn("⚠️ SANITY CHECK:", sanity.reason);
        // Update the assessment row with the flag
        if (parsed.assessmentId) {
          await (supabase as any)
            .from("assessments")
            .update({ wpm: 0, accuracy_score: 0 })
            .eq("id", parsed.assessmentId);
        }
      }

      setResultScores({ wpm: capturedWpm, accuracy: capturedAccuracy });
      const capturedId = parsed.assessmentId ?? null;
      savedAssessmentIdRef.current = capturedId;
      setSavedAssessmentId(capturedId);
      console.log("🎯 Assessment ID captured:", capturedId);

      // Close assignment
      await (supabase as any)
        .from("active_assignments")
        .update({ is_open: false })
        .eq("id", assignment.id);
      markAssignmentCompleted(assignment.id);

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["student-detail", session.studentId] });
      queryClient.invalidateQueries({ queryKey: ["student-card-assessments", session.studentId] });
      queryClient.invalidateQueries({ queryKey: ["word-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["active-assignments"] });

      const wordRows = (parsed.final_words ?? []).map((w: any) => ({ error_type: w.error_type }));
      if (session.classId && wordRows.length > 0) {
        runClusterAnalysis(session.studentId, session.classId, wordRows).then(() => {
          queryClient.invalidateQueries({ queryKey: ["clusters"] });
        });
      }

      notifyAssessmentSaved(session.studentId, parsed.assessmentId, {
        studentName: session.studentName ?? session.username,
        accuracy: capturedAccuracy,
        wpm: capturedWpm,
      });

      return parsed;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      throw err;
    }
  };

  // Auto-submit: immediately transition, process in background if retell is ON
  const autoSubmitRecording = async (blob: Blob) => {
    if (enableRetell) {
      // ── PARALLEL PROCESSING ──
      // Transition to retell immediately; process reading audio in background
      setPortalState("retell");
      setBgProcessing(true);
      resetAudio();

      submitRecordingBlob(blob)
        .then(() => setBgProcessing(false))
        .catch(() => {
          setBgProcessing(false);
          // Error is set by submitRecordingBlob, but student is already on retell
        });
    } else {
      // No retell → show analyzing, then done
      setPortalState("analyzing");
      try {
        await submitRecordingBlob(blob);
        setPortalState("done");
      } catch {
        setPortalState("review");
      }
    }
  };

  // Manual submit from review screen
  const handleSubmitRecording = async () => {
    if (!savedAudioBlob) return;
    if (enableRetell) {
      setPortalState("retell");
      setBgProcessing(true);
      resetAudio();
      submitRecordingBlob(savedAudioBlob)
        .then(() => setBgProcessing(false))
        .catch(() => setBgProcessing(false));
    } else {
      setPortalState("analyzing");
      try {
        await submitRecordingBlob(savedAudioBlob);
        setPortalState("done");
      } catch {
        setPortalState("review");
      }
    }
  };

  // ── Retell Handlers ──
  const handleStartRetell = async () => {
    setRetellError("");
    setRetellTranscript(null);
    resetRetellAudio();
    setIsRetelling(true);
    setRetellSecondsLeft(RETELL_RECORDING_LIMIT);
    retellAutoStopRef.current = false;
    await startRetellRecording();

    retellTimerRef.current = setInterval(() => {
      setRetellSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(retellTimerRef.current!);
          retellAutoStopRef.current = true;
          stopRetellRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRetell = () => {
    if (retellTimerRef.current) clearInterval(retellTimerRef.current);
    stopRetellRecording();
  };

  // Wait for assessment ID from background pronunciation processing
  const waitForAssessmentId = useCallback(async (maxWaitMs = 15000): Promise<string | null> => {
    // Check ref immediately (fastest path)
    if (savedAssessmentIdRef.current) return savedAssessmentIdRef.current;

    const pollInterval = 500;
    const maxAttempts = Math.ceil(maxWaitMs / pollInterval);
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, pollInterval));
      if (savedAssessmentIdRef.current) {
        console.log(`🎯 Assessment ID resolved after ${(i + 1) * pollInterval}ms`);
        return savedAssessmentIdRef.current;
      }
    }
    console.warn("⚠️ Assessment ID not resolved after", maxWaitMs, "ms");
    return null;
  }, []);

  const handleRetellAnalyze = async (blob: Blob) => {
    setRetellAnalyzing(true);
    setRetellError("");
    try {
      const audioBase64 = await blobToBase64(blob);
      const { data, error: fnErr } = await supabase.functions.invoke("transcribe-retell", {
        body: { audioBase64 },
      });
      if (fnErr) throw new Error(fnErr.message || "Transcription failed");

      let parsed = data;
      if (parsed?._type === "String" && typeof parsed.value === "string") {
        parsed = JSON.parse(parsed.value);
      } else if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      const transcript = parsed.transcript || "";
      setRetellTranscript(transcript);
      setIsRetelling(false);

      if (transcript) {
        // Wait for the pronunciation phase to finish and deliver the ID
        const assessmentId = await waitForAssessmentId(15000);

        if (assessmentId) {
          console.log("✅ Linking retell to assessment:", assessmentId);

          // Flag for review if retell is too short or scores are 0
          const retellTooShort = transcript.length < 3;
          const scoresZero = (resultScores?.wpm ?? 0) === 0 || (resultScores?.accuracy ?? 0) === 0;
          const shouldFlagReview = retellTooShort || scoresZero;

          const updatePayload: Record<string, any> = { retell_transcription: transcript };
          if (shouldFlagReview) {
            updatePayload.in_review = true;
          }

          await (supabase as any)
            .from("assessments")
            .update(updatePayload)
            .eq("id", assessmentId);

          await supabase.functions.invoke("assess-pronunciation", {
            body: {
              scoreComprehension: true,
              assessmentId,
              retellTranscription: transcript,
              referenceText: assignment?.passage_content ?? "",
              wpm: resultScores?.wpm ?? 0,
              accuracy: resultScores?.accuracy ?? 0,
            },
          });

          queryClient.invalidateQueries({ queryKey: ["student-detail"] });
        } else {
          // Recovery: save transcript to localStorage so teacher can manually link
          console.error("❌ Assessment ID not found after polling. Saving transcript locally for recovery.");
          try {
            const recovery = JSON.parse(localStorage.getItem("lexitrack-retell-recovery") || "[]");
            recovery.push({
              studentId: session?.studentId,
              transcript,
              timestamp: new Date().toISOString(),
              passageTitle: assignment?.passage_title,
            });
            localStorage.setItem("lexitrack-retell-recovery", JSON.stringify(recovery));
          } catch {}
          setRetellError("Your retell was recorded but could not be linked to your reading. Your teacher will be notified.");
        }
      }

      setRetellAnalyzing(false);
      setPortalState("done");
    } catch (err: any) {
      setRetellError(err.message ?? "Could not transcribe. Please try again.");
      setIsRetelling(false);
      setRetellAnalyzing(false);
    }
  };

  const handleLogout = () => {
    clearStudentSession();
    navigate(`/student/${teacherCode ?? ""}`);
  };

  const isTimerWarning = secondsLeft <= 10 && secondsLeft > 0;
  const isTimerExpired = secondsLeft === 0;
  const canReRecord = recordingAttempt < maxRecordingAttempts;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src={lexitrackLogo} alt="LexiTrack" className="h-8 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          {/* Background processing indicator */}
          {bgProcessing && (
            <motion.div
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Star className="w-4 h-4 text-primary fill-primary" />
              </motion.div>
              <span>Saving...</span>
            </motion.div>
          )}
          <span className="text-sm text-muted-foreground">
            {session.avatar} {session.username}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className={`mx-auto px-4 sm:px-6 py-10 ${(portalState === "assignment" || portalState === "recording") && lexiOnboardingDone ? "max-w-5xl" : "max-w-2xl"}`}>
        {/* Lexi Controller — only show when student has an active assignment */}
        {assignment && portalState !== "no-assignment" && portalState !== "loading" && portalState !== "done" && (
          <LexiController
            onOnboardingComplete={handleLexiComplete}
            isReading={portalState === "recording"}
            externalStream={mediaStream}
            
          />
        )}

        <AnimatePresence mode="wait">

          {/* LOADING */}
          {portalState === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Loading your assignment...</p>
            </motion.div>
          )}

          {/* NO ASSIGNMENT */}
          {portalState === "no-assignment" && (
            <motion.div key="no-assignment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-20">
              <h1 className="text-4xl font-display font-extrabold text-foreground mb-3">
                Great job, {session.username}!
              </h1>
              <p className="text-xl text-muted-foreground">
                You are all done for now. See you next time!
              </p>
            </motion.div>
          )}

          {/* ASSIGNMENT — show passage + record button (only after Lexi onboarding) */}
          {(portalState === "assignment" || portalState === "recording") && assignment && lexiOnboardingDone && (
            <motion.div key="assignment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <p className="text-muted-foreground text-lg mb-1">
                  Hi, <span className="font-bold text-foreground">{session.username}</span>!
                </p>
                <h1 className="text-3xl font-display font-extrabold text-foreground">
                  Time to read!
                </h1>
              </div>

              {/* Font Size Toggle */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Font Size:</span>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setFontSize("standard")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${fontSize === "standard" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setFontSize("large")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${fontSize === "large" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
                  >
                    Large
                  </button>
                  <button
                    onClick={() => setFontSize("xlarge")}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${fontSize === "xlarge" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
                  >
                    X-Large
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg mb-4">
                  {error}
                </p>
              )}

              {/* Recording controls */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {portalState === "assignment" && (
                  <>
                    <Button
                      onClick={handleStartRecording}
                      size="lg"
                      className="w-full max-w-sm h-16 text-xl gap-3 rounded-2xl"
                      disabled={!classSettingsLoaded}
                    >
                      <Mic className="w-6 h-6" /> {classSettingsLoaded ? "Start Recording" : "Loading..."}
                    </Button>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" />
                      {showTimer ? `You have ${formatTime(recordingLimit)} to read` : "Press Start when you're ready"}
                    </p>
                  </>
                )}

                {portalState === "recording" && (
                  <>
                    {showTimer && (
                      <div className={`flex items-center gap-3 font-mono text-4xl font-bold tabular-nums transition-colors ${
                        isTimerExpired ? "text-destructive animate-pulse" :
                        isTimerWarning ? "text-destructive" : "text-foreground"
                      }`}>
                        <Timer className={`w-7 h-7 ${isTimerWarning || isTimerExpired ? "animate-pulse" : ""}`} />
                        {formatTime(secondsLeft)}
                      </div>
                    )}

                    {isTimerExpired && showTimer && (
                      <p className="text-sm text-destructive font-semibold">
                        Time's up!
                      </p>
                    )}

                    {/* VoiceMeter removed — Lexi handles volume feedback */}

                    <div className="flex items-center gap-3 text-destructive font-bold text-lg">
                      <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                      Recording... Read out loud!
                    </div>

                    <Button
                      onClick={handleStopRecording}
                      size="lg"
                      variant="destructive"
                      className="w-full max-w-sm h-16 text-xl gap-3 rounded-2xl"
                    >
                      <Square className="w-6 h-6" /> Stop Recording
                    </Button>
                  </>
                )}
              </div>

              {/* Reading passage */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated mb-6">
                <h2 className="font-display font-bold text-xl text-primary mb-4">
                  {assignment.passage_title}
                </h2>
                <p className={`leading-relaxed text-foreground font-medium ${fontSize === "xlarge" ? "text-4xl" : fontSize === "large" ? "text-2xl" : "text-lg"}`}>
                  {assignment.passage_content}
                </p>
              </div>
            </motion.div>
          )}

          {/* REVIEW — only shown when repeat is ON */}
          {portalState === "review" && assignment && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">
                  Ready to submit?
                </h1>
                <p className="text-lg text-muted-foreground">
                  You can submit your recording or try again{canReRecord ? "" : " (no more attempts)"}.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Attempt {recordingAttempt} of {maxRecordingAttempts}
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated mb-6">
                <h2 className="font-display font-bold text-xl text-primary mb-4">
                  {assignment.passage_title}
                </h2>
                <p className={`leading-relaxed text-foreground font-medium ${fontSize === "xlarge" ? "text-4xl" : fontSize === "large" ? "text-2xl" : "text-lg"}`}>
                  {assignment.passage_content}
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg mb-4">
                  {error}
                </p>
              )}

              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={handleSubmitRecording}
                  size="lg"
                  className="w-full max-w-sm h-16 text-xl gap-3 rounded-2xl"
                >
                  <Send className="w-6 h-6" /> Keep Going
                </Button>

                {canReRecord && (
                  <Button
                    onClick={handleReRecord}
                    size="lg"
                    variant="outline"
                    className="w-full max-w-sm h-14 text-lg gap-3 rounded-2xl"
                  >
                    <RotateCcw className="w-5 h-5" /> Try Again
                  </Button>
                )}

                {!canReRecord && (
                  <p className="text-sm text-muted-foreground">
                    No more re-records available. Please submit your reading.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ANALYZING */}
          {portalState === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-20">
              <h1 className="text-3xl font-display font-extrabold text-foreground mb-3">
                Great reading!
              </h1>
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-lg text-muted-foreground">
                Analyzing your reading... just a moment!
              </p>
            </motion.div>
          )}

          {/* RETELL */}
          {portalState === "retell" && (
            <motion.div key="retell" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 mb-6">
                <div className="text-center mb-6">
                  <MessageCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">
                    What happened in the story?
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Tell me in your own words. Take your time!
                  </p>
                </div>

                {retellError && (
                  <p className="text-sm text-destructive font-medium bg-destructive/10 px-3 py-2 rounded-lg mb-4 text-center">
                    {retellError}
                  </p>
                )}

                <div className="flex flex-col items-center gap-4">
                  {/* Not yet recorded */}
                  {!isRetelling && !retellTranscript && !retellAnalyzing && (
                    <Button
                      onClick={handleStartRetell}
                      size="lg"
                      className="w-full max-w-sm h-16 text-xl gap-3 rounded-2xl"
                    >
                      <Mic className="w-6 h-6" /> Record Retell
                    </Button>
                  )}

                  {/* Currently recording */}
                  {isRetellRecording && (
                    <>
                      <div className="flex items-center gap-2 font-mono text-2xl font-bold tabular-nums text-primary">
                        <Timer className="w-5 h-5" />
                        {formatTime(retellSecondsLeft)}
                      </div>

                      {/* Voice Meter for retell */}
                      <VoiceMeter stream={retellStream} active={isRetellRecording} />

                      <div className="flex items-center gap-3 text-primary font-bold text-lg">
                        <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                        Listening... tell me about the story!
                      </div>
                      <Button
                        onClick={handleStopRetell}
                        size="lg"
                        variant="destructive"
                        className="w-full max-w-sm h-16 text-xl gap-3 rounded-2xl"
                      >
                        <Square className="w-6 h-6" /> I'm Done
                      </Button>
                    </>
                  )}

                  {/* Processing retell */}
                  {retellAnalyzing && (
                    <div className="text-center py-6">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                      <p className="text-lg font-medium text-foreground mb-1">Great job!</p>
                      <p className="text-muted-foreground">Saving your response...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Background processing indicator on retell screen */}
              {bgProcessing && (
                <motion.div
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Star className="w-4 h-4 text-primary fill-primary" />
                  </motion.div>
                  <span>Your reading is still being analyzed...</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* DONE */}
          {portalState === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-display font-extrabold text-foreground mb-2">
                  Amazing job, {session.username}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your teacher will see your results.
                </p>
              </div>

              {/* Confidence Shield: hide scores when flagged, show encouragement instead */}
              {sanityFlag === "high_interference" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="max-w-sm mx-auto mb-6 text-center"
                >
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="text-5xl mb-4"
                    >
                      ⭐
                    </motion.div>
                    <p className="text-xl font-display font-bold text-foreground mb-2">
                      Great reading!
                    </p>
                    <p className="text-muted-foreground">
                      Your teacher is looking at your story now!
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-start gap-6 max-w-2xl mx-auto">
                  {/* Left: Stats + Retell modules */}
                  <div className="flex-1">
                    {/* Stats feedback — only shown when data is valid */}
                    {resultScores && (showWpmToStudent || showAccuracyToStudent) && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className={`grid gap-4 mb-6 ${showWpmToStudent && showAccuracyToStudent ? "grid-cols-2" : "grid-cols-1"}`}
                      >
                        {showWpmToStudent && (
                          <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-card">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Words Per Minute</p>
                            <p className="text-3xl font-display font-extrabold text-primary">{resultScores.wpm}</p>
                            <p className="text-xs text-muted-foreground">WPM</p>
                          </div>
                        )}
                        {showAccuracyToStudent && (
                          <div className="bg-card border border-border rounded-2xl p-5 text-center shadow-card">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Accuracy</p>
                            <p className="text-3xl font-display font-extrabold text-primary">{resultScores.accuracy}%</p>
                            <p className="text-xs text-muted-foreground">correct</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Retell Transcript */}
                    {retellTranscript && showRetellTranscript && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mb-6"
                      >
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-primary" />
                            <p className="text-xs text-muted-foreground font-medium">Your Retell</p>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{retellTranscript}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Right: Lexi Celebration */}
                  <motion.div
                    className="flex-shrink-0 hidden sm:flex items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <motion.img
                      src="/Lexi.Celebration.png"
                      alt="Lexi celebrating"
                      className="w-52 h-auto drop-shadow-xl"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                  </motion.div>
                </div>
              )}

              {/* Word Map */}
              {classWordMap && resultWords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <h2 className="text-xl font-display font-bold text-foreground mb-3">Your Reading Map</h2>
                  <div className="p-5 rounded-xl bg-card border border-border shadow-card">
                    <WordMap
                      words={resultWords}
                      enableDeepDive={classDeepDive}
                      showVouch={false}
                      autoPlayOnClick={true}
                      trimTrailing={true}
                    />
                  </div>
                  {classDeepDive && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Tap a highlighted word to see details
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default StudentPortal;
