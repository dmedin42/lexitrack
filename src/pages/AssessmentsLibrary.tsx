import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, BookOpen, Search, ClipboardList, XCircle, ToggleLeft, ToggleRight, UserCheck, Link2, Check, Timer, CheckCircle2, MapPin, Layers } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { usePassages, useCreatePassage, useUpdatePassage, useDeletePassage, DbPassage } from "@/hooks/usePassages";
import { useClasses, useStudents } from "@/hooks/useStudents";
import { useActiveAssignments, useAssignStudents, useCloseAllAssignments, useToggleAssignment, useRemoveAssignment } from "@/hooks/useActiveAssignments";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingOverlay from "@/components/OnboardingOverlay";

const TIMER_STORAGE_KEY = "lexitrack_recording_seconds";
const WORD_MAP_KEY = "lexitrack_word_map_global";
const DEEP_DIVE_KEY = "lexitrack_deep_dive_global";
const DEFAULT_RECORDING_SECONDS = 60;
const MAX_PASSAGE_WORDS = 350;
const TIMER_EVENT = "lexitrack_timer_changed";

const getBool = (key: string) => { try { const v = localStorage.getItem(key); return v !== null ? v === "true" : false; } catch { return false; } };


const AssessmentsLibrary = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const onboarding = useOnboarding();
  const [activeTab, setActiveTab] = useState("assignments");

  // Global recording timer setting (persisted in localStorage)
  const [recordingSeconds, setRecordingSeconds] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      return raw ? Math.max(10, parseInt(raw, 10)) : DEFAULT_RECORDING_SECONDS;
    } catch { return DEFAULT_RECORDING_SECONDS; }
  });
  const [timerSaved, setTimerSaved] = useState(false);

  // Global visibility toggles (persisted in localStorage)
  const [wordMapGlobal, setWordMapGlobal] = useState<boolean>(() => getBool(WORD_MAP_KEY));
  const [deepDiveGlobal, setDeepDiveGlobal] = useState<boolean>(() => getBool(DEEP_DIVE_KEY));

  const handleSetTimer = () => {
    const clamped = Math.max(10, Math.min(90, recordingSeconds));
    setRecordingSeconds(clamped);
    localStorage.setItem(TIMER_STORAGE_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent(TIMER_EVENT, { detail: clamped }));
    setTimerSaved(true);
    setTimeout(() => setTimerSaved(false), 2000);
  };

  const copyStudentLink = () => {
    const url = `${window.location.origin}/student/${user?.id ?? ""}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const { data: passages, isLoading } = usePassages();
  const { data: classes } = useClasses();
  const createPassage = useCreatePassage();
  const updatePassage = useUpdatePassage();
  const deletePassage = useDeletePassage();
  const assignStudents = useAssignStudents();
  const closeAll = useCloseAllAssignments();
  const toggleAssignment = useToggleAssignment();
  const removeAssignment = useRemoveAssignment();
  const { toast } = useToast();

  // Passage Library state
  const [search, setSearch] = useState("");
  const [editingPassage, setEditingPassage] = useState<DbPassage | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Assignment control state — persist last-used class in localStorage
  const [assignClassId, setAssignClassId] = useState<string>(
    () => localStorage.getItem("lexitrack_last_assign_class") ?? ""
  );
  const [assignPassageId, setAssignPassageId] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const { data: classStudents } = useStudents(assignClassId || undefined);
  const { data: activeAssignments, isLoading: assignmentsLoading } = useActiveAssignments(assignClassId || null);

  // Auto-select first class if none stored; persist changes
  useEffect(() => {
    if (classes && classes.length > 0 && !assignClassId) {
      setAssignClassId(classes[0].id);
    }
  }, [classes]);

  // Onboarding: auto-setup passage creation at step 3
  useEffect(() => {
    if (onboarding.active && onboarding.step === 3 && onboarding.isOnExpectedRoute) {
      setActiveTab("library");
      const timer = setTimeout(() => {
        setEditingPassage(null);
        setFormTitle("My First Passage");
        setFormContent("The quick brown fox jumps over the lazy dog. Reading is the key to a world of adventure.");
        setFormGrade("");
        setDialogOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboarding.active, onboarding.step, onboarding.isOnExpectedRoute]);

  // Onboarding: switch to assignments tab at step 4
  useEffect(() => {
    if (onboarding.active && onboarding.step === 4 && onboarding.isOnExpectedRoute) {
      setActiveTab("assignments");
    }
  }, [onboarding.active, onboarding.step, onboarding.isOnExpectedRoute]);

  const handleSetAssignClass = (id: string) => {
    setAssignClassId(id);
    setSelectedStudentIds(new Set());
    localStorage.setItem("lexitrack_last_assign_class", id);
  };

  // ---- Passage Library handlers ----
  const filtered = (passages ?? []).filter(
    p => p.title.toLowerCase().includes(search.toLowerCase()) ||
         p.content.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingPassage(null);
    setFormTitle("");
    setFormContent("");
    setFormGrade("");
    setDialogOpen(true);
  };

  const openEdit = (p: DbPassage) => {
    setEditingPassage(p);
    setFormTitle(p.title);
    setFormContent(p.content);
    setFormGrade(p.grade_level ?? "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }
    // Hard cap at 350 words — silently truncate and notify teacher
    let finalContent = formContent;
    const words = formContent.trim().split(/\s+/).filter(Boolean);
    if (words.length > MAX_PASSAGE_WORDS) {
      finalContent = words.slice(0, MAX_PASSAGE_WORDS).join(" ");
      toast({
        title: "Passage trimmed",
        description: `Your passage exceeded ${MAX_PASSAGE_WORDS} words and was trimmed to ${MAX_PASSAGE_WORDS}. The extra text was removed from the end.`,
      });
    }
    try {
      if (editingPassage) {
        await updatePassage.mutateAsync({ id: editingPassage.id, title: formTitle, content: finalContent, grade_level: formGrade });
        toast({ title: "Passage updated" });
      } else {
        await createPassage.mutateAsync({ title: formTitle, content: finalContent, grade_level: formGrade });
        toast({ title: "Passage created" });
        if (onboarding.active && onboarding.step === 3) {
          onboarding.nextStep();
        }
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePassage.mutateAsync(id);
      toast({ title: "Passage deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // ---- Assignment handlers ----
  const toggleStudentSelect = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = (classStudents?.length ?? 0) > 0 && selectedStudentIds.size === classStudents?.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(classStudents?.map(s => s.id) ?? []));
    }
  };

  const handleWordMapToggle = async (val: boolean) => {
    setWordMapGlobal(val);
    localStorage.setItem(WORD_MAP_KEY, String(val));
    if (activeAssignments?.length) {
      await Promise.all(
        activeAssignments.map(a => toggleAssignment.mutateAsync({ assignmentId: a.id, updates: { word_map_enabled: val } }))
      ).catch(() => {});
    }
  };

  const handleDeepDiveToggle = async (val: boolean) => {
    setDeepDiveGlobal(val);
    localStorage.setItem(DEEP_DIVE_KEY, String(val));
    if (activeAssignments?.length) {
      await Promise.all(
        activeAssignments.map(a => toggleAssignment.mutateAsync({ assignmentId: a.id, updates: { deep_dive_enabled: val } }))
      ).catch(() => {});
    }
  };

  const handleAssign = async () => {
    if (!assignPassageId || selectedStudentIds.size === 0) {
      toast({ title: "Select a passage and at least one student", variant: "destructive" });
      return;
    }
    if (assignPassageId.startsWith("demo-")) {
      toast({
        title: "Demo passage",
        description: "This is a sample passage. Please add a real passage in the Passage Library first.",
        variant: "destructive",
      });
      return;
    }
    try {
      await assignStudents.mutateAsync({
        studentIds: Array.from(selectedStudentIds),
        passageId: assignPassageId,
        assignedBy: user!.id,
        wordMapEnabled: wordMapGlobal,
        deepDiveEnabled: deepDiveGlobal,
      });
      toast({ title: `Assigned to ${selectedStudentIds.size} student(s)!` });
      setSelectedStudentIds(new Set());
      if (onboarding.active && onboarding.step === 4) {
        onboarding.nextStep();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCloseAll = async () => {
    if (!assignClassId) return;
    try {
      await closeAll.mutateAsync(assignClassId);
      toast({ title: "All assessments closed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggle = async (assignmentId: string, field: "is_open" | "word_map_enabled" | "deep_dive_enabled", value: boolean) => {
    try {
      await toggleAssignment.mutateAsync({ assignmentId, updates: { [field]: value } });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await removeAssignment.mutateAsync(studentId);
      toast({ title: "Assignment removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Map existing assignments by student_id for quick lookup
  const assignmentByStudentId = new Map(
    (activeAssignments ?? []).map(a => [a.student_id, a])
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">Assessments</h1>
            <p className="text-muted-foreground mt-1">Manage reading passages and student assignments</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyStudentLink} className="gap-2" data-onboarding="student-link-copy">
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Student Link"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="w-4 h-4" /> Passage Library
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="w-4 h-4" /> Assignments
            </TabsTrigger>
          </TabsList>

          {/* ===== PASSAGE LIBRARY TAB ===== */}
          <TabsContent value="library">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search passages..."
                  className="pl-10"
                />
              </div>
              <Button onClick={openCreate} className="gap-2" data-onboarding="create-passage">
                <Plus className="w-4 h-4" /> Add Passage
              </Button>
            </div>

            {isLoading ? (
              <div className="text-muted-foreground animate-pulse py-10 text-center">Loading passages...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  {search ? "No passages match your search." : "No passages yet. Add one to get started!"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(p => (
                  <div key={p.id} className="rounded-xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-display font-bold text-foreground text-lg leading-tight">{p.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{p.content}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{p.word_count} words</span>
                      {p.grade_level && <span className="bg-secondary px-2 py-0.5 rounded-full">{p.grade_level}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ===== ASSIGNMENTS TAB ===== */}
          <TabsContent value="assignments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left: Assign new */}
              <div className="space-y-5">
                <h2 className="text-lg font-display font-bold text-foreground">Assign a Reading</h2>

                {/* Passage selector */}
                <div>
                  <Label>Passage</Label>
                  <Select value={assignPassageId} onValueChange={setAssignPassageId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a passage" />
                    </SelectTrigger>
                    <SelectContent>
                      {(passages ?? []).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Student selector */}
                {assignClassId && classStudents && classStudents.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Students</Label>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {/* Select all */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={toggleSelectAll}
                      >
                        <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                        <span className="text-sm font-semibold text-foreground">Select All</span>
                        <span className="ml-auto text-xs text-muted-foreground">{selectedStudentIds.size} selected</span>
                      </div>
                      {/* Individual students */}
                      <div className="divide-y divide-border max-h-64 overflow-y-auto">
                        {(classStudents as any[]).map((s: any) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
                            onClick={() => toggleStudentSelect(s.id)}
                          >
                            <Checkbox
                              checked={selectedStudentIds.has(s.id)}
                              onCheckedChange={() => toggleStudentSelect(s.id)}
                            />
                            <span className="text-lg">{s.avatar}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{s.name}</p>
                              {s.username && (
                                <p className="text-xs text-muted-foreground">@{s.username}</p>
                              )}
                            </div>
                            {assignmentByStudentId.has(s.id) && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">assigned</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {assignClassId && classStudents?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No students in this class yet.</p>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={handleAssign}
                    disabled={!assignPassageId || selectedStudentIds.size === 0 || assignStudents.isPending}
                    className="gap-2"
                    data-onboarding="assign-button"
                  >
                    <UserCheck className="w-4 h-4" />
                    Assign to {selectedStudentIds.size > 0 ? `${selectedStudentIds.size} Student${selectedStudentIds.size > 1 ? "s" : ""}` : "Students"}
                  </Button>
                  {assignClassId && (
                    <Button
                      variant="outline"
                      onClick={handleCloseAll}
                      disabled={closeAll.isPending}
                      className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <XCircle className="w-4 h-4" /> Close All Assessments
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Active assignments list */}
              <div className="space-y-4">
                <h2 className="text-lg font-display font-bold text-foreground">Active Assignments</h2>

                {!assignClassId && (
                  <p className="text-sm text-muted-foreground">Select a class to view assignments.</p>
                )}

                {assignClassId && assignmentsLoading && (
                  <div className="text-muted-foreground animate-pulse text-sm">Loading...</div>
                )}

                {assignClassId && !assignmentsLoading && (activeAssignments ?? []).length === 0 && (
                  <div className="text-center py-10 rounded-xl border border-dashed border-border">
                    <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No assignments yet for this class.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {(activeAssignments ?? []).map(a => (
                    <div key={a.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                      {/* Student + passage */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{a.student_avatar}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{a.student_name}</p>
                            <p className="text-xs text-muted-foreground truncate">📖 {a.passage_title}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleRemove(a.student_id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-2 border-t border-border pt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Assessment open</span>
                          <Switch
                            checked={a.is_open}
                            onCheckedChange={v => handleToggle(a.id, "is_open", v)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPassage ? "Edit Passage" : "Add New Passage"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Title</Label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="The Cat on the Mat" />
              </div>
              <div>
                <Label>Grade Level (optional)</Label>
                <Input value={formGrade} onChange={e => setFormGrade(e.target.value)} placeholder="2nd" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="The little cat sat on the warm mat..."
                  className="min-h-[150px]"
                />
                {formContent && (() => {
                  const wc = formContent.trim().split(/\s+/).filter(Boolean).length;
                  const over = wc > MAX_PASSAGE_WORDS;
                  return (
                    <p className={`text-xs mt-1 ${over ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {wc} / {MAX_PASSAGE_WORDS} words{over ? ` — will be trimmed to ${MAX_PASSAGE_WORDS}` : ""}
                    </p>
                  );
                })()}
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave} disabled={createPassage.isPending || updatePassage.isPending} data-onboarding="save-passage">
                  {editingPassage ? "Save Changes" : "Create Passage"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
      </motion.div>
    </AppLayout>
  );
};

export default AssessmentsLibrary;
