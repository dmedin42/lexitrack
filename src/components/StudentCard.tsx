import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbStudent } from "@/hooks/useStudents";
import { isDemoId, getDemoStudentCardAssessments } from "@/data/demoData";

interface StudentCardProps {
  student: DbStudent;
  index: number;
  benchmarkWPM: number;
  onboardingTarget?: string;
}

const StudentCard = ({ student, index, benchmarkWPM, onboardingTarget }: StudentCardProps) => {
  const navigate = useNavigate();

  const { data: assessments } = useQuery({
    queryKey: ["student-card-assessments", student.id],
    queryFn: async () => {
      if (isDemoId(student.id)) {
        return getDemoStudentCardAssessments(student.id);
      }
      const { data } = await (supabase as any)
        .from("assessments")
        .select("fluency_score, accuracy_score, wpm, duration_seconds")
        .eq("student_id", student.id)
        .order("date", { ascending: false })
        .limit(2);
      return data ?? [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const latest = assessments?.[0];
  const prev = assessments?.[1];
  const fluency = (latest as any)?.wpm ?? latest?.fluency_score ?? 0;
  const accuracy = latest?.accuracy_score ?? 0;
  const prevWpm = (prev as any)?.wpm ?? prev?.fluency_score ?? 0;
  const fluencyDelta = prev ? fluency - prevWpm : 0;
  const belowBenchmark = fluency < benchmarkWPM;

  return (
    <motion.div
      className="stat-card cursor-pointer group"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      onClick={() => navigate(`/students/${student.id}`)}
      whileHover={{ y: -2 }}
      {...(onboardingTarget ? { "data-onboarding": onboardingTarget } : {})}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{student.avatar}</span>
        <div className="min-w-0">
          <h3 className="font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {student.name}
          </h3>
          <p className="text-xs text-muted-foreground">{student.grade} Grade</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Fluency</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-bold ${belowBenchmark ? "text-destructive" : "text-primary"}`}>
              {fluency}
            </span>
            <span className="text-xs text-muted-foreground">WPM</span>
            {fluencyDelta !== 0 && (
              <span className={`flex items-center text-xs ${fluencyDelta > 0 ? "text-word-correct" : "text-destructive"}`}>
                {fluencyDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(fluencyDelta)}
              </span>
            )}
            {fluencyDelta === 0 && latest && <Minus className="w-3 h-3 text-muted-foreground" />}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Accuracy</p>
          <span className="text-lg font-bold text-foreground">{accuracy}%</span>
        </div>
      </div>

      {belowBenchmark && latest && (
        <div className="mt-2 px-2 py-1 rounded-md bg-destructive/8 text-destructive text-xs font-medium">
          Below {benchmarkWPM} WPM benchmark
        </div>
      )}
    </motion.div>
  );
};

export default StudentCard;
