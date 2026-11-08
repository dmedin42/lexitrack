import { motion } from "framer-motion";
import { Star, BookOpen, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY as SUPABASE_ANON_KEY } from "@/lib/supabase/client";

const PublicParentReport = () => {
  const { studentId } = useParams<{ studentId: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-parent-report", studentId],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/get-parent-report?studentId=${studentId}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to load report");
      return res.json() as Promise<{
        student: { id: string; name: string; avatar: string; grade: string };
        assessment: {
          id: string; date: string; fluency_score: number; accuracy_score: number;
          words: { word: string; error_type: string; detected_word: string | null; confidence: number }[];
        } | null;
      }>;
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading report...</div>
      </div>
    );
  }

  if (isError || !data?.student || !data?.assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-lg">Report not available.</p>
      </div>
    );
  }

  const { student, assessment } = data;
  const mastered = assessment.words.filter(w => w.error_type === "correct" && w.confidence >= 90);
  const practiceWords = assessment.words
    .filter(w => w.error_type === "substitution" || w.error_type === "mispronunciation")
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-display font-extrabold text-foreground">Home Connection Report</h1>
          <p className="text-muted-foreground mt-1">A friendly snapshot for caregivers</p>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
          <div className="bg-primary p-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{student.avatar}</span>
              <div>
                <h2 className="font-display font-extrabold text-2xl">{student.name}</h2>
                <p className="opacity-90">
                  Reading Progress Update •{" "}
                  {new Date(assessment.date).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card text-center">
                <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-sm text-muted-foreground">Reading Speed</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {assessment.fluency_score} <span className="text-sm font-normal">words/min</span>
                </p>
              </div>
              <div className="stat-card text-center">
                <Star className="w-5 h-5 mx-auto mb-1 text-accent" />
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-display font-bold text-foreground">{assessment.accuracy_score}%</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-word-correct" />
                <h3 className="font-display font-bold text-foreground text-lg">This Week's Wins! 🎉</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {mastered.length > 0 ? mastered.map((w, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full bg-word-correct/10 text-word-correct font-medium text-sm">
                    ✓ {w.word}
                  </span>
                )) : (
                  <p className="text-sm text-muted-foreground">Keep practicing — wins are on the way!</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-foreground text-lg mb-3">📖 Practice List for Home</h3>
              {practiceWords.length > 0 ? (
                <div className="space-y-2">
                  {practiceWords.map((w, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                      <span className="font-medium text-foreground">{w.word}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.error_type === "substitution"
                          ? `Said "${w.detected_word}" instead`
                          : "Needs pronunciation practice"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No practice words this week — great job!</p>
              )}
            </div>

            <div className="text-center p-4 rounded-xl bg-muted">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Read together for 10-15 minutes each night. Let your child point to the words as they read!
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PublicParentReport;
