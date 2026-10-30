import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VouchParams {
  wordAssessmentId: string; // format: "assessmentId-wordIndex"
  originalErrorType: string;
  reason?: string;
}

/**
 * Recalculate WPM and accuracy from word_analysis JSONB.
 * Mirrors lexi-math.ts logic: insertions excluded, unread excluded,
 * skip (mid-passage omission) counted as attempted but not correct.
 */
function recalcScores(wordAnalysis: any[], durationSeconds: number) {
  let wordsCorrect = 0;
  let totalAttempted = 0;
  let firstOffsetMs = -1;
  let lastEndMs = 0;

  for (const w of wordAnalysis) {
    const et = (w.error_type ?? "correct").toLowerCase();
    if (et === "unread" || et === "insertion") continue;
    if (et === "omission" || et === "skip") {
      totalAttempted++;
      continue;
    }
    // correct, mispronunciation, substitution
    totalAttempted++;
    if (et === "correct") wordsCorrect++;
    const offset = w.offset_ms ?? 0;
    const dur = w.duration_ms ?? 0;
    if (firstOffsetMs < 0) firstOffsetMs = offset;
    lastEndMs = offset + dur;
  }

  const spanSec = (lastEndMs - firstOffsetMs) / 1000;
  const effectiveSec = spanSec > 5 ? spanSec : durationSeconds > 5 ? durationSeconds : 0;
  const accuracy = totalAttempted > 0 ? Math.round((wordsCorrect / totalAttempted) * 100) : 0;
  const wpm = effectiveSec > 0 ? Math.round(wordsCorrect / (effectiveSec / 60)) : 0;

  return { wpm, accuracy };
}

export function useVouch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wordAssessmentId, originalErrorType, reason }: VouchParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Parse synthetic ID: "assessmentId-wordIndex"
      const lastDash = wordAssessmentId.lastIndexOf("-");
      if (lastDash === -1) throw new Error("Invalid word ID format");
      const assessmentId = wordAssessmentId.substring(0, lastDash);
      const wordIndex = parseInt(wordAssessmentId.substring(lastDash + 1), 10);
      if (isNaN(wordIndex)) throw new Error("Invalid word index");

      // Fetch current assessment
      const { data: assessment, error: fetchErr } = await (supabase as any)
        .from("assessments")
        .select("word_analysis, duration_seconds")
        .eq("id", assessmentId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!assessment?.word_analysis) throw new Error("No word analysis found");

      const wordAnalysis = [...assessment.word_analysis];
      if (wordIndex < 0 || wordIndex >= wordAnalysis.length) throw new Error("Word index out of range");

      // Mark word as correct + vouched
      wordAnalysis[wordIndex] = {
        ...wordAnalysis[wordIndex],
        error_type: "correct",
        vouched: true,
        vouched_by: user.id,
        vouched_at: new Date().toISOString(),
        original_error_type: originalErrorType,
      };

      // Recalculate scores
      const { wpm, accuracy } = recalcScores(wordAnalysis, assessment.duration_seconds ?? 0);

      // Update assessment
      const { error: updateErr } = await (supabase as any)
        .from("assessments")
        .update({
          word_analysis: wordAnalysis,
          wpm,
          accuracy_score: accuracy,
        })
        .eq("id", assessmentId);
      if (updateErr) throw updateErr;

      return { assessmentId, wpm, accuracy };
    },
    onSuccess: (data) => {
      // Invalidate student detail to refresh hero metrics + word map
      queryClient.invalidateQueries({ queryKey: ["student-detail"] });
      queryClient.invalidateQueries({ queryKey: ["vouch-history"] });
    },
  });
}
