/**
 * VoiceMeter — Child-friendly real-time volume indicator
 *
 * Uses Web Audio AnalyserNode to show volume as a "growing sun":
 *   - Too Quiet (<20%): Gray/dimmed — "Use your big reading voice!"
 *   - Just Right (20-70%): Green/bright — "Perfect!"
 *   - Too Loud (>70%): Red/shaking — "A little quieter, please!"
 *
 * Integration: Pass the MediaStream from your audio recorder.
 * The component creates its own AnalyserNode (read-only, no side effects).
 */
import { useEffect, useRef, useState, memo } from "react";
import { motion } from "framer-motion";

type VolumeZone = "quiet" | "good" | "loud";

interface VoiceMeterProps {
  /** Active MediaStream from getUserMedia */
  stream: MediaStream | null;
  /** Whether actively recording */
  active: boolean;
}

function getZone(level: number): VolumeZone {
  if (level < 0.20) return "quiet";
  if (level <= 0.70) return "good";
  return "loud";
}

const ZONE_CONFIG: Record<VolumeZone, { label: string; color: string; bgColor: string; sunColor: string }> = {
  quiet: {
    label: "A little louder!",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    sunColor: "rgb(156, 163, 175)", // gray
  },
  good: {
    label: "Perfect!",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    sunColor: "rgb(250, 204, 21)", // warm yellow
  },
  loud: {
    label: "A little quieter, please!",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    sunColor: "rgb(239, 68, 68)", // red
  },
};

const VoiceMeter = memo(({ stream, active }: VoiceMeterProps) => {
  const [level, setLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!stream || !active) {
      setLevel(0);
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    if (ctx.state === "suspended") ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    source.connect(analyser);
    // Don't connect to destination — read-only meter

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      // RMS-like average normalized to 0-1
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length / 255;
      setLevel(avg);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      ctx.close();
    };
  }, [stream, active]);

  const zone = getZone(level);
  const config = ZONE_CONFIG[zone];

  // Sun scale: min 0.4, max 1.3 based on volume
  const sunScale = 0.4 + level * 1.2;
  // Ray count based on volume
  const rayCount = Math.max(4, Math.round(level * 12));

  if (!active) return null;

  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors duration-300 ${config.bgColor}`}>
      {/* Sun visualization */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Rays */}
        <motion.div
          className="absolute inset-0"
          animate={zone === "loud" ? { rotate: [0, -2, 2, -2, 0] } : { rotate: 0 }}
          transition={zone === "loud" ? { repeat: Infinity, duration: 0.3 } : {}}
        >
          {Array.from({ length: rayCount }).map((_, i) => {
            const angle = (360 / rayCount) * i;
            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-0 origin-bottom"
                style={{
                  width: 3,
                  height: 12 + level * 20,
                  marginLeft: -1.5,
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: "50% 48px",
                  backgroundColor: config.sunColor,
                  borderRadius: 2,
                  opacity: zone === "quiet" ? 0.3 : 0.7,
                }}
                animate={{ height: 12 + level * 20 }}
                transition={{ duration: 0.1 }}
              />
            );
          })}
        </motion.div>

        {/* Sun core */}
        <motion.div
          className="rounded-full z-10"
          style={{ backgroundColor: config.sunColor }}
          animate={{
            width: 36 * sunScale,
            height: 36 * sunScale,
            boxShadow: zone === "good"
              ? `0 0 ${20 + level * 30}px ${config.sunColor}`
              : `0 0 ${10 + level * 10}px ${config.sunColor}`,
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      </div>

      {/* Label */}
      <motion.p
        className={`text-sm font-bold text-center ${config.color}`}
        animate={zone === "loud" ? { x: [-1, 1, -1, 0] } : { x: 0 }}
        transition={zone === "loud" ? { repeat: Infinity, duration: 0.2 } : {}}
      >
        {config.label}
      </motion.p>
    </div>
  );
});

VoiceMeter.displayName = "VoiceMeter";

export default VoiceMeter;
