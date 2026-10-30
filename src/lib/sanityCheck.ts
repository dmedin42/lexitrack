/**
 * WPM / Accuracy Sanity Check Guardrail
 *
 * Classroom reality: 1st graders rarely exceed 140 WPM.
 * Background noise causes Azure to hallucinate words → inflated WPM.
 * Mumbling causes low accuracy with moderate WPM → also suspect.
 *
 * Flags:
 *   - "high_interference" → data is suspect, likely noise/hallucination
 *   - "valid"             → data looks pedagogically reasonable
 *
 * Rules:
 *   1. WPM > 300          → always flag (physically impossible for K-6)
 *   2. WPM > 150          → flag as high interference
 *   3. WPM > 40 AND accuracy < 20% → flag (noise + mumbling combo)
 *   4. Otherwise           → valid
 */

export type SanityFlag = "valid" | "high_interference";

export interface SanityResult {
  flag: SanityFlag;
  reason: string | null;
  /** Original scores preserved for CSV/logging */
  rawWpm: number;
  rawAccuracy: number;
  /** Sanitized scores: actual values preserved, flag indicates interference */
  wpm: number;
  accuracy: number;
}

export function runSanityCheck(
  wpm: number,
  accuracy: number,
): SanityResult {
  const base = { rawWpm: wpm, rawAccuracy: accuracy, wpm, accuracy };

  if (wpm > 300) {
    return {
      ...base,
      flag: "high_interference",
      reason: `WPM ${wpm} exceeds physical maximum (300). Likely background noise hallucination.`,
    };
  }

  if (wpm > 150) {
    return {
      ...base,
      flag: "high_interference",
      reason: `WPM ${wpm} exceeds K-6 ceiling (150). Likely noise interference.`,
    };
  }

  if (wpm > 40 && accuracy < 20) {
    return {
      ...base,
      flag: "high_interference",
      reason: `WPM ${wpm} with ${accuracy}% accuracy suggests noise, not reading.`,
    };
  }

  return {
    ...base,
    flag: "valid",
    reason: null,
    wpm,
    accuracy,
  };
}

/**
 * Format sanity check result as a CSV row.
 * Headers: student_id, passage, raw_wpm, raw_accuracy, flag, reason, clean_wpm, clean_accuracy
 */
export function sanityToCSVRow(
  studentId: string,
  passage: string,
  result: SanityResult,
): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return [
    escape(studentId),
    escape(passage),
    result.rawWpm,
    result.rawAccuracy,
    result.flag,
    escape(result.reason ?? ""),
    result.wpm,
    result.accuracy,
  ].join(",");
}

export const SANITY_CSV_HEADER =
  "student_id,passage,raw_wpm,raw_accuracy,flag,reason,clean_wpm,clean_accuracy";
