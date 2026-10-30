import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Lightbulb, Users } from "lucide-react";
import { useClasses } from "@/hooks/useStudents";
import { useClusters, DbClusterWithStudents } from "@/hooks/useClusters";
import AppLayout from "@/components/AppLayout";

const severityStyles = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-accent bg-accent/5",
  low: "border-l-primary bg-primary/5",
};

const ClusterView = () => {
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const navigate = useNavigate();

  if (classes && classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0].id);
  }

  const { data: clusters, isLoading } = useClusters(selectedClassId || undefined);

  const sorted = [...(clusters ?? [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6">
          <h1 className="text-3xl font-display font-extrabold text-foreground">Sound-Check Dashboard</h1>
          <p className="text-muted-foreground mt-1">Automated intervention grouping by error pattern</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="stat-card animate-pulse h-48" />)}
          </div>
        ) : sorted.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sorted.map((cluster, i) => (
              <motion.div
                key={cluster.id}
                className={`rounded-xl border-l-4 p-5 bg-card shadow-card ${severityStyles[cluster.severity]}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      cluster.severity === "high" ? "text-destructive" :
                      cluster.severity === "medium" ? "text-accent" : "text-primary"
                    }`} />
                    <h3 className="font-display font-bold text-foreground">{cluster.error_pattern}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                    cluster.severity === "high" ? "bg-destructive/10 text-destructive" :
                    cluster.severity === "medium" ? "bg-accent/10 text-accent-foreground" :
                    "bg-primary/10 text-primary"
                  }`}>
                    {cluster.severity}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{cluster.description}</p>

                <div className="flex items-center gap-1.5 mb-3">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="flex gap-1 flex-wrap">
                    {cluster.studentNames.map(s => (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/students/${s.id}`)}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {s.avatar} {s.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {cluster.suggested_activity && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                    <Lightbulb className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{cluster.suggested_activity}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No intervention clusters yet. Import assessments to see automated groupings.</p>
        )}
      </motion.div>
    </AppLayout>
  );
};

export default ClusterView;
