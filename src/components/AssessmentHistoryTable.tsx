import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { runSanityCheck } from "@/lib/sanityCheck";

interface Assessment {
  id: string;
  date: string;
  passage_title: string | null;
  fluency_score: number;
  accuracy_score: number;
  comprehension_score?: number | null;
  manual_score_override?: number | null;
  wpm?: number;
  in_review?: boolean;
}

interface AssessmentHistoryTableProps {
  assessments: Assessment[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

const AssessmentHistoryTable = ({ assessments, selectedId, onSelect }: AssessmentHistoryTableProps) => {
  return (
    <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Passage</TableHead>
              <TableHead className="text-right">WPM</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Comp</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((a) => {
              const override = (a as any).manual_score_override;
              const compScore = (a as any).comprehension_score;
              const displayComp = override ?? compScore;
              const wpm = a.wpm ?? a.fluency_score;
              const sanity = runSanityCheck(wpm, a.accuracy_score);

              return (
                <TableRow
                  key={a.id}
                  className={a.id === selectedId ? "bg-primary/10" : ""}
                >
                  <TableCell className="font-medium">
                    {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell>{a.passage_title ?? "Untitled"}</TableCell>
                  <TableCell className="text-right font-semibold">{wpm}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {a.accuracy_score}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {displayComp != null ? `${displayComp}%` : "—"}
                    {override != null && (
                      <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1">override</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {(a as any).in_review ? (
                      <Badge className="bg-[hsl(45,93%,47%)] text-[hsl(45,93%,10%)] gap-1">
                        <AlertTriangle className="w-3 h-3" /> In Review
                      </Badge>
                    ) : sanity.flag === "valid" ? (
                      <Badge className="bg-[hsl(142,71%,45%)] text-white gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid
                      </Badge>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-[hsl(45,93%,47%)] text-[hsl(45,93%,10%)] gap-1 cursor-help">
                            <AlertTriangle className="w-3 h-3" /> Review
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm font-medium">Review Required</p>
                          <p className="text-xs text-muted-foreground">{sanity.reason}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={a.id === selectedId ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSelect(a.id)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      {a.id === selectedId ? "Viewing" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
};

export default AssessmentHistoryTable;
