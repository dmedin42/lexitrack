import { useErrorPatterns } from "@/hooks/useAssessments";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface ErrorPatternInsightsProps {
  studentId: string;
}

const ErrorPatternInsights = ({ studentId }: ErrorPatternInsightsProps) => {
  const { data: patterns, isLoading } = useErrorPatterns(studentId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground animate-pulse">Analyzing error patterns…</div>;
  }

  const mispronunciations = (patterns ?? []).filter(p => p.errorType === "mispronunciation");
  const omissions = (patterns ?? []).filter(p => p.errorType === "omission");

  if (mispronunciations.length === 0 && omissions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-lg">🎉</span> No recurring error patterns found across recent assessments.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mispronunciations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-accent" />
            Mispronunciations
          </h4>
          <div className="flex flex-wrap gap-2">
            {mispronunciations.map(p => (
              <Badge key={p.word} variant="secondary" className="border border-accent/30 bg-accent/10 text-foreground">
                "{p.word}" <span className="ml-1 text-muted-foreground">×{p.count}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
      {omissions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            Omissions
          </h4>
          <div className="flex flex-wrap gap-2">
            {omissions.map(p => (
              <Badge key={p.word} variant="secondary" className="border border-border bg-muted text-foreground">
                "{p.word}" <span className="ml-1 text-muted-foreground">×{p.count}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorPatternInsights;
