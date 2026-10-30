import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDemoId, demoClassStats } from "@/data/demoData";
import { weightedAverageWPM } from "@/lib/wpmUtils";

export interface ClassStats {
  avgFluency: number;
  avgAccuracy: number;
  belowBenchmark: number;
  totalStudents: number;
}

export function useClassStats(classId?: string, benchmarkWPM = 80) {
  return useQuery({
    queryKey: ["class-stats", classId],
    queryFn: async () => {
      if (classId && isDemoId(classId)) {
        return demoClassStats;
      }

      const { data: students, error } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", classId!);
      if (error) throw error;
      if (!students || students.length === 0) {
        return { avgFluency: 0, avgAccuracy: 0, belowBenchmark: 0, totalStudents: 0 };
      }

      const studentIds = students.map(s => s.id);

      const { data: assessments } = await (supabase as any)
        .from("assessments")
        .select("student_id, fluency_score, accuracy_score, wpm, duration_seconds, date")
        .in("student_id", studentIds)
        .order("date", { ascending: false });

      // Get latest assessment per student
      const latestMap = new Map<string, { fluency_score: number; accuracy_score: number; wpm: number; duration_seconds: number | null }>();
      (assessments ?? []).forEach((a: any) => {
        if (!latestMap.has(a.student_id)) {
          latestMap.set(a.student_id, {
            fluency_score: a.fluency_score,
            accuracy_score: a.accuracy_score,
            wpm: a.wpm ?? a.fluency_score,
            duration_seconds: a.duration_seconds,
          });
        }
      });

      const latestArr = Array.from(latestMap.values());
      if (latestArr.length === 0) {
        return { avgFluency: 0, avgAccuracy: 0, belowBenchmark: 0, totalStudents: students.length };
      }

      // Weighted average WPM: total words / total time (not average of averages)
      const avgFluency = weightedAverageWPM(latestArr);
      const avgAccuracy = Math.round(latestArr.reduce((s, a) => s + a.accuracy_score, 0) / latestArr.length);
      const belowBenchmark = latestArr.filter(a => a.wpm < benchmarkWPM).length;

      return { avgFluency, avgAccuracy, belowBenchmark, totalStudents: students.length } as ClassStats;
    },
    enabled: !!classId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
