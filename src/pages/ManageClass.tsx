import { useState, useEffect, useRef, useCallback } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  Shield,
  Timer,
  CheckCircle2,
  Target,
  BookOpen,
  MessageCircleQuestion,
  Phone,
  ChevronDown,
  RotateCcw } from
"lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import GradingStrictnessSlider from "@/components/GradingStrictnessSlider";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useClasses, useStudents, DbClass } from "@/hooks/useStudents";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import BulkAddStudents from "@/components/BulkAddStudents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger } from
"@/components/ui/alert-dialog";
import { DEFAULT_GRADING_STRICTNESS } from "@/lib/grading";

interface StudentEditState {
  name: string;
  username: string;
  student_password: string;
}


const ManageClass = () => {
  const { user } = useAuth();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { data: students } = useStudents(selectedClassId ?? undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const onboarding = useOnboarding();

  // New class form — auto-show during onboarding if no classes exist
  const [showNewClass, setShowNewClass] = useState(false);
  const [className, setClassName] = useState("");
  const [classGrade, setClassGrade] = useState("");
  const [classBenchmark, setClassBenchmark] = useState("80");

  // Bulk student form
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  // Class preferences open state (controlled for onboarding step 6)
  const [prefsOpen, setPrefsOpen] = useState(false);

  // Inline edit state per student
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editState, setEditState] = useState<StudentEditState>({ name: "", username: "", student_password: "" });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Auto-open class creation form when arriving during onboarding with no classes
  useEffect(() => {
    if (onboarding.active && onboarding.step === 1 && !classesLoading && classes && classes.length === 0) {
      setShowNewClass(true);
    }
  }, [onboarding.active, onboarding.step, classesLoading, classes]);

  // Auto-open bulk add form when arriving during onboarding step 1 AND a class exists
  useEffect(() => {
    if (onboarding.active && onboarding.step === 1 && onboarding.isOnExpectedRoute && classes && classes.length > 0 && !showBulkAdd) {
      const timer = setTimeout(() => setShowBulkAdd(true), 400);
      return () => clearTimeout(timer);
    }
  }, [onboarding.active, onboarding.step, onboarding.isOnExpectedRoute, classes]);

  // Auto-edit first student when arriving at onboarding step 2
  useEffect(() => {
    if (onboarding.active && onboarding.step === 2 && students && students.length > 0 && !editingStudentId) {
      const s = students[0] as any;
      setEditingStudentId(s.id);
      setEditState({
        name: s.name ?? "",
        username: s.username ?? "",
        student_password: s.student_password ?? ""
      });
    }
  }, [onboarding.active, onboarding.step, students, editingStudentId]);

  // Auto-open class preferences when arriving at onboarding step 6
  useEffect(() => {
    if (onboarding.active && onboarding.step === 6 && onboarding.isOnExpectedRoute) {
      setPrefsOpen(true);
    }
  }, [onboarding.active, onboarding.step, onboarding.isOnExpectedRoute]);

  // All student-facing settings are DB-driven (classes table)
  const [showWpmToStudents, setShowWpmToStudents] = useState(false);
  const [showAccuracyToStudents, setShowAccuracyToStudents] = useState(false);
  const [wordMapGlobal, setWordMapGlobal] = useState(false);
  const [deepDiveGlobal, setDeepDiveGlobal] = useState(false);
  const [allowSecondAttempt, setAllowSecondAttempt] = useState(false);

  // Database-driven timer settings
  const [showTimerToStudent, setShowTimerToStudent] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(60);
  const timerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerDebounced = useCallback((val: number, classId: string) => {
    if (timerTimerRef.current) clearTimeout(timerTimerRef.current);
    timerTimerRef.current = setTimeout(async () => {
      await (supabase as any).from("classes").update({ default_time_limit: val }).eq("id", classId);
    }, 400);
  }, []);

  // Grading strictness (1.0-10.0 scale, maps to Azure's 1-100)
  const [gradingStrictness, setGradingStrictness] = useState(DEFAULT_GRADING_STRICTNESS);
  const strictnessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStrictnessDebounced = useCallback((val: number, classId: string) => {
    if (strictnessTimerRef.current) clearTimeout(strictnessTimerRef.current);
    strictnessTimerRef.current = setTimeout(async () => {
      await (supabase as any).from("classes").update({ grading_strictness: val }).eq("id", classId);
    }, 400);
  }, []);

  // Comprehension toggle
  const [enableRetell, setEnableRetell] = useState(false);
  const [showRetellTranscript, setShowRetellTranscript] = useState(false);

  // Comprehension scoring weights
  const [compWeightWordCount, setCompWeightWordCount] = useState(33);
  const [compWeightAlignment, setCompWeightAlignment] = useState(33);
  const [compWeightDetail, setCompWeightDetail] = useState(34);
  const [compWeightsSaved, setCompWeightsSaved] = useState(false);

  // Load class settings from Supabase when class is selected
  useEffect(() => {
    if (!selectedClassId) return;
    const loadClassSettings = async () => {
      const { data } = await (supabase as any)
        .from("classes")
        .select(
          "default_time_limit, show_timer_to_student, grading_strictness, comp_weight_word_count, comp_weight_alignment, comp_weight_detail, enable_retell, word_map_enabled, deep_dive_enabled, show_wpm_to_student, show_accuracy_to_student, allow_second_attempt, show_retell_transcript"
        )
        .eq("id", selectedClassId)
        .single();
      if (data) {
        setRecordingSeconds(data.default_time_limit ?? 60);
        setShowTimerToStudent(data.show_timer_to_student ?? false);
        setGradingStrictness(data.grading_strictness ?? DEFAULT_GRADING_STRICTNESS);
        setCompWeightWordCount(data.comp_weight_word_count ?? 33);
        setCompWeightAlignment(data.comp_weight_alignment ?? 33);
        setCompWeightDetail(data.comp_weight_detail ?? 34);
        setEnableRetell(data.enable_retell ?? false);
        setWordMapGlobal(data.word_map_enabled ?? false);
        setDeepDiveGlobal(data.deep_dive_enabled ?? false);
        setShowWpmToStudents(data.show_wpm_to_student ?? false);
        setShowAccuracyToStudents(data.show_accuracy_to_student ?? false);
        setAllowSecondAttempt(data.allow_second_attempt ?? false);
        setShowRetellTranscript(data.show_retell_transcript ?? false);
      }
    };
    loadClassSettings();
  }, [selectedClassId]);

  const toggleShowWpm = async (checked: boolean) => {
    setShowWpmToStudents(checked);
    if (!selectedClassId) return;
    await (supabase as any).from("classes").update({ show_wpm_to_student: checked }).eq("id", selectedClassId);
  };
  const toggleShowAccuracy = async (checked: boolean) => {
    setShowAccuracyToStudents(checked);
    if (!selectedClassId) return;
    await (supabase as any).from("classes").update({ show_accuracy_to_student: checked }).eq("id", selectedClassId);
  };
  const handleWordMapToggle = async (val: boolean) => {
    setWordMapGlobal(val);
    if (!selectedClassId) return;
    await (supabase as any).from("classes").update({ word_map_enabled: val }).eq("id", selectedClassId);
  };
  const handleDeepDiveToggle = async (val: boolean) => {
    setDeepDiveGlobal(val);
    if (!selectedClassId) return;
    await (supabase as any).from("classes").update({ deep_dive_enabled: val }).eq("id", selectedClassId);
  };
  const toggleAllowSecondAttempt = async (checked: boolean) => {
    setAllowSecondAttempt(checked);
    if (!selectedClassId) return;
    await (supabase as any).from("classes").update({ allow_second_attempt: checked }).eq("id", selectedClassId);
  };

  // Save timer to Supabase
  const toggleShowTimer = async (checked: boolean) => {
    setShowTimerToStudent(checked);
    if (!selectedClassId) return;
    await (supabase as any).from("classes").update({ show_timer_to_student: checked }).eq("id", selectedClassId);
  };


  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  // Auto-select first class
  useEffect(() => {
    if (classes && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const createClass = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("classes").insert({
        teacher_id: user!.id,
        name: className,
        grade: classGrade,
        benchmark_wpm: parseInt(classBenchmark)
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Class created!" });
      setShowNewClass(false);
      setClassName("");
      setClassGrade("");
      setClassBenchmark("80");
      // Immediately select the new class so the student UI renders
      if (data?.id) {
        setSelectedClassId(data.id);
      }
      // During onboarding, auto-open the student entry form after class creation
      if (onboarding.active && onboarding.step === 1) {
        setTimeout(() => setShowBulkAdd(true), 600);
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  });


  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", selectedClassId] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast({ title: "Student removed" });
    }
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, updates }: {id: string;updates: StudentEditState;}) => {
      const { error } = await (supabase as any).
      from("students").
      update({
        name: updates.name,
        username: updates.username || null,
        student_password: updates.student_password || null
      }).
      eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", selectedClassId] });
      toast({ title: "Student updated!" });
      setEditingStudentId(null);
      // During onboarding step 2, advance to assessments
      if (onboarding.active && onboarding.step === 2) {
        onboarding.nextStep();
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  });

  const deleteClass = useMutation({
    mutationFn: async (classId: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
    },
    onSuccess: (_data, classId) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      setSelectedClassId(null);
      toast({ title: "Class deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
  });

  const updateBenchmark = useMutation({
    mutationFn: async ({ classId, benchmark }: {classId: string;benchmark: number;}) => {
      const { error } = await supabase.from("classes").update({ benchmark_wpm: benchmark }).eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast({ title: "Benchmark updated!" });
    }
  });

  const openEdit = (s: any) => {
    setEditingStudentId(s.id);
    setEditState({
      name: s.name ?? "",
      username: s.username ?? "",
      student_password: s.student_password ?? ""
    });
  };


  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">Manage Class</h1>
            <p className="text-muted-foreground mt-1">Create classes, add students, and set up student logins</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageCircleQuestion className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback/ Support</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2 cursor-default focus:bg-transparent">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm">Text David M (Founder): (385) 230-7071</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>



        {/* New class form */}
        {showNewClass &&
        <div className="p-5 rounded-xl bg-card border border-border shadow-card mb-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Class Name</Label>
                <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Mrs. Thompson's Class" />

              </div>
              <div>
                <Label>Grade</Label>
                <Input value={classGrade} onChange={(e) => setClassGrade(e.target.value)} placeholder="2nd" />
              </div>
              <div>
                <Label>Benchmark WPM</Label>
                <Input type="number" value={classBenchmark} onChange={(e) => setClassBenchmark(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createClass.mutate()} disabled={!className || !classGrade}>
                Create Class
              </Button>
              <Button variant="ghost" onClick={() => setShowNewClass(false)}>
                Cancel
              </Button>
            </div>
          </div>
        }

        {/* Class Preferences */}
        {selectedClass &&
        <Collapsible open={prefsOpen} onOpenChange={setPrefsOpen} className="p-5 rounded-xl bg-card border border-border shadow-card mb-6">
            <CollapsibleTrigger className="flex items-center justify-between w-full group" data-onboarding="class-preferences">
              <h2 className="text-lg font-display font-bold text-foreground">Class Preferences</h2>
              <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 mt-5">

            {/* Benchmark WPM */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Benchmark WPM:</span>
              <Input
              type="number"
              className="w-24"
              defaultValue={selectedClass.benchmark_wpm}
              onBlur={(e) => {
                const val = parseInt(e.target.value);
                if (val && val !== selectedClass.benchmark_wpm) {
                  updateBenchmark.mutate({ classId: selectedClass.id, benchmark: val });
                }
              }} />


              <span className="text-sm text-muted-foreground">WPM</span>
            </div>

            {/* Default Assessment Time Limit */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Default Assessment Time Limit</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                How long each student has to read aloud before auto-stop.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                type="number"
                className="w-24"
                min={10}
                max={90}
                value={recordingSeconds}
                onChange={(e) => {
                  const clamped = Math.max(10, Math.min(90, Number(e.target.value)));
                  setRecordingSeconds(clamped);
                  if (selectedClassId) saveTimerDebounced(clamped, selectedClassId);
                }} />

                <span className="text-sm text-muted-foreground">
                  seconds ({Math.floor(recordingSeconds / 60)}m {recordingSeconds % 60}s)
                </span>
              </div>
            </div>

            {/* Student Results Visibility */}
            <div className="space-y-3 border-t border-border pt-4">
              <span className="text-sm font-medium text-foreground">Student Results Visibility</span>
              <p className="text-xs text-muted-foreground">Controls what students see after their assessment.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref-wpm" className="text-sm text-muted-foreground cursor-pointer">
                    Show WPM
                  </Label>
                  <Switch id="pref-wpm" checked={showWpmToStudents} onCheckedChange={toggleShowWpm} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref-accuracy" className="text-sm text-muted-foreground cursor-pointer">
                    Show Accuracy
                  </Label>
                  <Switch id="pref-accuracy" checked={showAccuracyToStudents} onCheckedChange={toggleShowAccuracy} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref-wordmap" className="text-sm text-muted-foreground cursor-pointer">
                    Word Map
                  </Label>
                  <Switch id="pref-wordmap" checked={wordMapGlobal} onCheckedChange={handleWordMapToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pref-deepdive" className="text-sm text-muted-foreground cursor-pointer">
                    Deep Dive
                  </Label>
                  <Switch id="pref-deepdive" checked={deepDiveGlobal} onCheckedChange={handleDeepDiveToggle} />
                </div>
              </div>
            </div>

            {/* Show Countdown Timer */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <span className="text-sm font-medium text-foreground">Show Countdown Timer</span>
                <p className="text-xs text-muted-foreground">
                  If off, the timer is invisible to the student during assessment (recording still auto-stops).
                </p>
              </div>
              <Switch id="pref-timer" checked={showTimerToStudent} onCheckedChange={toggleShowTimer} />
            </div>

            {/* Allow Second Attempt */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Allow Second Attempt</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Students can re-record their reading once before submitting. Default: off.
                </p>
              </div>
              <Switch id="pref-second-attempt" checked={allowSecondAttempt} onCheckedChange={toggleAllowSecondAttempt} />
            </div>

            {/* Grading Strictness */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Grading Strictness</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">Adjust how strictly the AI grades pronunciation.</p>
              <GradingStrictnessSlider
                value={gradingStrictness}
                onChange={(val) => {
                  setGradingStrictness(val);
                  if (selectedClassId) saveStrictnessDebounced(val, selectedClassId);
                }}
                className="flex-1"
              />
            </div>

            {/* Comprehension / Retell Toggle */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Comprehension Scoring (Retell)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  After reading, students retell the story in their own words for comprehension scoring.
                </p>
              </div>
              <Switch
              id="pref-retell"
              checked={enableRetell}
              onCheckedChange={async (checked) => {
                setEnableRetell(checked);
                if (!selectedClassId) return;
                await (supabase as any).from("classes").update({ enable_retell: checked }).eq("id", selectedClassId);
              }} />

            </div>

            {/* Show Retell Transcript to Students — only when retell is enabled */}
            {enableRetell && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="text-sm font-medium text-foreground">Show Retell Transcript to Students</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    If on, students see their retell transcription after completing the assessment.
                  </p>
                </div>
                <Switch
                  id="pref-retell-transcript"
                  checked={showRetellTranscript}
                  onCheckedChange={async (checked) => {
                    setShowRetellTranscript(checked);
                    if (!selectedClassId) return;
                    await (supabase as any).from("classes").update({ show_retell_transcript: checked }).eq("id", selectedClassId);
                  }}
                />
              </div>
            )}

            {/* Comprehension Scoring Weights — only when retell is enabled */}
            {enableRetell &&
          <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Comprehension Scoring Weights (Beta)</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Set how retell comprehension is scored. Must total 100%.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Word Count</Label>
                    <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compWeightWordCount}
                  onChange={(e) => setCompWeightWordCount(Math.max(0, Math.min(100, Number(e.target.value))))} />

                  </div>
                  <div>
                    <Label className="text-xs">Story Alignment</Label>
                    <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compWeightAlignment}
                  onChange={(e) => setCompWeightAlignment(Math.max(0, Math.min(100, Number(e.target.value))))} />

                  </div>
                  <div>
                    <Label className="text-xs">Key Details</Label>
                    <Input
                  type="number"
                  min={0}
                  max={100}
                  value={compWeightDetail}
                  onChange={(e) => setCompWeightDetail(Math.max(0, Math.min(100, Number(e.target.value))))} />

                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span
                className={`text-xs font-medium ${compWeightWordCount + compWeightAlignment + compWeightDetail === 100 ? "text-primary" : "text-destructive"}`}>

                    Total: {compWeightWordCount + compWeightAlignment + compWeightDetail}%
                    {compWeightWordCount + compWeightAlignment + compWeightDetail !== 100 && " — must equal 100%"}
                  </span>
                  <Button
                size="sm"
                className="gap-1.5"
                disabled={compWeightWordCount + compWeightAlignment + compWeightDetail !== 100}
                onClick={async () => {
                  if (!selectedClassId) return;
                  const { error } = await (supabase as any).
                  from("classes").
                  update({
                    comp_weight_word_count: compWeightWordCount,
                    comp_weight_alignment: compWeightAlignment,
                    comp_weight_detail: compWeightDetail
                  }).
                  eq("id", selectedClassId);
                  if (!error) {
                    setCompWeightsSaved(true);
                    setTimeout(() => setCompWeightsSaved(false), 2000);
                  } else {
                    toast({ title: "Error saving weights", description: error.message, variant: "destructive" });
                  }
                }}>

                    {compWeightsSaved ?
                <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                      </> :

                "Save Weights"
                }
                  </Button>
                </div>
              </div>
          }

            {/* Reset to Defaults */}
            <div className="border-t border-border pt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={async () => {
                  if (!selectedClassId) return;
                  const defaults = {
                    default_time_limit: 60,
                    show_timer_to_student: false,
                    grading_strictness: DEFAULT_GRADING_STRICTNESS,
                    enable_retell: false,
                    show_retell_transcript: false,
                    word_map_enabled: false,
                    deep_dive_enabled: false,
                    show_wpm_to_student: false,
                    show_accuracy_to_student: false,
                    allow_second_attempt: false,
                    comp_weight_word_count: 33,
                    comp_weight_alignment: 33,
                    comp_weight_detail: 34,
                  };
                  await (supabase as any).from("classes").update(defaults).eq("id", selectedClassId);
                  setRecordingSeconds(60);
                  setShowTimerToStudent(false);
                  setGradingStrictness(DEFAULT_GRADING_STRICTNESS);
                  setEnableRetell(false);
                  setShowRetellTranscript(false);
                  setWordMapGlobal(false);
                  setDeepDiveGlobal(false);
                  setShowWpmToStudents(false);
                  setShowAccuracyToStudents(false);
                  setAllowSecondAttempt(false);
                  setCompWeightWordCount(33);
                  setCompWeightAlignment(33);
                  setCompWeightDetail(34);
                  toast({ title: "Preferences reset to defaults" });
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
              </Button>
            </div>
            </CollapsibleContent>
          </Collapsible>
        }

        {/* Students list */}
        {selectedClassId &&
        <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-foreground">Students</h2>
              <Button
              size="sm"
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="gap-1.5"
              data-onboarding="add-students">
                <Plus className="w-3.5 h-3.5" /> Add Students
              </Button>
            </div>

            {showBulkAdd && (
              <BulkAddStudents
                classId={selectedClassId!}
                classGrade={selectedClass?.grade ?? ""}
                existingNames={(students ?? []).map((s: any) => s.name)}
                onClose={() => setShowBulkAdd(false)}
                onStudentsAdded={() => {
                  if (onboarding.active && onboarding.step === 1) {
                    onboarding.nextStep();
                  }
                }}
              />
            )}

            {/* Column headers */}
            {students && students.length > 0 &&
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-3 px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span></span>
                <span>Full Name</span>
                <span>Username</span>
                <span>Password</span>
                <span></span>
              </div>
          }

            <div className="space-y-2">
              {(students as any[])?.map((s: any) =>
            <div key={s.id} className="rounded-xl bg-card border border-border overflow-hidden">
                  {editingStudentId === s.id ? (
              /* Edit mode */
              <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{s.avatar}</span>
                        <span className="text-sm font-semibold text-muted-foreground">Editing student login info</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Full Name</Label>
                          <Input
                      value={editState.name}
                      onChange={(e) => setEditState((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full name" />

                        </div>
                        <div>
                          <Label className="text-xs">Username (for student login)</Label>
                          <Input
                      value={editState.username}
                      onChange={(e) => setEditState((p) => ({ ...p, username: e.target.value }))}
                      placeholder="emma_r" />

                        </div>
                        <div>
                          <Label className="text-xs">Password</Label>
                          <Input
                      value={editState.student_password}
                      onChange={(e) => setEditState((p) => ({ ...p, student_password: e.target.value }))}
                      placeholder="sun123" />

                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                    size="sm"
                    onClick={() => updateStudent.mutate({ id: s.id, updates: editState })}
                    disabled={!editState.name || updateStudent.isPending}
                    className="gap-1.5"
                    data-onboarding="save-student">

                          <Save className="w-3.5 h-3.5" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingStudentId(null)} className="gap-1.5">
                          <X className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      </div>
                    </div>) : (

              /* View mode */
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-3 p-3">
                      <span className="text-xl">{s.avatar}</span>
                      <div>
                        <p className="font-medium text-foreground text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.grade}</p>
                      </div>
                      <div>
                        {s.username ?
                  <span className="text-sm font-mono text-foreground bg-secondary px-2 py-0.5 rounded">
                            @{s.username}
                          </span> :

                  <span className="text-xs text-muted-foreground italic">not set</span>
                  }
                      </div>
                      <div className="flex items-center gap-1">
                        {s.student_password ?
                  <>
                            <span className="text-sm font-mono text-foreground">
                              {showPasswords[s.id] ? s.student_password : "••••••"}
                            </span>
                            <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPasswords((p) => ({ ...p, [s.id]: !p[s.id] }))}>

                              {showPasswords[s.id] ?
                      <EyeOff className="w-3.5 h-3.5" /> :

                      <Eye className="w-3.5 h-3.5" />
                      }
                            </button>
                          </> :

                  <span className="text-xs text-muted-foreground italic">not set</span>
                  }
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-8 w-8 p-0">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (confirm(`Remove ${s.name}?`)) deleteStudent.mutate(s.id);
                    }}>

                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>)
              }
                </div>
            )}
              {students?.length === 0 &&
            <p className="text-sm text-muted-foreground text-center py-8">
                  No students yet. Add a student to get started.
                </p>
            }
            </div>
          </div>
        }

        {!selectedClassId && !classesLoading && (!classes || classes.length === 0) &&
        <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">Create your first class to get started.</p>
            {!showNewClass &&
          <Button onClick={() => setShowNewClass(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> New Class
              </Button>
          }
          </div>
        }

        {/* ───── Data Management (FERPA Compliance) ───── */}
        {selectedClassId &&
        <Collapsible defaultOpen={false} className="mt-10 p-6 rounded-xl bg-card border border-border shadow-card">
            <CollapsibleTrigger className="flex items-center justify-between w-full group">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">Data Management</h2>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              FERPA grants you the right to review and request deletion of student education records. Use the tools
              below to exercise those rights.
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Download CSV */}
              <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                try {
                  if (!students || students.length === 0) {
                    toast({ title: "No data", description: "There are no students to export." });
                    return;
                  }

                  // Fetch assessments for all students in this class
                  const studentIds = students.map((s: any) => s.id);
                  const { data: assessments } = await supabase.
                  from("assessments").
                  select("student_id, passage_title, fluency_score, accuracy_score, date, duration_seconds").
                  in("student_id", studentIds).
                  order("date", { ascending: false });

                  const rows = (assessments ?? []).map((a: any) => {
                    const student = students.find((s: any) => s.id === a.student_id);
                    return [
                    `"${student?.name ?? "Unknown"}"`,
                    `"${(student as any)?.grade ?? ""}"`,
                    `"${a.passage_title ?? ""}"`,
                    a.fluency_score ?? "",
                    a.accuracy_score ?? "",
                    a.date ?? "",
                    a.duration_seconds ?? ""].
                    join(",");
                  });

                  const csv = ["Student Name,Grade,Passage,WPM,Accuracy (%),Date,Duration (s)", ...rows].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `lexitrack-${selectedClass?.name ?? "class"}-data.csv`;
                  link.click();
                  URL.revokeObjectURL(url);

                  toast({ title: "Download started", description: "Your CSV file is downloading." });
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                }
              }}>

                <Download className="w-3.5 h-3.5" /> Download My Data (CSV)
              </Button>

              {/* Delete All Student Data */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Delete All Student Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      Permanently Delete All Student Data?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block font-semibold text-destructive">This action cannot be undone.</span>
                      <span className="block">
                        This will permanently delete <strong>all students</strong>, their{" "}
                        <strong>assessment records</strong>, <strong>word-level data</strong>, and{" "}
                        <strong>audio recordings</strong> associated with the class "{selectedClass?.name}".
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      try {
                        if (!students || students.length === 0) {
                          toast({ title: "No data to delete" });
                          return;
                        }
                        const studentIds = students.map((s: any) => s.id);

                        // Delete in dependency order: phoneme_details → word_assessments → assessments → students
                        const { data: assessmentRows } = await (supabase as any).
                        from("assessments").
                        select("id").
                        in("student_id", studentIds);
                        const assessmentIds = (assessmentRows ?? []).map((a: any) => a.id);

                        if (assessmentIds.length > 0) {
                          await (supabase as any).from("phoneme_details").delete().in("assessment_id", assessmentIds);
                          await (supabase as any).
                          from("word_assessments").
                          delete().
                          in("assessment_id", assessmentIds);
                          await (supabase as any).from("assessments").delete().in("student_id", studentIds);
                        }

                        await (supabase as any).from("cluster_students").delete().in("student_id", studentIds);
                        await (supabase as any).from("caregiver_students").delete().in("student_id", studentIds);
                        await (supabase as any).from("students").delete().in("id", studentIds);

                        queryClient.invalidateQueries({ queryKey: ["students", selectedClassId] });
                        queryClient.invalidateQueries({ queryKey: ["class-stats"] });
                        toast({
                          title: "All student data deleted",
                          description: "Records have been permanently removed."
                        });
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}>

                      Yes, Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            </CollapsibleContent>
          </Collapsible>
        }

      </motion.div>

      <OnboardingOverlay
        active={onboarding.active}
        step={onboarding.step}
        totalSteps={onboarding.totalSteps}
        isOnExpectedRoute={onboarding.isOnExpectedRoute}
        onNext={onboarding.nextStep}
        onSkip={onboarding.skipOnboarding}
        onGoToStep={onboarding.goToCurrentStep}
        showPrivacyFact={onboarding.showPrivacyFact}
      />
    </AppLayout>);

};

export default ManageClass;