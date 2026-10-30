/**
 * useLexiMic — Web Audio mic monitoring hook (Peak Volume approach)
 *
 * Uses Math.max peak detection instead of averaging for better
 * sensitivity to human speech. Returns 0-100 normalized volume.
 */
import { useState, useRef, useCallback, useEffect } from "react";

export interface LexiMicState {
  volume: number;
  stream: MediaStream | null;
  error: string | null;
  isActive: boolean;
}

export function useLexiMic() {
  const [volume, setVolume] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    setStream(null);
    setVolume(0);
    setIsActive(false);
  }, []);

  const startMic = useCallback(async () => {
    cleanup();
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: false,
        },
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const source = ctx.createMediaStreamSource(mediaStream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      source.connect(analyser);

      const dataArray = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (!analyserRef.current) return;
        // Use time-domain data for RMS — measures actual sound energy
        analyserRef.current.getFloatTimeDomainData(dataArray);

        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Normalize RMS to 0-100 (tuned so normal speech registers reliably)
        const normalized = Math.min(100, (rms / 0.24) * 100);
        setVolume(Math.round(normalized));
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      setIsActive(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Lexi needs to hear you to work! Please allow microphone access and try again.");
      } else {
        setError("Could not access microphone. Please check your device settings.");
      }
      cleanup();
    }
  }, [cleanup]);

  const stopMic = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { volume, stream, error, isActive, startMic, stopMic };
}
