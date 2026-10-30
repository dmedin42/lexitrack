/**
 * Centralized WPM calculation utilities.
 * All components must use these functions for consistent WPM display.
 *
 * WPM = Words_Correct / (Time_In_Seconds / 60)
 * Words_Correct = Total_Words_Attempted - Errors (substitutions + omissions)
 * Time < 5s → 0 (avoids infinity)
 */

/**
 * Calculate Words Per Minute from correct words and total seconds.
 * Uses: (wordsCorrect / (totalSeconds / 60))
 * Returns 0 if time < 5 seconds.
 */
export function calculateWPM(wordsCorrect: number, totalSeconds: number): number {
  if (wordsCorrect <= 0 || totalSeconds < 5) return 0;
  const minutes = totalSeconds / 60;
  return Math.round(wordsCorrect / minutes);
}

/**
 * Count words in a text string accurately (handles extra spaces).
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Weighted average WPM: sum of all words / sum of all time.
 * This avoids the bias of averaging individual WPM values.
 */
export function weightedAverageWPM(
  assessments: Array<{ wpm: number; duration_seconds: number | null }>
): number {
  let totalWords = 0;
  let totalSeconds = 0;

  for (const a of assessments) {
    const dur = a.duration_seconds ?? 0;
    if (dur <= 0 || a.wpm <= 0) continue;
    // Reverse-engineer word count: wpm = words / (seconds / 60) → words = wpm * (seconds / 60)
    const words = a.wpm * (dur / 60);
    totalWords += words;
    totalSeconds += dur;
  }

  if (totalSeconds < 5) return 0;
  return Math.round(totalWords / (totalSeconds / 60));
}
