/**
 * Pure scoring functions for LexiTrack assessments.
 * No external dependencies — just raw data processing.
 *
 * WPM  = Words_Correct / ((Last_Word_Timestamp - First_Word_Timestamp) / 60_000)
 * Accuracy = (Words_Correct / Total_Words_Attempted) * 100
 * Words_Correct = Total_Words_Attempted - Substitutions - Omissions(skips)
 *
 * Edge cases:
 *   - Time < 5 s → WPM = 0
 *   - Insertions (repeated words) are NOT counted in WPM or accuracy
 */

import type { AzureWord, AzureResult } from "./azure-client.ts";

export interface MappedWord {
  word: string;
  word_index: number;
  accuracy_score: number;
  error_type: string;
  offset_ms: number;
  duration_ms: number;
  phonemes: Array<{ phoneme: string; accuracy_score: number }>;
}

export interface FinalScores {
  accuracy_score: number;
  fluency_score: number;
  completeness_score: number;
  prosody_score: number;
}

export interface ScoringResult {
  finalScores: FinalScores;
  mappedWords: MappedWord[];
  durationSeconds: number;
  wpm: number;
  transcript: string;
}

/** Sanitize smart quotes, dashes, and non-ASCII characters. */
export function sanitizeText(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x00-\x7F]/g, "");
}

/** Slice reference text to a max word count and sanitize. */
export function prepareReferenceText(raw: string, maxWords = 350): string {
  const words = raw.trim().split(/\s+/);
  return sanitizeText(words.slice(0, maxWords).join(" "));
}

/** Convert grading strictness (1-10 scale) to Azure threshold (1-100). */
export function toAzureThreshold(strictness?: number): number {
  return strictness ? Math.round(strictness * 10) : 88;
}

/**
 * Smart Omission Logic: find the last index where the student actually spoke.
 */
function findLastSpokenIndex(words: AzureWord[]): number {
  for (let i = words.length - 1; i >= 0; i--) {
    const errorType = (words[i].ErrorType ?? words[i].PronunciationAssessment?.ErrorType ?? "Omission").toLowerCase();
    if (errorType !== "omission") return i;
  }
  return -1;
}

/** Map Azure word data into scored MappedWords and collect counts. */
function mapWords(
  words: AzureWord[],
  threshold: number,
): {
  mapped: MappedWord[];
  wordsCorrect: number;
  totalAttempted: number;
  firstWordOffsetMs: number;
  lastWordEndMs: number;
} {
  const lastSpokenIndex = findLastSpokenIndex(words);
  let wordsCorrect = 0;
  let totalAttempted = 0;
  let firstWordOffsetMs = -1;
  let lastWordEndMs = 0;

  const mapped = words.map((w, idx): MappedWord => {
    const score = w.AccuracyScore ?? w.PronunciationAssessment?.AccuracyScore ?? 0;
    let errorType = (w.ErrorType ?? w.PronunciationAssessment?.ErrorType ?? "None").toLowerCase();

    // Override to mispronunciation if score is below threshold
    if (errorType === "none" && score < threshold) {
      errorType = "mispronunciation";
    }

    let finalErrorType = errorType === "none" ? "correct" : errorType;

    const offsetMs = Math.round((w.Offset || 0) / 10000);
    const durationMs = Math.round((w.Duration || 0) / 10000);

    if (errorType === "omission") {
      if (idx <= lastSpokenIndex) {
        finalErrorType = "skip";
        // Skips count as attempted but NOT correct
        totalAttempted++;
      } else {
        finalErrorType = "unread";
      }
    } else if (errorType === "insertion") {
      // Insertions (repeated words) are NOT counted in WPM or accuracy
      finalErrorType = "insertion";
    } else {
      // Correct, mispronunciation, substitution
      totalAttempted++;

      // Track timestamps only for non-insertion, non-unread words
      if (firstWordOffsetMs < 0) firstWordOffsetMs = offsetMs;
      lastWordEndMs = offsetMs + durationMs;

      if (finalErrorType === "correct") {
        wordsCorrect++;
      }
      // mispronunciation and substitution: attempted but not correct
    }

    return {
      word: w.Word,
      word_index: idx,
      accuracy_score: Math.round(score),
      error_type: finalErrorType,
      offset_ms: offsetMs,
      duration_ms: durationMs,
      phonemes: (w.Phonemes || []).map((p) => ({
        phoneme: p.Phoneme,
        accuracy_score: Math.round(p.AccuracyScore ?? p.PronunciationAssessment?.AccuracyScore ?? 0),
      })),
    };
  });

  return { mapped, wordsCorrect, totalAttempted, firstWordOffsetMs, lastWordEndMs };
}

/**
 * Calculate WPM using timestamp span (last word end - first word start).
 * Falls back to sessionDurationMs or Azure duration if timestamps unavailable.
 * Returns 0 if effective time < 5 seconds.
 */
function calculateWpm(
  wordsCorrect: number,
  firstWordOffsetMs: number,
  lastWordEndMs: number,
  audioDurationTicks: number,
  sessionDurationMs?: number,
): number {
  if (wordsCorrect <= 0) return 0;

  // Priority 1: Timestamp span from word offsets
  let totalSeconds = 0;
  const spanMs = lastWordEndMs - firstWordOffsetMs;
  if (spanMs > 0) {
    totalSeconds = spanMs / 1000;
  } else if (sessionDurationMs && sessionDurationMs > 0) {
    // Priority 2: Wall-clock time from frontend
    totalSeconds = sessionDurationMs / 1000;
  } else {
    // Priority 3: Azure audio duration (ticks → seconds)
    totalSeconds = (audioDurationTicks || 0) / 10000000;
  }

  // Edge case: if time < 5 seconds, return 0 to avoid infinity
  if (totalSeconds < 5) return 0;

  const minutes = totalSeconds / 60;
  const finalWpm = Math.round(wordsCorrect / minutes);

  console.log(
    `[Lexi-WPM] Correct: ${wordsCorrect}, Seconds: ${totalSeconds.toFixed(2)}, WPM: ${finalWpm}, Source: ${spanMs > 0 ? "timestamps" : sessionDurationMs ? "wall-clock" : "azure"}`
  );

  return finalWpm;
}

/**
 * Calculate accuracy as (Words_Correct / Total_Words_Attempted) * 100.
 */
function calculateAccuracy(wordsCorrect: number, totalAttempted: number): number {
  if (totalAttempted <= 0) return 0;
  return Math.round((wordsCorrect / totalAttempted) * 100);
}

/** Run the full scoring pipeline. */
export function scoreAssessment(result: AzureResult, threshold: number, sessionDurationMs?: number): ScoringResult {
  const nbest = result.NBest?.[0] || ({} as any);
  const words: AzureWord[] = nbest.Words || [];

  const { mapped, wordsCorrect, totalAttempted, firstWordOffsetMs, lastWordEndMs } = mapWords(words, threshold);

  const accuracy = calculateAccuracy(wordsCorrect, totalAttempted);
  const wpm = calculateWpm(wordsCorrect, firstWordOffsetMs, lastWordEndMs, result.Duration || 0, sessionDurationMs);

  return {
    finalScores: {
      accuracy_score: accuracy,
      fluency_score: Math.round(nbest.FluencyScore ?? nbest.PronunciationAssessment?.FluencyScore ?? 0),
      completeness_score: Math.round(nbest.CompletenessScore ?? nbest.PronunciationAssessment?.CompletenessScore ?? 0),
      prosody_score: Math.round(nbest.ProsodyScore ?? nbest.PronunciationAssessment?.ProsodyScore ?? 0),
    },
    mappedWords: mapped,
    durationSeconds: (result.Duration || 0) / 10000000,
    wpm,
    transcript: result.DisplayText || "",
  };
}

// ─── Exported for testing ───
export { calculateWpm as _calculateWpm, calculateAccuracy as _calculateAccuracy, mapWords as _mapWords };
