import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Activity, Target, Gauge, Brain, BookOpen, Save, Timer, ChevronDown, ChevronRight, Settings, Edit2, Check, X, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";
import { runSanityCheck, type SanityResult } from "@/lib/sanityCheck";
import { useStudentWithAssessments } from "@/hooks/useStudents";
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import WordMap from "@/components/WordMap";
import ProgressChart from "@/components/ProgressChart";
import AssessmentHistoryTable from "@/components/AssessmentHistoryTable";
import ErrorPatternInsights from "@/components/ErrorPatternInsights";
import InviteCaregiverDialog from "@/components/InviteCaregiverDialog";
import VouchHistory from "@/components/VouchHistory";
import RetellSubstantiveVolume from "@/components/RetellSubstantiveVolume";
import WordTrackSection from "@/components/WordTrackSection";
import BenchmarkDashboard from "@/components/BenchmarkDashboard";
import EncouragementEngine from "@/components/EncouragementEngine";
import ScreenShareToggle from "@/components/ScreenShareToggle";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const StudentDetail = () => {
  const { id } = useParams<{id: string;}>();
  const { role } = useAuth();
  const { data, isLoading } = useStudentWithAssessments(id || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const latest = data?.assessments?.[0];
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | undefined>(undefined);
  const [screenShareMode, setScreenShareMode] = useState(false);

  // Use selected or default to latest
  const activeId = selectedAssessmentId ?? latest?.id;
  const activeAssessment = data?.assessments?.find((a) => a.id === activeId) ?? latest;

  // word_analysis is now a JSONB array on the assessment itself

  // Manual score override state
  const [manualScoreInput, setManualScoreInput] = useState<string>("");
  const [savingOverride, setSavingOverride] = useState(false);
  
  // Goal WPM editing state (flip card)
  const [wpmFlipped, setWpmFlipped] = useState(false);
  const [goalInput, setGoalInput] = useState<string>("");
  const [savingGoal, setSavingGoal] = useState(false);
  
  const [compOpen, setCompOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lexitrack-comp-open") || "true"); } catch { return true; }
  });
  const [errorPatternsOpen, setErrorPatternsOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lexitrack-error-patterns-open") || "false"); } catch { return false; }
  });

  // Sync manual score input when active assessment changes
  useMemo(() => {
    const override = (activeAssessment as any)?.manual_score_override;
    setManualScoreInput(override != null ? String(override) : "");
  }, [activeId, activeAssessment]);

  // Sync goal input when student changes
  useMemo(() => {
    setGoalInput(data?.student?.goal_wpm != null ? String(data.student.goal_wpm) : "");
  }, [data?.student?.goal_wpm]);

  // Build word map data from word_analysis JSONB on the assessment
  const words = useMemo(() => {
    const wordAnalysis = (activeAssessment as any)?.word_analysis;
    if (!wordAnalysis || !Array.isArray(wordAnalysis)) return [];
    return wordAnalysis.map((wa: any, idx: number) => ({
      id: `${activeId}-${idx}`,
      word: wa.word ?? "",
      errorType: (wa.error_type ?? "correct") as any,
      detectedWord: wa.detected_word ?? undefined,
      phonemes: wa.phonemes?.map((p: any) => ({
        phoneme: p.phoneme ?? "",
        expected: p.expected ?? p.phoneme ?? "",
        quality: p.accuracy_score ?? p.quality ?? 0,
      })),
      confidence: wa.accuracy_score ?? wa.confidence ?? 0,
      offsetMs: wa.offset_ms ?? 0,
      durationMs: wa.duration_ms ?? 0,
      vouched: wa.vouched ?? false,
    }));
  }, [activeAssessment, activeId]);

  // Include all words that have meaningful data (correct, errors, omissions, unread)
  const scoredWords = useMemo(() => words.filter((w) => w.confidence > 0 || w.errorType === "omission" || w.errorType === "mispronunciation" || w.errorType === "unread"), [words]);

  const handleSaveOverride = async () => {
    if (!activeId) return;
    setSavingOverride(true);
    const value = manualScoreInput ? parseInt(manualScoreInput) : null;
    const { data: updated, error } = await (supabase as any).
    from("assessments").
    update({ manual_score_override: value }).
    eq("id", activeId).
    select("manual_score_override").
    maybeSingle();
    setSavingOverride(false);
    if (error) {
      toast({ title: "Error saving override", description: error.message, variant: "destructive" });
    } else if (!updated) {
      toast({ title: "Update blocked", description: "You may not have permission to update this assessment. Check your database policies.", variant: "destructive" });
    } else {
      toast({ title: value != null ? "Manual score saved" : "Override cleared" });
      queryClient.invalidateQueries({ queryKey: ["student-detail", id] });
    }
  };

  const handleSaveGoal = async () => {
    if (!student?.id) return;
    setSavingGoal(true);
    const value = goalInput ? parseInt(goalInput) : null;
    const { error } = await (supabase as any)
      .from("students")
      .update({ goal_wpm: value })
      .eq("id", student.id);
    setSavingGoal(false);
    if (error) {
      toast({ title: "Error saving goal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: value != null ? "Goal saved" : "Goal cleared" });
      setWpmFlipped(false);
      queryClient.invalidateQueries({ queryKey: ["student-detail", id] });
    }
  };

  const [approvingReview, setApprovingReview] = useState(false);
  const [deletingAssessment, setDeletingAssessment] = useState(false);

  const handleApproveReview = useCallback(async () => {
    if (!activeId) return;
    setApprovingReview(true);
    const { error } = await (supabase as any)
      .from("assessments")
      .update({ in_review: false })
      .eq("id", activeId);
    setApprovingReview(false);
    if (error) {
      toast({ title: "Error approving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assessment approved and added to progress data" });
      queryClient.invalidateQueries({ queryKey: ["student-detail", id] });
    }
  }, [activeId, id, queryClient, toast]);

  const handleDeleteAssessment = useCallback(async () => {
    if (!activeId) return;
    setDeletingAssessment(true);
    const { error } = await (supabase as any)
      .from("assessments")
      .delete()
      .eq("id", activeId);
    if (error) {
      setDeletingAssessment(false);
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
      return;
    }
    // Verify deletion actually happened (RLS may silently block)
    const { data: still } = await (supabase as any)
      .from("assessments")
      .select("id")
      .eq("id", activeId)
      .maybeSingle();
    setDeletingAssessment(false);
    if (still) {
      toast({ title: "Delete blocked", description: "Row-level security prevented deletion. Check your database DELETE policy on the assessments table.", variant: "destructive" });
    } else {
      toast({ title: "Assessment deleted" });
      setSelectedAssessmentId(undefined);
      queryClient.invalidateQueries({ queryKey: ["student-detail", id] });
    }
  }, [activeId, id, queryClient, toast]);

  const isInReview = !!(activeAssessment as any)?.in_review;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading student data...</div>
        </div>
      </AppLayout>);

  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground text-lg">Student not found.</p>
          <Link to="/" className="mt-4 text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      </AppLayout>);

  }

  const { student, benchmarkWPM, assessments = [], enableRetell } = data as any;

  const retellTranscription = (activeAssessment as any)?.retell_transcription;
  const comprehensionScore = (activeAssessment as any)?.comprehension_score;
  const completenessScore = (activeAssessment as any)?.completeness_score;
  const timeLimitReached = completenessScore != null && completenessScore < 100;

  const manualCompOverride = (activeAssessment as any)?.manual_score_override;
  const displayedCompScore = manualCompOverride ?? comprehensionScore;

  // Run sanity check on active assessment
  const activeWpm = (activeAssessment as any)?.wpm ?? activeAssessment?.fluency_score ?? 0;
  const activeAccuracy = activeAssessment?.accuracy_score ?? 0;
  const activeSanity: SanityResult | null = activeAssessment
    ? runSanityCheck(activeWpm, activeAccuracy)
    : null;

  const heroMetrics = [
  { label: "Accuracy", value: `${activeAssessment?.accuracy_score ?? 0}%`, icon: Target, color: "text-accent" },
  { label: "Comprehension", value: displayedCompScore != null ? `${displayedCompScore}%` : "—", icon: Brain, color: "text-[hsl(210,80%,55%)]" }];


  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{student.avatar}</span>
            <div>
              <h1 className="text-3xl font-display font-extrabold text-foreground">{student.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                <span>{student.grade} Grade • Benchmark: {benchmarkWPM} WPM</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {role === "teacher" && (
              <ScreenShareToggle enabled={screenShareMode} onToggle={setScreenShareMode} />
            )}
            {role === "teacher" && (
              <InviteCaregiverDialog studentId={student.id} studentName={student.name} />
            )}
          </div>
        </div>

        {/* ── IN-REVIEW TRIAGE BANNER ── */}
        {isInReview && activeAssessment && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-[hsl(45,93%,70%)] bg-[hsl(45,93%,95%)] dark:bg-[hsl(45,30%,15%)] dark:border-[hsl(45,50%,30%)] p-4"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[hsl(45,93%,47%)] shrink-0" />
                <div>
                  <p className="font-display font-bold text-foreground">⚠️ Flagged for High Interference</p>
                  <p className="text-sm text-muted-foreground">This data is excluded from progress charts until approved.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5 shrink-0"
                  onClick={handleDeleteAssessment}
                  disabled={deletingAssessment}
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingAssessment ? "Deleting…" : "Delete"}
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={handleApproveReview}
                  disabled={approvingReview}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {approvingReview ? "Approving…" : "Approve & Verify"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── HERO: Latest / Selected Achievement ── */}
        {activeAssessment &&
        <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-display font-bold text-foreground">
                {activeId === latest?.id ? "Latest Achievement" : "Selected Assessment"}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(activeAssessment.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                {" — "}
                {(activeAssessment as any).passage_title ?? "Untitled"}
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* WPM flip card */}
              <div
                className="relative cursor-pointer"
                style={{ perspective: "600px" }}
                onClick={() => setWpmFlipped((f) => !f)}
              >
                <motion.div
                  className="w-full"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotateY: wpmFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {/* Front side */}
                  <div
                    className="stat-card text-center flex flex-col items-center justify-center py-4"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <Activity className="w-5 h-5 mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">WPM</p>
                    <p className="text-2xl font-display font-bold text-primary">
                      {(activeAssessment as any)?.wpm ?? activeAssessment?.fluency_score ?? 0}
                    </p>
                    {student.goal_wpm ? (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        🎯 Goal: <span className="font-semibold text-foreground">{student.goal_wpm}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1 inline-flex items-center gap-0.5">
                        <Edit2 className="w-2.5 h-2.5" /> Tap to set goal
                      </p>
                    )}
                  </div>

                  {/* Back side */}
                  <div
                    className="stat-card text-center absolute inset-0 flex flex-col items-center justify-center gap-2 py-4"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Target className="w-5 h-5 text-accent" />
                    <p className="text-xs font-semibold text-foreground">Set Goal WPM</p>
                    <Input
                      type="number"
                      min={0}
                      max={300}
                      className="w-20 h-7 text-xs text-center"
                      placeholder="WPM"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        className="h-6 text-xs px-2 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveGoal();
                        }}
                        disabled={savingGoal}
                      >
                        <Check className="w-3 h-3" /> {savingGoal ? "…" : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWpmFlipped(false);
                          setGoalInput(student.goal_wpm != null ? String(student.goal_wpm) : "");
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Remaining metric cards */}
              {heroMetrics.map((m) =>
                <div key={m.label} className="stat-card text-center">
                  <m.icon className={`w-5 h-5 mx-auto mb-1 ${m.color}`} />
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className={`text-2xl font-display font-bold ${m.color}`}>{m.value}</p>
                </div>
              )}
            </div>

            {/* Sanity Check: Raw vs Final Scores (teacher only) */}
            {role === "teacher" && activeSanity && activeSanity.flag === "high_interference" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-xl border border-[hsl(45,93%,47%,0.4)] bg-[hsl(45,93%,47%,0.06)] p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[hsl(45,93%,47%)]" />
                  <h3 className="font-display font-bold text-foreground">Data Review Required</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{activeSanity.reason}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-card border border-border p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Raw Scores</p>
                    <p className="text-sm font-semibold text-foreground">{activeSanity.rawWpm} WPM • {activeSanity.rawAccuracy}% Accuracy</p>
                  </div>
                  <div className="rounded-lg bg-card border border-border p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Sanitized Scores</p>
                    <p className="text-sm font-semibold text-foreground">{activeSanity.wpm} WPM • {activeSanity.accuracy}% Accuracy</p>
                  </div>
                </div>
              </motion.div>
            )}


            {role === "teacher" && (
              <BenchmarkDashboard
                assessments={assessments}
                activeAssessment={activeAssessment}
                goalWPM={student.goal_wpm}
                benchmarkWPM={benchmarkWPM}
              />
            )}

            {/* Quick Feedback — EncouragementEngine */}
            {role === "teacher" && scoredWords.length > 0 && (
              <EncouragementEngine
                assessmentId={activeId}
                studentName={student.name}
                studentId={student.id}
                currentWPM={(activeAssessment as any)?.wpm ?? activeAssessment.fluency_score ?? 0}
                previousWPM={assessments.length > 1 ? ((assessments[1] as any)?.wpm ?? assessments[1]?.fluency_score ?? null) : null}
                accuracy={activeAssessment.accuracy_score ?? 0}
                words={scoredWords}
                savedNote={(activeAssessment as any)?.teacher_encouragement}
              />
            )}

            {/* Word Track — only scored words */}
            {scoredWords.length > 0 && <WordTrackSection activeId={activeId} scoredWords={scoredWords} />}

            {/* Comprehension: Retell Text + Manual Override */}
            {(!!enableRetell || role === "teacher") &&
          <div className="mt-5 rounded-xl bg-card border border-border shadow-sm overflow-hidden">
                <button
                  onClick={() => {
                    const next = !compOpen;
                    setCompOpen(next);
                    localStorage.setItem("lexitrack-comp-open", JSON.stringify(next));
                  }}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[hsl(210,80%,55%)]" />
                    <h3 className="font-display font-bold text-foreground">Comprehension Response</h3>
                    {displayedCompScore != null &&
                <Badge className="ml-2 bg-[hsl(210,80%,55%)] text-white">Score: {displayedCompScore}%</Badge>
                }
                  </div>
                  {compOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {compOpen && (
                  <div className="px-5 pb-5 space-y-5">
                    {!!enableRetell && (
                      <div className="p-4 rounded-lg bg-[hsl(210,80%,55%,0.05)] border border-[hsl(210,80%,55%,0.2)] space-y-3">
                        {retellTranscription ?
                    <p className="text-foreground leading-relaxed">{retellTranscription}</p> :
                    <p className="text-muted-foreground italic">No retell response recorded for this assessment.</p>
                    }
                      </div>
                    )}

                    {/* Substantive Volume Analysis */}
                    {!!enableRetell && retellTranscription && (
                      <RetellSubstantiveVolume transcription={retellTranscription} />
                    )}

                    {/* Manual Score Override */}
                    {activeAssessment &&
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <h3 className="font-display font-bold text-foreground mb-2">Manual Comprehension Score</h3>
                        <div className="flex items-center gap-3">
                          <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-24"
                      placeholder="—"
                      value={manualScoreInput}
                      onChange={(e) => setManualScoreInput(e.target.value)} />
                          <span className="text-sm text-muted-foreground">%</span>
                          <Button size="sm" className="gap-1.5" onClick={handleSaveOverride} disabled={savingOverride}>
                            <Save className="w-3.5 h-3.5" /> {savingOverride ? "Saving..." : "Save"}
                          </Button>
                          {manualCompOverride != null &&
                    <Badge variant="outline" className="text-xs">Currently overridden</Badge>
                    }
                        </div>
                      </div>
                }
                  </div>
                )}
              </div>
          }
          </section>
        }

        {/* ── Sections hidden in Screen Share Mode ── */}
        {!screenShareMode && (
          <>
            {/* ── PROGRESS CHART ── */}
            {assessments.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-3">Progress Over Time</h2>
                <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
                  <ProgressChart
                    assessments={[...assessments].reverse()}
                    benchmarkWPM={benchmarkWPM}
                    goalWPM={student.goal_wpm}
                    goalDate={student.goal_date}
                    showComprehension={!!enableRetell}
                  />
                </div>
              </section>
            )}

            {/* ── ERROR PATTERN INSIGHTS ── */}
            <section className="mb-8">
              <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
                <button
                  onClick={() => {
                    const next = !errorPatternsOpen;
                    setErrorPatternsOpen(next);
                    localStorage.setItem("lexitrack-error-patterns-open", JSON.stringify(next));
                  }}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <h2 className="text-xl font-display font-bold text-foreground">Error Pattern Insights</h2>
                  {errorPatternsOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                {errorPatternsOpen && (
                  <div className="px-5 pb-5">
                    <ErrorPatternInsights studentId={student.id} />
                  </div>
                )}
              </div>
            </section>

            {/* ── HISTORY TABLE ── */}
            {assessments.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-3">Assessment History</h2>
                <AssessmentHistoryTable
                  assessments={assessments}
                  selectedId={activeId}
                  onSelect={setSelectedAssessmentId}
                />
              </section>
            )}

            {/* Vouch History */}
            {role === "teacher" && (
              <section>
                <h2 className="text-xl font-display font-bold text-foreground mb-3">Teacher Override History</h2>
                <VouchHistory studentId={student.id} />
              </section>
            )}
          </>
        )}

        {/* Screen Share Mode indicator */}
        {screenShareMode && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Screen share mode is on — showing only this student's latest results.</p>
          </div>
        )}
      </motion.div>
    </AppLayout>);

};

export default StudentDetail;