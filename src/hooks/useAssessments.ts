import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDemoId, getDemoWordAssessments, getDemoPhonemes } from "@/data/demoData";

export interface DbWordAssessment {
  id: string;
  assessment_id: string;
  word_index: number;
  word: string;
  error_type: string;
  detected_word: string | null;
  confidence: number;
  offset_ms: number;
  duration_ms: number;
  vouched: boolean;
  vouched_by: string | null;
  vouched_at: string | null;
}

export interface DbPhoneme {
  id: string;
  word_assessment_id: string;
  phoneme: string;
  expected: string;
  quality: number;
}

export function useWordAssessments(assessmentId: string | undefined) {
  return useQuery({
    queryKey: ["word-assessments", assessmentId],
    queryFn: async () => {
      if (assessmentId && isDemoId(assessmentId)) {
        return getDemoWordAssessments(assessmentId);
      }
      const { data, error } = await supabase
        .from("word_assessments")
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("word_index", { ascending: true });
      if (error) throw error;
      return data as DbWordAssessment[];
    },
    enabled: !!assessmentId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function usePhonemes(wordAssessmentIds: string[]) {
  return useQuery({
    queryKey: ["phonemes", wordAssessmentIds],
    queryFn: async () => {
      if (wordAssessmentIds.length === 0) return [];
      if (wordAssessmentIds.some(id => isDemoId(id))) {
        return getDemoPhonemes(wordAssessmentIds);
      }
      const { data, error } = await supabase
        .from("phoneme_details")
        .select("*")
        .in("word_assessment_id", wordAssessmentIds);
      if (error) throw error;
      return data as DbPhoneme[];
    },
    enabled: wordAssessmentIds.length > 0,
  });
}

export interface ErrorPatternEntry {
  word: string;
  errorType: string;
  count: number;
}

export function useErrorPatterns(studentId: string | undefined) {
  return useQuery({
    queryKey: ["error-patterns", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      // For demo data
      if (isDemoId(studentId)) {
        const { getDemoAssessmentsForStudent } = await import("@/data/demoData");
        const assessments = getDemoAssessmentsForStudent(studentId);
        const recentIds = assessments.slice(-5).map(a => a.id);
        const allWa = recentIds.flatMap(id => getDemoWordAssessments(id));
        const errors = allWa.filter(wa => wa.error_type === "mispronunciation" || wa.error_type === "omission");
        const freq = new Map<string, { word: string; errorType: string; count: number }>();
        errors.forEach(wa => {
          const key = `${wa.word.toLowerCase()}-${wa.error_type}`;
          const existing = freq.get(key);
          if (existing) existing.count++;
          else freq.set(key, { word: wa.word.toLowerCase(), errorType: wa.error_type, count: 1 });
        });
        return [...freq.values()].sort((a, b) => b.count - a.count);
      }

      // Real Supabase: get last 5 assessment IDs
      const { data: recentAssessments, error: aErr } = await supabase
        .from("assessments")
        .select("id")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(5);
      if (aErr) throw aErr;
      if (!recentAssessments?.length) return [];

      const ids = recentAssessments.map(a => a.id);
      const { data: words, error: wErr } = await supabase
        .from("word_assessments")
        .select("word, error_type")
        .in("assessment_id", ids)
        .in("error_type", ["mispronunciation", "omission"]);
      if (wErr) throw wErr;

      const freq = new Map<string, ErrorPatternEntry>();
      (words ?? []).forEach(wa => {
        const key = `${wa.word.toLowerCase()}-${wa.error_type}`;
        const existing = freq.get(key);
        if (existing) existing.count++;
        else freq.set(key, { word: wa.word.toLowerCase(), errorType: wa.error_type, count: 1 });
      });
      return [...freq.values()].sort((a, b) => b.count - a.count) as ErrorPatternEntry[];
    },
    enabled: !!studentId,
  });
}
