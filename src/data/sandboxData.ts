/**
 * Sandbox-specific mock data for the Vision Tour.
 * One student "AJ1", one 60-second assessment, word-level data, and 3 clusters.
 */

export interface SandboxWord {
  id: string;
  word: string;
  errorType: "correct" | "substitution" | "mispronunciation" | "omission" | "insertion";
  detectedWord?: string;
  phonemes?: { phoneme: string; expected: string; quality: number }[];
  confidence: number;
  offsetMs: number;
  durationMs: number;
  vouched?: boolean;
}

export interface SandboxCluster {
  id: string;
  errorPattern: string;
  severity: "high" | "medium" | "low";
  description: string;
  suggestedActivity: string;
  studentCount: number;
}

export interface SandboxErrorPattern {
  word: string;
  errorType: string;
  count: number;
}

// ── Student ──
export const sandboxStudent = {
  id: "sandbox-s-001",
  name: "AJ1",
  avatar: "🦊",
  grade: "2nd",
};

// ── Assessment ──
export const sandboxAssessment = {
  id: "sandbox-a-001",
  studentId: sandboxStudent.id,
  passageTitle: "Birds in the Park",
  fluencyScore: 72,
  accuracyScore: 78,
  durationSeconds: 60,
  date: new Date().toISOString().slice(0, 10),
};

// ── Words with mixed errors ──
const rawWords: Omit<SandboxWord, "id" | "offsetMs" | "durationMs">[] = [
  { word: "Small", errorType: "correct", confidence: 95 },
  { word: "birds", errorType: "correct", confidence: 92 },
  { word: "were", errorType: "correct", confidence: 94 },
  { word: "singing", errorType: "correct", confidence: 91 },
  { word: "in", errorType: "correct", confidence: 98 },
  { word: "the", errorType: "correct", confidence: 97 },
  { word: "tall", errorType: "correct", confidence: 93 },
  { word: "trees", errorType: "substitution", detectedWord: "threes", confidence: 38, phonemes: [
    { phoneme: "θ", expected: "t", quality: 30 },
    { phoneme: "r", expected: "r", quality: 85 },
    { phoneme: "iː", expected: "iː", quality: 90 },
    { phoneme: "z", expected: "z", quality: 88 },
  ]},
  { word: "They", errorType: "correct", confidence: 96 },
  { word: "flew", errorType: "mispronunciation", confidence: 42, phonemes: [
    { phoneme: "f", expected: "f", quality: 88 },
    { phoneme: "l", expected: "l", quality: 75 },
    { phoneme: "oʊ", expected: "uː", quality: 28 },
  ]},
  { word: "from", errorType: "correct", confidence: 90 },
  { word: "branch", errorType: "substitution", detectedWord: "brunch", confidence: 35, phonemes: [
    { phoneme: "b", expected: "b", quality: 90 },
    { phoneme: "r", expected: "r", quality: 85 },
    { phoneme: "ʌ", expected: "æ", quality: 25 },
    { phoneme: "n", expected: "n", quality: 88 },
    { phoneme: "tʃ", expected: "tʃ", quality: 82 },
  ]},
  { word: "to", errorType: "correct", confidence: 97 },
  { word: "branch", errorType: "correct", confidence: 89 },
  { word: "looking", errorType: "omission", confidence: 0 },
  { word: "for", errorType: "correct", confidence: 94 },
  { word: "food", errorType: "correct", confidence: 91 },
  { word: "A", errorType: "correct", confidence: 98 },
  { word: "red", errorType: "correct", confidence: 93 },
  { word: "robin", errorType: "mispronunciation", confidence: 40, phonemes: [
    { phoneme: "r", expected: "r", quality: 70 },
    { phoneme: "ɒ", expected: "ɑː", quality: 32 },
    { phoneme: "b", expected: "b", quality: 85 },
    { phoneme: "ɪ", expected: "ɪ", quality: 80 },
    { phoneme: "n", expected: "n", quality: 90 },
  ]},
  { word: "found", errorType: "correct", confidence: 88 },
  { word: "a", errorType: "correct", confidence: 98 },
  { word: "worm", errorType: "correct", confidence: 90 },
  { word: "and", errorType: "correct", confidence: 97 },
  { word: "carried", errorType: "omission", confidence: 0 },
  { word: "it", errorType: "correct", confidence: 96 },
  { word: "to", errorType: "correct", confidence: 97 },
  { word: "her", errorType: "correct", confidence: 92 },
  { word: "nest", errorType: "correct", confidence: 94 },
];

export const sandboxWords: SandboxWord[] = rawWords.map((w, i) => ({
  ...w,
  id: `sandbox-wa-${String(i).padStart(3, "0")}`,
  offsetMs: i * 2000,
  durationMs: 1600 + Math.floor(Math.random() * 400),
}));

// The specific error word index the tour forces the user to click (Step 3)
// "trees" → substituted as "threes" at index 7
export const TOUR_ERROR_WORD_INDEX = 7;

// ── Error Pattern Insights ──
export const sandboxErrorPatterns: SandboxErrorPattern[] = [
  { word: "trees/threes", errorType: "mispronunciation", count: 3 },
  { word: "branch/brunch", errorType: "substitution", count: 2 },
  { word: "looking", errorType: "omission", count: 4 },
  { word: "carried", errorType: "omission", count: 3 },
  { word: "robin", errorType: "mispronunciation", count: 2 },
  { word: "flew", errorType: "mispronunciation", count: 2 },
];

// ── Clusters ──
export const sandboxClusters: SandboxCluster[] = [
  {
    id: "sandbox-cl-001",
    errorPattern: "Initial Consonant Blends (br, tr, gr)",
    severity: "high",
    description: "Consistent struggles with initial consonant blends, especially 'br' and 'tr' combinations across multiple assessments.",
    suggestedActivity: "Use word sorts with blend families. Start with 2-letter blends (br, tr) before moving to 3-letter blends (str, spr).",
    studentCount: 4,
  },
  {
    id: "sandbox-cl-002",
    errorPattern: "Long Vowel Substitutions",
    severity: "medium",
    description: "Substituting short vowels for long vowels in CVCe words (e.g., 'mat' for 'mate', 'bit' for 'bite').",
    suggestedActivity: "Practice 'magic e' word pairs. Use Elkonin boxes to show the vowel change.",
    studentCount: 3,
  },
  {
    id: "sandbox-cl-003",
    errorPattern: "Word Ending Omissions (-ed, -ing)",
    severity: "low",
    description: "Students drop inflectional endings, reading 'walk' instead of 'walked' or 'play' instead of 'playing'.",
    suggestedActivity: "Highlight endings with colored markers during shared reading. Use a 'base word + ending' matching activity.",
    studentCount: 2,
  },
];
