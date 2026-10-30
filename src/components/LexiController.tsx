/**
 * LexiController — Centered overlay tutorial → minimized corner companion
 *
 * Phase 0: Entry — "Start Reading Adventure" button (no auto-start)
 * Phase 1: Large Tutorial (centered overlay, 400px, backdrop blur)
 * Phase 2: Celebration — shrink from center to corner (0.7s ease-in-out)
 * Phase 3: Live Support — mini companion (120px), pointer-events: none
 *
 * Uses PEAK volume detection with accumulated time for forgiving mic check.
 */
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLexiMic } from "@/hooks/useLexiMic";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

type LexiPhase = "entry" | "intro" | "mic-check" | "celebration" | "live";

interface LexiControllerProps {
  onOnboardingComplete: () => void;
  isReading?: boolean;
  externalStream?: MediaStream | null;
}

const LEXI_IMAGES = {
  neutral: "/Lexi.Nutural.png",
  listening: "/Lexi.Listening.png",
  tooQuiet: "/Lexi.TooQuiet.png",
  celebration: "/Lexi.Celebration.png",
};

const LEXI_AUDIO = {
  intro: "/Lexi.Intro.mp3",
  micTest: "/Mic.test.Lexi.mp3",
  tooQuiet: "/tooQuiet.Lexi.mp3",
  goodVolume: "/Lexi.good.volume.celi.mp3",
};

const STORAGE_KEY = "hasSeenLexiIntro";

// RMS-based thresholds — tuned for normal speech ("hello Lexi")
const VOLUME_SUCCESS_THRESHOLD = 15;
const VOLUME_TOO_LOUD_THRESHOLD = 82;
const VOLUME_QUIET_THRESHOLD = 5;
const VOLUME_ACCUMULATED_TARGET_MS = 1000; // total time needed in success zone
const ACCUMULATED_GRACE_MS = 2500;         // pause allowed before accumulated progress resets
const QUIET_DEBOUNCE_MS = 1500;
const MIC_SMOOTHING_ALPHA = 0.28;

// Live monitoring
const LIVE_QUIET_THRESHOLD = 15;
const LIVE_QUIET_DURATION_MS = 3000;

// Preload images
Object.values(LEXI_IMAGES).forEach((src) => {
  const img = new Image();
  img.src = src;
});

const LexiController = memo(({ onOnboardingComplete, isReading = false, externalStream = null }: LexiControllerProps) => {
  const hasSeenIntro = (() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  })();

  const [phase, setPhase] = useState<LexiPhase>("entry");
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentImage, setCurrentImage] = useState(LEXI_IMAGES.neutral);
  const [speechText, setSpeechText] = useState("");
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  const { volume, error: micError, isActive: micActive, startMic, stopMic } = useLexiMic();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const quietDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveQuietTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const phaseRef = useRef(phase);
  const smoothedPeakRef = useRef(0);
  const accumulatedMsRef = useRef(0);
  const lastTickRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Handle mic permission errors
  useEffect(() => {
    if (micError) {
      setMicPermissionDenied(true);
      setSpeechText(micError);
      setCurrentImage(LEXI_IMAGES.tooQuiet);
    }
  }, [micError]);

  // ─── Audio helper ───
  const playAudio = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio failed to load"));
      audio.play().catch(reject);
    });
  }, []);

  // ─── Entry: Start button clicked ───
  const handleStart = useCallback(async () => {
    if (hasSeenIntro) {
      setPhase("mic-check");
    } else {
      setPhase("intro");
      setCurrentImage(LEXI_IMAGES.neutral);
      setSpeechText("Hi there! I'm Lexi, your reading buddy!");
      try { await playAudio(LEXI_AUDIO.intro); } catch {}
      setPhase("mic-check");
    }
  }, [hasSeenIntro, playAudio]);

  // ─── Phase: Mic Check — start mic when entering ───
  useEffect(() => {
    if (phase !== "mic-check") return;
    setCurrentImage(LEXI_IMAGES.listening);
    setSpeechText('Say "Hello Lexi!" so I can hear you.');
    smoothedPeakRef.current = 0;
    accumulatedMsRef.current = 0;
    lastTickRef.current = 0;

    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }

    const initMicCheck = async () => {
      await new Promise((r) => setTimeout(r, 300));
      await startMic();
      try { await playAudio(LEXI_AUDIO.micTest); } catch {}
    };
    initMicCheck();

    return () => {
      if (quietDebounceRef.current) {
        clearTimeout(quietDebounceRef.current);
        quietDebounceRef.current = null;
      }
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };
  }, [phase, startMic, playAudio]);

  // ─── Mic Check: accumulated time monitoring with grace period ───
  useEffect(() => {
    if (phase !== "mic-check" || !micActive) return;

    const now = performance.now();
    const dt = lastTickRef.current > 0 ? Math.min(now - lastTickRef.current, 100) : 0;
    lastTickRef.current = now;

    const smoothedPeak = Math.round(
      smoothedPeakRef.current * (1 - MIC_SMOOTHING_ALPHA) + volume * MIC_SMOOTHING_ALPHA
    );
    smoothedPeakRef.current = smoothedPeak;

    // TOO LOUD — background interference
    if (smoothedPeak >= VOLUME_TOO_LOUD_THRESHOLD) {
      // Clear grace timer, don't accumulate
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      if (quietDebounceRef.current) {
        clearTimeout(quietDebounceRef.current);
        quietDebounceRef.current = null;
      }
      setCurrentImage(LEXI_IMAGES.tooQuiet);
      setSpeechText("Too loud! Try to find a quieter spot.");
      return;
    }

    // SILENCE — below quiet threshold
    if (smoothedPeak < VOLUME_QUIET_THRESHOLD) {
      // Start grace timer to reset accumulated progress after pause
      if (!graceTimerRef.current && accumulatedMsRef.current > 0) {
        graceTimerRef.current = setTimeout(() => {
          accumulatedMsRef.current = 0;
          graceTimerRef.current = null;
        }, ACCUMULATED_GRACE_MS);
      }
      if (quietDebounceRef.current) {
        clearTimeout(quietDebounceRef.current);
        quietDebounceRef.current = null;
      }
      setCurrentImage(LEXI_IMAGES.listening);
      setSpeechText('Say "Hello Lexi!" so I can hear you.');
      return;
    }

    // MID ZONE — speaking but not loud enough
    if (smoothedPeak < VOLUME_SUCCESS_THRESHOLD) {
      // Still in grace period, don't accumulate but don't reset either
      if (!quietDebounceRef.current) {
        quietDebounceRef.current = setTimeout(() => {
          if (phaseRef.current === "mic-check") {
            setCurrentImage(LEXI_IMAGES.tooQuiet);
            setSpeechText("A little louder! Use your big reading voice!");
          }
          quietDebounceRef.current = null;
        }, QUIET_DEBOUNCE_MS);
      }
      return;
    }

    // SUCCESS ZONE — good volume, accumulate time
    if (quietDebounceRef.current) {
      clearTimeout(quietDebounceRef.current);
      quietDebounceRef.current = null;
    }
    // Cancel any grace decay since they're speaking well again
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }

    accumulatedMsRef.current += dt;

    setCurrentImage(LEXI_IMAGES.listening);
    setSpeechText("Great volume! Keep it up...");

    // Check if we've accumulated enough
    if (accumulatedMsRef.current >= VOLUME_ACCUMULATED_TARGET_MS) {
      stopMic();
      setPhase("celebration");
    }
  }, [volume, phase, micActive, stopMic]);

  // ─── Celebration: shrink + transition to corner ───
  useEffect(() => {
    if (phase !== "celebration" || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setCurrentImage(LEXI_IMAGES.celebration);
    setSpeechText("Make sure you read just like that!");

    const celebrate = async () => {
      try { await playAudio(LEXI_AUDIO.goodVolume); } catch {}
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}

      // Brief pause then shrink to corner
      await new Promise((r) => setTimeout(r, 500));
      setIsMinimized(true);

      // After 0.7s transition completes, move to live phase
      await new Promise((r) => setTimeout(r, 700));
      onOnboardingComplete();
      setPhase("live");
      setSpeechText("");
    };
    celebrate();
  }, [phase, playAudio, onOnboardingComplete]);

  // ─── Phase 4: Live Support (peak volume nudge during reading) ───
  const liveAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveCtxRef = useRef<AudioContext | null>(null);
  const liveSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveRafRef = useRef<number>(0);
  const [liveVolume, setLiveVolume] = useState(0);

  useEffect(() => {
    if (phase !== "live" || !isReading || !externalStream) {
      setCurrentImage(LEXI_IMAGES.neutral);
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    liveCtxRef.current = ctx;
    if (ctx.state === "suspended") ctx.resume();

    const source = ctx.createMediaStreamSource(externalStream);
    liveSourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.4;
    liveAnalyserRef.current = analyser;
    source.connect(analyser);

    const dataArray = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(dataArray);
      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sumSquares += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      const normalized = Math.min(100, (rms / 0.24) * 100);
      setLiveVolume(Math.round(normalized));
      liveRafRef.current = requestAnimationFrame(tick);
    };
    liveRafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(liveRafRef.current);
      source.disconnect();
      analyser.disconnect();
      ctx.close().catch(() => {});
    };
  }, [phase, isReading, externalStream]);

  // Live volume → image swap with debounce
  useEffect(() => {
    if (phase !== "live" || !isReading) return;

    if (liveVolume < LIVE_QUIET_THRESHOLD) {
      if (!liveQuietTimerRef.current) {
        liveQuietTimerRef.current = setTimeout(() => {
          setCurrentImage(LEXI_IMAGES.tooQuiet);
          setSpeechText("A little louder so I can hear you!");
        }, LIVE_QUIET_DURATION_MS);
      }
    } else {
      if (liveQuietTimerRef.current) {
        clearTimeout(liveQuietTimerRef.current);
        liveQuietTimerRef.current = null;
      }
      setCurrentImage(LEXI_IMAGES.listening);
      setSpeechText("");
    }

    return () => {
      if (liveQuietTimerRef.current) {
        clearTimeout(liveQuietTimerRef.current);
        liveQuietTimerRef.current = null;
      }
    };
  }, [liveVolume, phase, isReading]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ─── RENDER ───

  // Entry state
  if (phase === "entry") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 py-8"
      >
        <motion.img
          src={LEXI_IMAGES.neutral}
          alt="Lexi the reading dog"
          className="w-40 h-auto drop-shadow-lg"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
        <Button
          onClick={handleStart}
          size="lg"
          className="h-16 px-8 text-xl gap-3 rounded-2xl"
        >
          <BookOpen className="w-6 h-6" /> Start Reading Adventure
        </Button>
      </motion.div>
    );
  }

  // Large centered overlay (intro + mic-check phases)
  const isOverlay = (phase === "intro" || phase === "mic-check" || (phase === "celebration" && !isMinimized));

  // Mini corner companion (celebration after shrink + live)
  const isMini = isMinimized || phase === "live";

  // Compute progress percentage for accumulated time
  const accumulatedProgress = Math.min(100, (accumulatedMsRef.current / VOLUME_ACCUMULATED_TARGET_MS) * 100);

  if (isOverlay) {
    return (
      <AnimatePresence>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop blur */}
          <motion.div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Content — 400px wide Lexi */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 max-w-md px-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Speech Bubble */}
            {speechText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-card border border-border rounded-2xl p-5 shadow-elevated w-full text-center"
              >
                <p className="text-lg font-medium text-foreground leading-relaxed">
                  {speechText}
                </p>

                {/* Mic check volume bar */}
                {phase === "mic-check" && micActive && (
                  <div className="mt-4">
                    <Progress value={volume} className="h-4" />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-muted-foreground">Quiet</span>
                      <span className="text-xs font-medium text-primary">
                        {accumulatedProgress > 0 && accumulatedProgress < 100
                          ? `${Math.round(accumulatedProgress)}% ready`
                          : "Good"}
                      </span>
                      <span className="text-xs text-muted-foreground">Loud</span>
                    </div>
                  </div>
                )}

                {/* Mic permission denied: retry */}
                {micPermissionDenied && (
                  <Button
                    onClick={() => {
                      setMicPermissionDenied(false);
                      startMic();
                    }}
                    size="sm"
                    variant="outline"
                    className="mt-4 gap-2 rounded-xl"
                  >
                    Try Again
                  </Button>
                )}

                {/* Tail */}
                <div
                  className="absolute left-1/2 -bottom-2 w-4 h-4 bg-card border-b border-r border-border -translate-x-1/2 rotate-45"
                />
              </motion.div>
            )}

            {/* Large Lexi — 400px */}
            <motion.img
              key={currentImage}
              src={currentImage}
              alt="Lexi the reading dog"
              className="w-[400px] h-auto drop-shadow-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Mini corner companion — 120px, pointer-events: none
  if (isMini) {
    const showBubble = phase === "live" && isReading && speechText;
    const isLiveIdle = phase === "live" && !isReading;

    return (
      <motion.div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none"
        style={{ maxWidth: 200 }}
        initial={{ opacity: 0, scale: 0.3, y: 200 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Speech bubble for live nudges */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-card border border-border rounded-xl p-3 shadow-elevated pointer-events-auto"
            >
              <p className="text-xs font-medium text-foreground leading-relaxed">
                {speechText}
              </p>
              <div
                className="absolute -bottom-1.5 right-6 w-3 h-3 bg-card border-b border-r border-border rotate-45"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini Lexi — 120px */}
        <motion.div
          className={`relative ${isLiveIdle ? "opacity-50" : ""}`}
          animate={phase === "celebration" ? { y: [0, -8, 0] } : {}}
          transition={phase === "celebration" ? { repeat: 2, duration: 0.4 } : {}}
        >
          <motion.img
            key={currentImage}
            src={currentImage}
            alt="Lexi the reading dog"
            className="w-[120px] h-auto drop-shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </motion.div>
      </motion.div>
    );
  }

  return null;
});

LexiController.displayName = "LexiController";

export default LexiController;
