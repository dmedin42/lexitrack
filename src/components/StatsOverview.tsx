import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { ClassStats } from "@/hooks/useClassStats";

interface StatsOverviewProps {
  stats: ClassStats;
}

const StatsOverview = ({ stats }: StatsOverviewProps) => {
  const cards = [
    {
      label: "Class Avg Fluency",
      value: `${stats.avgFluency} WPM`,
      icon: BookOpen,
      accent: "primary" as const,
    },
    {
      label: "Class Avg Accuracy",
      value: `${stats.avgAccuracy}%`,
      icon: TrendingUp,
      accent: "primary" as const,
    },
    {
      label: "Total Students",
      value: stats.totalStudents.toString(),
      icon: Users,
      accent: "muted" as const,
    },
    {
      label: "Below Benchmark",
      value: stats.belowBenchmark.toString(),
      icon: AlertTriangle,
      accent: "destructive" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="stat-card flex items-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.35 }}
        >
          <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${
            card.accent === "destructive"
              ? "bg-destructive/10 text-destructive"
              : card.accent === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}>
            <card.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-display font-bold text-foreground">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsOverview;
