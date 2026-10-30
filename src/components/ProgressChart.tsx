import { useMemo } from "react";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";

interface Assessment {
  id: string;
  date: string;
  fluency_score: number;
  accuracy_score: number;
  wpm?: number;
  prosody_score?: number;
  completeness_score?: number;
  manual_score_override?: number | null;
  in_review?: boolean;
}

interface ProgressChartProps {
  assessments: Assessment[];
  benchmarkWPM: number;
  goalWPM?: number | null;
  goalDate?: string | null;
  showComprehension?: boolean;
}

const ProgressChart = ({ assessments, benchmarkWPM, goalWPM, goalDate, showComprehension }: ProgressChartProps) => {
  // Filter out in_review assessments from chart data
  const verifiedAssessments = useMemo(() =>
    assessments.filter(a => !(a as any).in_review),
    [assessments]
  );

  const hasAnyComprehension = useMemo(() =>
    verifiedAssessments.some(a => (a as any).comprehension_score != null || (a as any).manual_score_override != null),
    [verifiedAssessments]
  );

  const data = useMemo(() =>
    verifiedAssessments.map(a => ({
      date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      wpm: a.wpm ?? a.fluency_score,
      accuracy: a.accuracy_score,
      comprehension: (a as any).manual_score_override ?? (a as any).comprehension_score ?? null,
    })),
    [verifiedAssessments]
  );

  const chartData = useMemo(() => {
    if (!goalWPM || !goalDate) return data;
    const goalLabel = new Date(goalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const lastDate = verifiedAssessments[verifiedAssessments.length - 1]?.date;
    if (lastDate && new Date(goalDate) > new Date(lastDate)) {
      return [...data, { date: goalLabel, wpm: goalWPM, accuracy: null as any }];
    }
    return data;
  }, [data, goalWPM, goalDate, verifiedAssessments]);

  return (
    <div className="w-full h-[300px]" role="img" aria-label="Student progress chart showing words per minute and accuracy over time">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            label={{ value: "WPM", angle: -90, position: "insideLeft", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            allowDataOverflow={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            label={{ value: "Accuracy %", angle: 90, position: "insideRight", fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: 13,
            }}
          />
          <Legend />
          <ReferenceLine
            yAxisId="left"
            y={benchmarkWPM}
            stroke="hsl(var(--chart-benchmark))"
            strokeDasharray="6 4"
            label={{ value: `Benchmark: ${benchmarkWPM} WPM`, position: "insideTopRight", fontSize: 11, fill: "hsl(var(--chart-benchmark))" }}
          />
          {goalWPM && (
            <ReferenceLine
              yAxisId="left"
              y={goalWPM}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              label={{ value: `Goal: ${goalWPM} WPM`, position: "insideBottomRight", fontSize: 11, fill: "hsl(var(--primary))" }}
            />
          )}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="wpm"
            stroke="hsl(var(--chart-fluency))"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "hsl(var(--chart-fluency))" }}
            name="WPM"
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="accuracy"
            stroke="hsl(var(--chart-accuracy))"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "hsl(var(--chart-accuracy))" }}
            name="Accuracy %"
            connectNulls
          />
          {showComprehension && hasAnyComprehension && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="comprehension"
              stroke="hsl(var(--chart-comprehension))"
              strokeWidth={2.5}
              strokeDasharray="2 2"
              dot={{ r: 4, fill: "hsl(var(--chart-comprehension))" }}
              name="Comprehension %"
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;
