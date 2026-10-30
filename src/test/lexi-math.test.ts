import { describe, it, expect } from "vitest";

/**
 * Validation test suite for WPM & Accuracy calculations.
 *
 * Since lexi-math.ts is a Deno edge function file, we re-implement the
 * pure math functions here for validation (same logic, portable).
 */

// ─── Pure functions (mirrored from lexi-math.ts) ───

function calculateWpm(
  wordsCorrect: number,
  firstWordOffsetMs: number,
  lastWordEndMs: number,
): number {
  if (wordsCorrect <= 0) return 0;
  const spanMs = lastWordEndMs - firstWordOffsetMs;
  const totalSeconds = spanMs / 1000;
  if (totalSeconds < 5) return 0;
  return Math.round(wordsCorrect / (totalSeconds / 60));
}

function calculateAccuracy(wordsCorrect: number, totalAttempted: number): number {
  if (totalAttempted <= 0) return 0;
  return Math.round((wordsCorrect / totalAttempted) * 100);
}

// ─── Tests ───

describe("WPM Calculation", () => {
  it("50 words, 5 errors, 30 seconds → 90 WPM", () => {
    // 50 attempted, 5 errors → 45 correct
    // 30 seconds → 0.5 minutes
    // 45 / 0.5 = 90
    const wpm = calculateWpm(45, 0, 30000);
    expect(wpm).toBe(90);
  });

  it("returns 0 when no correct words", () => {
    expect(calculateWpm(0, 0, 30000)).toBe(0);
  });

  it("returns 0 when time < 5 seconds", () => {
    expect(calculateWpm(10, 0, 3000)).toBe(0);
  });

  it("handles exactly 5 seconds (boundary)", () => {
    // 10 correct / (5/60) = 120
    expect(calculateWpm(10, 0, 5000)).toBe(120);
  });

  it("100 words, 0 errors, 60 seconds → 100 WPM", () => {
    expect(calculateWpm(100, 0, 60000)).toBe(100);
  });

  it("uses timestamp span, not total audio duration", () => {
    // First word at 2000ms, last word ends at 32000ms → 30s span
    // 45 correct / 0.5 min = 90
    expect(calculateWpm(45, 2000, 32000)).toBe(90);
  });
});

describe("Accuracy Calculation", () => {
  it("50 attempted, 5 errors → 90%", () => {
    // 45 correct / 50 attempted = 90%
    expect(calculateAccuracy(45, 50)).toBe(90);
  });

  it("all correct → 100%", () => {
    expect(calculateAccuracy(50, 50)).toBe(100);
  });

  it("none correct → 0%", () => {
    expect(calculateAccuracy(0, 50)).toBe(0);
  });

  it("no words attempted → 0%", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it("33 correct out of 40 → 83%", () => {
    expect(calculateAccuracy(33, 40)).toBe(83);
  });
});

describe("Mock Transcript: 50 words, 5 errors, 30 seconds", () => {
  it("produces WPM=90 and Accuracy=90%", () => {
    const totalAttempted = 50;
    const errors = 5; // substitutions + omissions(skips)
    const wordsCorrect = totalAttempted - errors; // 45
    const firstMs = 0;
    const lastMs = 30000; // 30 seconds

    const wpm = calculateWpm(wordsCorrect, firstMs, lastMs);
    const accuracy = calculateAccuracy(wordsCorrect, totalAttempted);

    console.log(`Mock Transcript Results:`);
    console.log(`  Total Attempted: ${totalAttempted}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Words Correct: ${wordsCorrect}`);
    console.log(`  Time: 30s`);
    console.log(`  WPM: ${wpm}`);
    console.log(`  Accuracy: ${accuracy}%`);

    expect(wpm).toBe(90);
    expect(accuracy).toBe(90);
  });
});
