import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VouchHistoryProps {
  studentId: string;
}

const VouchHistory = ({ studentId }: VouchHistoryProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["vouch-history", studentId],
    queryFn: async () => {
      // Get assessment IDs for this student
      const { data: assessments } = await supabase
        .from("assessments")
        .select("id")
        .eq("student_id", studentId);
      if (!assessments || assessments.length === 0) return [];

      const aIds = assessments.map(a => a.id);
      const { data: wordAssessments } = await supabase
        .from("word_assessments")
        .select("id, word")
        .in("assessment_id", aIds)
        .eq("vouched", true);
      if (!wordAssessments || wordAssessments.length === 0) return [];

      const waIds = wordAssessments.map(w => w.id);
      const wordMap = new Map(wordAssessments.map(w => [w.id, w.word]));

      const { data: vouchLogs } = await supabase
        .from("vouch_log")
        .select("*")
        .in("word_assessment_id", waIds)
        .order("created_at", { ascending: false });

      return (vouchLogs ?? []).map(l => ({
        ...l,
        word: wordMap.get(l.word_assessment_id) ?? "—",
      }));
    },
    enabled: !!studentId,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading vouch history...</p>;
  if (!logs || logs.length === 0) return <p className="text-sm text-muted-foreground">No teacher overrides yet.</p>;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Word</TableHead>
            <TableHead>Original Error</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.word}</TableCell>
              <TableCell>
                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold uppercase">
                  {log.original_error_type}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{log.reason || "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VouchHistory;
