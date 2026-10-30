/**
 * Azure Speech Services client for pronunciation assessment and STT.
 * Isolates header encoding, request construction, and error handling.
 */

export interface AzurePronunciationConfig {
  referenceText: string;
  gradingThreshold: number;
}

export interface AzureResult {
  NBest: Array<{
    Words: AzureWord[];
    FluencyScore?: number;
    CompletenessScore?: number;
    ProsodyScore?: number;
    PronunciationAssessment?: {
      FluencyScore?: number;
      CompletenessScore?: number;
      ProsodyScore?: number;
    };
  }>;
  Duration?: number;
  DisplayText?: string;
}

export interface AzureWord {
  Word: string;
  AccuracyScore?: number;
  ErrorType?: string;
  Offset?: number;
  Duration?: number;
  Phonemes?: Array<{
    Phoneme: string;
    AccuracyScore?: number;
    PronunciationAssessment?: { AccuracyScore?: number };
  }>;
  PronunciationAssessment?: {
    AccuracyScore?: number;
    ErrorType?: string;
  };
}

/** Encode the Pronunciation-Assessment header for Azure's API. */
function encodePronunciationHeader(config: AzurePronunciationConfig): string {
  const params = {
    ReferenceText: config.referenceText,
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    EnableMiscue: true,
    EnableProsodyAssessment: true,
    PhonemeAlphabet: "SAPI",
    GradingThreshold: config.gradingThreshold,
  };

  return btoa(
    encodeURIComponent(JSON.stringify(params)).replace(
      /%([0-9A-F]{2})/g,
      (_match, p1) => String.fromCharCode(parseInt(p1, 16)),
    ),
  );
}

/** Decode base64 audio into a Uint8Array buffer. */
export function decodeAudioBase64(audioBase64: string): Uint8Array {
  const base64Clean = audioBase64.replace(/^data:audio\/\w+;base64,/, "");
  try {
    const binaryString = atob(base64Clean);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }
    return buffer;
  } catch (_e) {
    throw new Error("Base64 decoding failed.");
  }
}

/** Call Azure with pronunciation assessment headers and return parsed results. */
export async function callAzurePronunciation(
  audioBuffer: Uint8Array,
  config: AzurePronunciationConfig,
): Promise<AzureResult> {
  const speechKey = Deno.env.get("AZURE_SPEECH_KEY");
  const speechRegion = Deno.env.get("AZURE_SPEECH_REGION") || "eastus";

  if (!speechKey) throw new Error("Missing Azure Speech Key.");

  const pronHeader = encodePronunciationHeader(config);
  const url = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": speechKey,
      "Pronunciation-Assessment": pronHeader,
      "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
      Accept: "application/json",
      "X-Opt-Out-Of-Content-Logging": "true",
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Azure API Error: ${response.status} - ${detail}`);
  }

  return response.json();
}
