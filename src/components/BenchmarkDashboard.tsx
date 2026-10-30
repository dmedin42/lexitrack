import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Target, Trophy, Activity, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface Assessment {
  id: string;
  date: string;
  fluency_score: number;
  accuracy_score: number;
  wpm?: number;
  passage_title?: string;
}

interface BenchmarkDashboardProps {
  assessments: Assessment[];
  activeAssessment: Assessment | undefined;
  goalWPM: number | null;
  benchmarkWPM: number;
}

const BenchmarkDashboard = ({ assessments, activeAssessment, goalWPM, benchmarkWPM }: BenchmarkDashboardProps) => {
  // Sparkline data — must be called before any early returns
  const sparklineData = useMemo(() => {
    if (!assessments || assessments.length === 0) return [];
    const recent = assessments.slice(0, 5).reverse();
    return recent.map(a => ({
      wpm: (a as any)?.wpm ?? a.fluency_score ?? 0,
    }));
  }, [assessments]);

  if (!activeAssessment || assessments.length < 1) return null;

  const currentWPM = (activeAssessment as any)?.wpm ?? activeAssessment.fluency_score ?? 0;
  const currentAccuracy = activeAssessment.accuracy_score ?? 0;

  // Find the previous assessment (the one right before the active one)
  const activeIndex = assessments.findIndex(a => a.id === activeAssessment.id);
  const previousAssessment = activeIndex >= 0 && activeIndex < assessments.length - 1
    ? assessments[activeIndex + 1] // assessments are desc, so +1 is older
    : null;

  const prevWPM = previousAssessment ? ((previousAssessment as any)?.wpm ?? previousAssessment.fluency_score ?? 0) : null;
  const prevAccuracy = previousAssessment?.accuracy_score ?? null;

  const wpmDelta = prevWPM !== null ? currentWPM - prevWPM : null;
  const accuracyDelta = prevAccuracy !== null ? currentAccuracy - prevAccuracy : null;

  const prevDate = previousAssessment
    ? new Date(previousAssessment.date).toLocaleDateString("en-US", { weekday: "long" })
    : null;

  // Goal progress
  const effectiveGoal = goalWPM ?? benchmarkWPM;
  const goalProgress = Math.min(100, Math.round((currentWPM / effectiveGoal) * 100));
  const goalSmashed = currentWPM >= effectiveGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl bg-card border border-border shadow-sm p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-primary" />
          Growth Narrative
        </h3>
        {/* Sparkline */}
        {sparklineData.length >= 2 && (
          <div className="w-24 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Delta cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Speed delta */}
        <div className="rounded-lg bg-secondary/50 border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Speed</span>
          </div>
          {wpmDelta !== null ? (
            <>
              <div className="flex items-center gap-1.5">
                {wpmDelta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : wpmDelta < 0 ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={`text-xl font-display font-bold ${
                  wpmDelta > 0 ? "text-primary" : wpmDelta < 0 ? "text-destructive" : "text-foreground"
                }`}>
                  {wpmDelta > 0 ? "+" : ""}{wpmDelta} WPM
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                since {prevDate}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">First assessment — {currentWPM} WPM</p>
          )}
        </div>

        {/* Accuracy delta */}
        <div className="rounded-lg bg-secondary/50 border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Accuracy</span>
          </div>
          {accuracyDelta !== null ? (
            <>
              <div className="flex items-center gap-1.5">
                {accuracyDelta > 0 ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : accuracyDelta < 0 ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={`text-xl font-display font-bold ${
                  accuracyDelta === 0 ? "text-primary" : accuracyDelta > 0 ? "text-primary" : "text-destructive"
                }`}>
                  {accuracyDelta === 0 ? `Maintained ${currentAccuracy}%` : `${accuracyDelta > 0 ? "+" : ""}${accuracyDelta}%`}
                </span>
              </div>
              {accuracyDelta !== 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {prevAccuracy}% → {currentAccuracy}%
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">First assessment — {currentAccuracy}%</p>
          )}
        </div>
      </div>

      {/* Goal tracker progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {goalWPM ? "Individual Goal" : "Class Benchmark"}: {effectiveGoal} WPM
          </span>
          <span className={`text-xs font-bold ${goalSmashed ? "text-[hsl(45,90%,45%)]" : "text-foreground"}`}>
            {currentWPM} / {effectiveGoal} WPM
          </span>
        </div>
        <div className="relative h-4 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full transition-colors ${
              goalSmashed
                ? "bg-gradient-to-r from-[hsl(45,90%,50%)] to-[hsl(35,95%,55%)]"
                : "bg-primary"
            }`}
          />
          {/* Target icon at end */}
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            <Target className={`w-3 h-3 ${goalSmashed ? "text-[hsl(45,90%,35%)]" : "text-muted-foreground"}`} />
          </div>
        </div>
        {goalSmashed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 flex justify-center"
          >
            <Badge className="bg-gradient-to-r from-[hsl(45,90%,50%)] to-[hsl(35,95%,55%)] text-white border-0 gap-1.5 px-3 py-1 text-sm font-bold shadow-md">
              <Trophy className="w-4 h-4" /> Goal Smashed!
            </Badge>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BenchmarkDashboard;
