import { useState, useRef, useCallback } from "react";

/**
 * Records audio from the microphone as 16kHz 16-bit mono PCM WAV,
 * which is the format expected by Azure Speech SDK's PushStream.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);

  const TARGET_SAMPLE_RATE = 16000;

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;
    setMediaStream(stream);

    // Don't force sampleRate — let the device pick its native rate (iOS
    // Safari ignores the constructor option and may throw in older builds).
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    // iOS Safari keeps AudioContext suspended until an explicit resume()
    // inside a user-gesture handler.  We're inside one (click → async),
    // so this is safe and required for mobile.
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const source = audioCtx.createMediaStreamSource(stream);
    sourceRef.current = source;

    // ScriptProcessorNode to capture raw PCM
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    chunksRef.current = [];

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      chunksRef.current.push(new Float32Array(input));
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);
    setIsRecording(true);
    setAudioBlob(null);
  }, []);

  const stopRecording = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setMediaStream(null);

    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    const sourceSampleRate = audioCtx.sampleRate;
    audioCtx.close();

    // Merge chunks
    const totalLength = chunksRef.current.reduce((a, c) => a + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunksRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Downsample to 16 kHz
    const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
    const downLen = Math.ceil(merged.length / ratio);
    const downsampled = new Float32Array(downLen);
    for (let i = 0; i < downLen; i++) {
      downsampled[i] = merged[Math.round(i * ratio)] ?? 0;
    }

    // Encode WAV
    const wavBlob = encodeWav(downsampled, TARGET_SAMPLE_RATE);
    setAudioBlob(wavBlob);
    setIsRecording(false);
  }, []);

  const resetAudio = useCallback(() => {
    setAudioBlob(null);
  }, []);

  return { isRecording, audioBlob, mediaStream, startRecording, stopRecording, resetAudio };
}

/** Encode Float32 PCM samples into a 16-bit mono WAV Blob. */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM samples (clamp to int16 range)
  let pos = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    pos += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** Convert a Blob to base64 string. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
