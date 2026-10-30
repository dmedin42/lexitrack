// Comprehensive demo/mock data for LexiTrack
// Used as fallback when Supabase returns empty results

import { DbClass, DbStudent } from "@/hooks/useStudents";
import { ClassStats } from "@/hooks/useClassStats";
import { DbClusterWithStudents } from "@/hooks/useClusters";
import { DbWordAssessment, DbPhoneme } from "@/hooks/useAssessments";
import { DbPassage } from "@/hooks/usePassages";

// ── IDs ──────────────────────────────────────────────
const CLASS_ID = "demo-class-001";
const STUDENT_IDS = [
  "demo-s-001", "demo-s-002", "demo-s-003", "demo-s-004",
  "demo-s-005", "demo-s-006", "demo-s-007", "demo-s-008",
];
const ASSESSMENT_IDS = [
  "demo-a-001", "demo-a-002", "demo-a-003", "demo-a-004",
  "demo-a-005", "demo-a-006", "demo-a-007", "demo-a-008",
  "demo-a-009", "demo-a-010", "demo-a-011", "demo-a-012",
  "demo-a-013", "demo-a-014", "demo-a-015", "demo-a-016",
];
const WA_IDS = Array.from({ length: 80 }, (_, i) => `demo-wa-${String(i).padStart(3, "0")}`);

// ── Classes ──────────────────────────────────────────
export const demoClasses: DbClass[] = [
  {
    id: CLASS_ID,
    teacher_id: "demo-teacher",
    name: "Mrs. Thompson's Class",
    grade: "2nd",
    school_year: "2025-2026",
    benchmark_wpm: 90,
  },
];

// ── Students ─────────────────────────────────────────
export const demoStudents: DbStudent[] = [
  { id: STUDENT_IDS[0], class_id: CLASS_ID, name: "ER1", grade: "2nd", avatar: "🦊", goal_wpm: 100, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[1], class_id: CLASS_ID, name: "LC2", grade: "2nd", avatar: "🐼", goal_wpm: 95, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[2], class_id: CLASS_ID, name: "SW3", grade: "2nd", avatar: "🦉", goal_wpm: 90, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[3], class_id: CLASS_ID, name: "NJ4", grade: "2nd", avatar: "🐬", goal_wpm: 100, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[4], class_id: CLASS_ID, name: "AP5", grade: "2nd", avatar: "🦋", goal_wpm: 85, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[5], class_id: CLASS_ID, name: "OM6", grade: "2nd", avatar: "🐢", goal_wpm: 95, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[6], class_id: CLASS_ID, name: "JL7", grade: "2nd", avatar: "🌻", goal_wpm: 90, goal_date: "2026-05-15", username: null, student_password: null },
  { id: STUDENT_IDS[7], class_id: CLASS_ID, name: "MT8", grade: "2nd", avatar: "🍎", goal_wpm: 100, goal_date: "2026-05-15", username: null, student_password: null },
];

// ── Assessments ──────────────────────────────────────
// Two assessments per student to show progress
const now = new Date();
function daysAgo(d: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  return date.toISOString().slice(0, 10);
}

export interface DemoAssessment {
  id: string;
  student_id: string;
  passage_title: string;
  passage_id: string | null;
  fluency_score: number;
  accuracy_score: number;
  duration_seconds: number;
  date: string;
  created_at: string;
}

export const demoAssessments: DemoAssessment[] = [
  // Emma – strong reader, improving
  { id: ASSESSMENT_IDS[0], student_id: STUDENT_IDS[0], passage_title: "The Cat on the Mat", passage_id: "demo-p-001", fluency_score: 82, accuracy_score: 88, duration_seconds: 45, date: daysAgo(21), created_at: daysAgo(21) },
  { id: ASSESSMENT_IDS[1], student_id: STUDENT_IDS[0], passage_title: "Sunny Day Adventure", passage_id: "demo-p-002", fluency_score: 95, accuracy_score: 93, duration_seconds: 40, date: daysAgo(3), created_at: daysAgo(3) },
  // Liam – below benchmark, struggling
  { id: ASSESSMENT_IDS[2], student_id: STUDENT_IDS[1], passage_title: "The Cat on the Mat", passage_id: "demo-p-001", fluency_score: 62, accuracy_score: 72, duration_seconds: 58, date: daysAgo(21), created_at: daysAgo(21) },
  { id: ASSESSMENT_IDS[3], student_id: STUDENT_IDS[1], passage_title: "Birds in the Park", passage_id: "demo-p-003", fluency_score: 70, accuracy_score: 78, duration_seconds: 52, date: daysAgo(5), created_at: daysAgo(5) },
  // Sophia – steady
  { id: ASSESSMENT_IDS[4], student_id: STUDENT_IDS[2], passage_title: "Sunny Day Adventure", passage_id: "demo-p-002", fluency_score: 88, accuracy_score: 91, duration_seconds: 42, date: daysAgo(18), created_at: daysAgo(18) },
  { id: ASSESSMENT_IDS[5], student_id: STUDENT_IDS[2], passage_title: "The Little Train", passage_id: "demo-p-004", fluency_score: 92, accuracy_score: 94, duration_seconds: 38, date: daysAgo(2), created_at: daysAgo(2) },
  // Noah – top performer
  { id: ASSESSMENT_IDS[6], student_id: STUDENT_IDS[3], passage_title: "The Cat on the Mat", passage_id: "demo-p-001", fluency_score: 105, accuracy_score: 96, duration_seconds: 35, date: daysAgo(14), created_at: daysAgo(14) },
  { id: ASSESSMENT_IDS[7], student_id: STUDENT_IDS[3], passage_title: "Birds in the Park", passage_id: "demo-p-003", fluency_score: 112, accuracy_score: 98, duration_seconds: 32, date: daysAgo(1), created_at: daysAgo(1) },
  // Aiden – below benchmark
  { id: ASSESSMENT_IDS[8], student_id: STUDENT_IDS[4], passage_title: "Sunny Day Adventure", passage_id: "demo-p-002", fluency_score: 55, accuracy_score: 65, duration_seconds: 65, date: daysAgo(20), created_at: daysAgo(20) },
  { id: ASSESSMENT_IDS[9], student_id: STUDENT_IDS[4], passage_title: "The Cat on the Mat", passage_id: "demo-p-001", fluency_score: 68, accuracy_score: 74, duration_seconds: 55, date: daysAgo(4), created_at: daysAgo(4) },
  // Olivia – good
  { id: ASSESSMENT_IDS[10], student_id: STUDENT_IDS[5], passage_title: "The Little Train", passage_id: "demo-p-004", fluency_score: 91, accuracy_score: 89, duration_seconds: 41, date: daysAgo(16), created_at: daysAgo(16) },
  { id: ASSESSMENT_IDS[11], student_id: STUDENT_IDS[5], passage_title: "Birds in the Park", passage_id: "demo-p-003", fluency_score: 97, accuracy_score: 92, duration_seconds: 37, date: daysAgo(2), created_at: daysAgo(2) },
  // Jackson – mid
  { id: ASSESSMENT_IDS[12], student_id: STUDENT_IDS[6], passage_title: "The Cat on the Mat", passage_id: "demo-p-001", fluency_score: 78, accuracy_score: 82, duration_seconds: 48, date: daysAgo(19), created_at: daysAgo(19) },
  { id: ASSESSMENT_IDS[13], student_id: STUDENT_IDS[6], passage_title: "Sunny Day Adventure", passage_id: "demo-p-002", fluency_score: 85, accuracy_score: 87, duration_seconds: 44, date: daysAgo(3), created_at: daysAgo(3) },
  // Mia – excellent
  { id: ASSESSMENT_IDS[14], student_id: STUDENT_IDS[7], passage_title: "Birds in the Park", passage_id: "demo-p-003", fluency_score: 100, accuracy_score: 95, duration_seconds: 36, date: daysAgo(15), created_at: daysAgo(15) },
  { id: ASSESSMENT_IDS[15], student_id: STUDENT_IDS[7], passage_title: "The Little Train", passage_id: "demo-p-004", fluency_score: 108, accuracy_score: 97, duration_seconds: 33, date: daysAgo(1), created_at: daysAgo(1) },
];

// ── Word Assessments (for latest assessment of each student) ──
// We'll create detailed words for the LATEST assessment of each student

const passageWords: Record<string, string[]> = {
  "Sunny Day Adventure": ["The", "sun", "was", "bright", "and", "warm", "today", "We", "walked", "through", "the", "green", "garden", "and", "saw", "beautiful", "flowers"],
  "Birds in the Park": ["Small", "birds", "were", "singing", "in", "the", "tall", "trees", "They", "flew", "from", "branch", "to", "branch", "looking", "for", "food"],
  "The Cat on the Mat": ["The", "little", "cat", "sat", "on", "the", "warm", "mat", "It", "watched", "the", "birds", "fly", "over", "the", "tall", "fence"],
  "The Little Train": ["The", "small", "train", "went", "up", "the", "big", "hill", "It", "puffed", "and", "chugged", "along", "the", "shiny", "metal", "tracks"],
};

function makeWordAssessments(assessmentId: string, passageTitle: string, startWaIdx: number, errorPattern: "strong" | "weak" | "mid"): DbWordAssessment[] {
  const words = passageWords[passageTitle] ?? passageWords["The Cat on the Mat"];
  return words.map((word, i) => {
    let errorType = "correct";
    let detectedWord: string | null = null;
    let confidence = 90 + Math.floor(Math.random() * 10);

    if (errorPattern === "weak") {
      if (i === 3) { errorType = "substitution"; detectedWord = "bight"; confidence = 45; }
      if (i === 9) { errorType = "mispronunciation"; confidence = 38; }
      if (i === 15) { errorType = "omission"; confidence = 0; }
    } else if (errorPattern === "mid") {
      if (i === 6) { errorType = "mispronunciation"; confidence = 55; }
      if (i === 13) { errorType = "substitution"; detectedWord = "bunch"; confidence = 50; }
    }

    return {
      id: WA_IDS[startWaIdx + i] ?? `demo-wa-extra-${assessmentId}-${i}`,
      assessment_id: assessmentId,
      word_index: i,
      word,
      error_type: errorType,
      detected_word: detectedWord,
      confidence,
      offset_ms: i * 350,
      duration_ms: 280 + Math.floor(Math.random() * 120),
      vouched: false,
      vouched_by: null,
      vouched_at: null,
    };
  });
}

// Generate word assessments for latest assessments
export const demoWordAssessments: DbWordAssessment[] = [
  ...makeWordAssessments(ASSESSMENT_IDS[1], "Sunny Day Adventure", 0, "strong"),   // Emma latest
  ...makeWordAssessments(ASSESSMENT_IDS[3], "Birds in the Park", 17, "weak"),        // Liam latest
  ...makeWordAssessments(ASSESSMENT_IDS[5], "The Little Train", 34, "strong"),       // Sophia latest
  ...makeWordAssessments(ASSESSMENT_IDS[7], "Birds in the Park", 51, "strong"),      // Noah latest
  ...makeWordAssessments(ASSESSMENT_IDS[9], "The Cat on the Mat", 0, "weak"),        // Aiden latest (reuse idx)
  ...makeWordAssessments(ASSESSMENT_IDS[11], "Birds in the Park", 17, "mid"),        // Olivia latest
  ...makeWordAssessments(ASSESSMENT_IDS[13], "Sunny Day Adventure", 34, "mid"),      // Jackson latest
  ...makeWordAssessments(ASSESSMENT_IDS[15], "The Little Train", 51, "strong"),      // Mia latest
];

// ── Phonemes (simplified - for a few words) ──
export const demoPhonemes: DbPhoneme[] = demoWordAssessments
  .filter(wa => wa.error_type === "mispronunciation" || wa.error_type === "substitution")
  .flatMap(wa => [
    { id: `demo-ph-${wa.id}-1`, word_assessment_id: wa.id, phoneme: wa.word[0]?.toLowerCase() ?? "t", expected: wa.word[0]?.toLowerCase() ?? "t", quality: wa.confidence },
    { id: `demo-ph-${wa.id}-2`, word_assessment_id: wa.id, phoneme: "ə", expected: wa.word.slice(1, 3).toLowerCase(), quality: Math.max(20, wa.confidence - 20) },
  ]);

// ── Class Stats ──────────────────────────────────────
export const demoClassStats: ClassStats = {
  avgFluency: 88,
  avgAccuracy: 89,
  belowBenchmark: 2,
  totalStudents: 8,
};

// ── Intervention Clusters ────────────────────────────
export const demoClusters: DbClusterWithStudents[] = [
  {
    id: "demo-cl-001",
    class_id: CLASS_ID,
    error_pattern: "Initial Consonant Blends (br, tr, gr)",
    description: "Students consistently struggle with initial consonant blends, especially 'br' and 'tr' combinations.",
    severity: "high",
    suggested_activity: "Use word sorts with blend families. Start with 2-letter blends (br, tr) before moving to 3-letter blends (str, spr). Practice with decodable readers focusing on blend patterns.",
    studentIds: [STUDENT_IDS[1], STUDENT_IDS[4]],
    studentNames: [
      { id: STUDENT_IDS[1], name: "LC2", avatar: "🐼" },
      { id: STUDENT_IDS[4], name: "AP5", avatar: "🦋" },
    ],
  },
  {
    id: "demo-cl-002",
    class_id: CLASS_ID,
    error_pattern: "Long Vowel Substitutions",
    description: "Substituting short vowels for long vowels in CVCe words (e.g., 'mat' for 'mate', 'bit' for 'bite').",
    severity: "medium",
    suggested_activity: "Practice 'magic e' word pairs. Use Elkonin boxes to show the vowel change. Play 'Flip the Sound' card game with CVC → CVCe word pairs.",
    studentIds: [STUDENT_IDS[1], STUDENT_IDS[6], STUDENT_IDS[4]],
    studentNames: [
      { id: STUDENT_IDS[1], name: "LC2", avatar: "🐼" },
      { id: STUDENT_IDS[6], name: "JL7", avatar: "🌻" },
      { id: STUDENT_IDS[4], name: "AP5", avatar: "🦋" },
    ],
  },
  {
    id: "demo-cl-003",
    class_id: CLASS_ID,
    error_pattern: "Word Ending Omissions (-ed, -ing)",
    description: "Students drop inflectional endings, reading 'walk' instead of 'walked' or 'play' instead of 'playing'.",
    severity: "low",
    suggested_activity: "Highlight endings with colored markers during shared reading. Use a 'base word + ending' matching activity. Read sentences aloud emphasizing past tense vs. present.",
    studentIds: [STUDENT_IDS[5], STUDENT_IDS[6]],
    studentNames: [
      { id: STUDENT_IDS[5], name: "OM6", avatar: "🐢" },
      { id: STUDENT_IDS[6], name: "JL7", avatar: "🌻" },
    ],
  },
];

// ── Passages Library ─────────────────────────────────
export const demoPassages: DbPassage[] = [
  {
    id: "demo-p-001",
    title: "The Cat on the Mat",
    content: "The little cat sat on the warm mat. It watched the birds fly over the tall fence. The sun was going down and the sky turned orange and pink.",
    word_count: 30,
    grade_level: "1st",
    created_at: daysAgo(60),
    teacher_id: "demo-teacher",
  },
  {
    id: "demo-p-002",
    title: "Sunny Day Adventure",
    content: "The sun was bright and warm today. We walked through the green garden and saw beautiful flowers. A butterfly landed on my hand and I held very still.",
    word_count: 29,
    grade_level: "2nd",
    created_at: daysAgo(45),
    teacher_id: "demo-teacher",
  },
  {
    id: "demo-p-003",
    title: "Birds in the Park",
    content: "Small birds were singing in the tall trees. They flew from branch to branch looking for food. A red robin found a worm and carried it to her nest.",
    word_count: 30,
    grade_level: "2nd",
    created_at: daysAgo(30),
    teacher_id: "demo-teacher",
  },
  {
    id: "demo-p-004",
    title: "The Little Train",
    content: "The small train went up the big hill. It puffed and chugged along the shiny metal tracks. All the children waved as it passed by the station.",
    word_count: 28,
    grade_level: "1st",
    created_at: daysAgo(15),
    teacher_id: "demo-teacher",
  },
];

// ── Helper: check if an ID is a demo ID ──────────────
export function isDemoId(id: string): boolean {
  return id.startsWith("demo-");
}

// ── Helper: get assessments for a student ────────────
export function getDemoAssessmentsForStudent(studentId: string): DemoAssessment[] {
  return demoAssessments
    .filter(a => a.student_id === studentId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Helper: get word assessments for an assessment ───
export function getDemoWordAssessments(assessmentId: string): DbWordAssessment[] {
  return demoWordAssessments.filter(wa => wa.assessment_id === assessmentId);
}

// ── Helper: get phonemes for word assessment IDs ─────
export function getDemoPhonemes(waIds: string[]): DbPhoneme[] {
  return demoPhonemes.filter(p => waIds.includes(p.word_assessment_id));
}

// ── Student card assessment data ─────────────────────
export function getDemoStudentCardAssessments(studentId: string) {
  const studentAssessments = getDemoAssessmentsForStudent(studentId);
  return studentAssessments.slice(-2).reverse().map(a => ({
    fluency_score: a.fluency_score,
    accuracy_score: a.accuracy_score,
  }));
}
