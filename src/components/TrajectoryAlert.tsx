import { AlertTriangle } from "lucide-react";

interface TrajectoryAlertProps {
  currentWPM: number;
  goalWPM: number | null;
  goalDate: string | null;
  benchmarkWPM: number;
  assessmentDates: { date: string; fluency: number }[];
}

const TrajectoryAlert = ({ currentWPM, goalWPM, goalDate, benchmarkWPM, assessmentDates }: TrajectoryAlertProps) => {
  const target = goalWPM ?? benchmarkWPM;

  if (currentWPM >= target) return null;

  // Simple trajectory check: if goal_date is set, compute required weekly gain
  let message = `Currently at ${currentWPM} WPM — below the ${target} WPM target.`;

  if (goalDate && assessmentDates.length >= 2) {
    const now = new Date();
    const deadline = new Date(goalDate);
    const weeksLeft = Math.max(1, (deadline.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const gap = target - currentWPM;
    const requiredWeeklyGain = (gap / weeksLeft).toFixed(1);
    message += ` Needs +${requiredWeeklyGain} WPM/week to reach goal by ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`;
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/8 border border-destructive/20">
      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-display font-bold text-destructive text-sm">Below Goal Trajectory</p>
        <p className="text-sm text-foreground mt-0.5">{message}</p>
      </div>
    </div>
  );
};

export default TrajectoryAlert;
