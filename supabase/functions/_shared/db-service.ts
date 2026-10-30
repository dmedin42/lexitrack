/**
 * Database service for persisting assessment results.
 * Uses the Supabase Service Role key for privileged inserts.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MappedWord, FinalScores } from "./lexi-math.ts";

export interface AssessmentPayload {
  studentId: string;
  passageTitle: string;
  scores: FinalScores;
  durationSeconds: number;
  wpm: number;
  retellTranscription?: string | null;
  mappedWords: MappedWord[];
}

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Sanitize text for DB storage. */
function sanitize(str: string): string {
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x00-\x7F]/g, "");
}

/** Insert an assessment row and its word-level results in batches. */
export async function saveAssessment(payload: AssessmentPayload): Promise<string | null> {
  const supabase = getAdminClient();

  const { data: assessment, error } = await supabase
    .from("assessments")
    .insert({
      student_id: payload.studentId,
      passage_title: sanitize(payload.passageTitle),
      date: new Date().toISOString(),
      fluency_score: payload.scores.fluency_score,
      accuracy_score: payload.scores.accuracy_score,
      duration_seconds: Math.round(payload.durationSeconds),
      completeness_score: payload.scores.completeness_score,
      prosody_score: payload.scores.prosody_score,
      wpm: payload.wpm,
      retell_transcription: payload.retellTranscription || null,
    })
    .select("id")
    .single();

  if (error || !assessment) {
    console.error("Assessment insert error:", error?.message);
    return null;
  }

  // Batch insert word assessments (100 rows per batch)
  const wordRows = payload.mappedWords.map((w) => ({
    assessment_id: assessment.id,
    word_index: w.word_index,
    word: w.word,
    error_type: w.error_type,
    confidence: w.accuracy_score,
    offset_ms: w.offset_ms,
    duration_ms: w.duration_ms,
  }));

  const BATCH_SIZE = 100;
  for (let i = 0; i < wordRows.length; i += BATCH_SIZE) {
    await supabase.from("word_assessments").insert(wordRows.slice(i, i + BATCH_SIZE));
  }

  return assessment.id;
}
