import { useState } from "react";
import { motion } from "framer-motion";
import { Star, BookOpen, Heart, FileText, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import AppLayout from "@/components/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { demoStudents, demoAssessments, demoWordAssessments } from "@/data/demoData";

const generateParentInfoSheet = () => {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>LexiTrack — Parent Information</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 48px 32px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 6px; color: #333; }
  p, li { font-size: 13px; color: #444; }
  ul { padding-left: 20px; margin-top: 4px; }
  .subtitle { font-size: 13px; color: #888; margin-bottom: 28px; }
  .section { border-top: 1px solid #e5e5e5; padding-top: 16px; }
  .callout { background: #f8f8f8; border-radius: 8px; padding: 14px 16px; margin-top: 12px; font-size: 13px; }
  .footer { margin-top: 36px; border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 12px; color: #999; text-align: center; }
  @media print { body { padding: 24px; } }
</style></head><body>
<h1>About LexiTrack — Information for Parents/Guardians</h1>
<p class="subtitle">Provided by your child's teacher</p>

<div class="section">
<h2>What is LexiTrack?</h2>
<p>LexiTrack is a classroom reading fluency assessment tool used by your child's teacher. It listens to your child read a short passage aloud and measures reading speed (words per minute) and accuracy to help identify areas for practice.</p>
</div>

<div class="section">
<h2>What data is collected?</h2>
<ul>
<li>A <strong>pseudonymous student ID</strong> assigned by the app (no real names, emails, home addresses, or contact information are collected)</li>
<li>A short <strong>audio recording</strong> of your child reading a passage</li>
<li>Assessment results: <strong>words per minute and word-level accuracy</strong></li>
</ul>
</div>

<div class="section">
<h2>How is the audio used?</h2>
<p>Audio recordings are processed by Microsoft Azure Speech-to-Text solely to measure reading accuracy. Recordings are <strong>not stored long-term</strong> and are <strong>never used to train public AI models</strong>.</p>
</div>

<div class="section">
<h2>Who can see my child's data?</h2>
<p>Only the assigned classroom teacher and any caregivers the teacher has explicitly authorized. LexiTrack does not sell or share student data with third parties.</p>
</div>

<div class="section">
<h2>Data Security</h2>
<div class="callout">
All data is encrypted using AES-256 encryption, stored on US-based servers, and hosted on SOC 2 compliant infrastructure. LexiTrack complies with FERPA and COPPA regulations.
</div>
</div>

<div class="section">
<h2>Questions?</h2>
<p>For questions about how LexiTrack is used in your child's classroom, please contact your child's teacher directly.</p>
</div>

<div class="footer">LexiTrack — Built for educators, by educators. &copy; ${new Date().getFullYear()}</div>
</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 300);
};

const ParentReport = () => {
  const { user, role } = useAuth();
  const { isDemo } = useDemo();
  const [searchParams] = useSearchParams();
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get("student") ?? "");

  const { data: students } = useQuery({
    queryKey: ["parent-students", user?.id, role, isDemo],
    queryFn: async () => {
      if (isDemo) {
        return demoStudents.map(s => ({ id: s.id, name: s.name, username: (s as any).username ?? s.name, grade: s.grade }));
      }
      if (!user) return [];

      if (role === "caregiver") {
        // Caregivers see their linked students
        const { data, error } = await supabase
          .from("caregiver_students")
          .select("student_id, students(id, name, username, grade)")
          .eq("caregiver_id", user.id);
        if (error) throw error;
        return (data ?? []).map((cs: any) => cs.students).filter(Boolean).map((s: any) => ({ id: s.id, name: s.name, username: s.username ?? s.name, grade: s.grade }));
      }

      // Teachers see students in their classes
      const { data, error } = await supabase
        .from("students")
        .select("id, name, username, grade, classes!inner(teacher_id)")
        .eq("classes.teacher_id", user.id);
      if (error) throw error;
      return (data ?? []).map((s: any) => ({ id: s.id, name: s.name, username: s.username ?? s.name, grade: s.grade }));
    },
    enabled: !!user,
  });

  if (students && students.length > 0 && !selectedStudentId) {
    setSelectedStudentId(students[0].id);
  }

  const student = students?.find(s => s.id === selectedStudentId);

  const { data: latest } = useQuery({
    queryKey: ["parent-latest", selectedStudentId, isDemo],
    queryFn: async () => {
      if (isDemo) {
        const demoAssess = [...demoAssessments]
          .filter(a => a.student_id === selectedStudentId)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!demoAssess) return null;
        const demoWords = demoWordAssessments
          .filter(w => w.assessment_id === demoAssess.id)
          .map(w => ({ word: w.word, error_type: w.error_type, detected_word: w.detected_word, confidence: w.confidence }));
        return { ...demoAssess, words: demoWords };
      }

      const { data: assessment } = await supabase
        .from("assessments")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (assessment) {
        const { data: words } = await supabase
          .from("word_assessments")
          .select("word, error_type, detected_word, confidence")
          .eq("assessment_id", assessment.id)
          .order("word_index", { ascending: true });
        return { ...assessment, words: words ?? [] };
      }

      return null;
    },
    enabled: !!selectedStudentId,
  });

  const mastered = latest?.words.filter((w: any) => w.error_type === "correct" && w.confidence >= 90) ?? [];
  const practiceWords = latest?.words.filter((w: any) =>
    w.error_type === "substitution" || w.error_type === "mispronunciation"
  ).slice(0, 5) ?? [];

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-display font-extrabold text-foreground">Home Connection Report</h1>
            <p className="text-muted-foreground mt-1">A friendly snapshot for caregivers</p>
          </div>

          {students && students.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.username || s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={generateParentInfoSheet}
              >
                <FileText className="w-3.5 h-3.5" /> Parent Info Sheet
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (!printWindow) return;
                  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reading Report — ${student?.username || student?.name || "Student"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 32px; color: #1a1a1a; }
  .header { background: #6366f1; color: white; padding: 24px; border-radius: 12px 12px 0 0; }
  .header h2 { font-size: 22px; margin-bottom: 4px; }
  .header p { opacity: 0.9; font-size: 13px; }
  .body { padding: 24px; border: 1px solid #e5e5e5; border-top: 0; border-radius: 0 0 12px 12px; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .stat { text-align: center; background: #f8f8f8; padding: 16px; border-radius: 8px; }
  .stat .value { font-size: 24px; font-weight: 700; }
  .stat .label { font-size: 12px; color: #888; }
  h3 { font-size: 16px; margin: 16px 0 8px; }
  .word-tag { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; margin: 2px 4px 2px 0; }
  .correct { background: #dcfce7; color: #166534; }
  .practice { background: #f3f4f6; padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; font-size: 13px; display: flex; justify-content: space-between; }
  .tip { background: #f8f8f8; border-radius: 8px; padding: 14px; text-align: center; font-size: 13px; margin-top: 16px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<div class="header"><h2>${student?.username || student?.name || "Student"}</h2><p>Reading Progress Update • ${latest ? new Date(latest.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}</p></div>
<div class="body">
<div class="stats"><div class="stat"><div class="label">Reading Speed</div><div class="value">${(latest as any)?.wpm ?? latest?.fluency_score ?? "—"} <span style="font-size:12px;font-weight:400">wpm</span></div></div><div class="stat"><div class="label">Accuracy</div><div class="value">${latest?.accuracy_score ?? "—"}%</div></div></div>
<h3>🎉 This Week's Wins!</h3><div>${mastered.length > 0 ? mastered.map((w: any) => `<span class="word-tag correct">✓ ${w.word}</span>`).join("") : "<p style='font-size:13px;color:#888'>Keep practicing — wins are on the way!</p>"}</div>
<h3>📖 Practice List for Home</h3>${practiceWords.length > 0 ? practiceWords.map((w: any) => `<div class="practice"><span>${w.word}</span><span style="color:#888">${w.error_type === "substitution" ? `Said "${w.detected_word}" instead` : "Needs pronunciation practice"}</span></div>`).join("") : "<p style='font-size:13px;color:#888'>No practice words — great job!</p>"}
<div class="tip">💡 <strong>Tip:</strong> Read together for 10-15 minutes each night. Let your child point to the words as they read!</div>
</div></body></html>`);
                  printWindow.document.close();
                  setTimeout(() => printWindow.print(), 300);
                }}
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            </div>
          )}

          {student && latest ? (
            <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="font-display font-extrabold text-2xl">{student.username || student.name}</h2>
                    <p className="opacity-90">Reading Progress Update • {new Date(latest.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="stat-card text-center">
                    <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-sm text-muted-foreground">Reading Speed</p>
                    <p className="text-2xl font-display font-bold text-foreground">{latest.fluency_score} <span className="text-sm font-normal">words/min</span></p>
                  </div>
                  <div className="stat-card text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-display font-bold text-foreground">{latest.accuracy_score}%</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-word-correct" />
                    <h3 className="font-display font-bold text-foreground text-lg">This Week's Wins! 🎉</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mastered.length > 0 ? mastered.map((w: any, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-word-correct/10 text-word-correct font-medium text-sm">
                        ✓ {w.word}
                      </span>
                    )) : (
                      <p className="text-sm text-muted-foreground">Keep practicing — wins are on the way!</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-3">📖 Practice List for Home</h3>
                  {practiceWords.length > 0 ? (
                    <div className="space-y-2">
                      {practiceWords.map((w: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                          <span className="font-medium text-foreground">{w.word}</span>
                          <span className="text-xs text-muted-foreground">
                            {w.error_type === "substitution"
                              ? `Said "${w.detected_word}" instead`
                              : "Needs pronunciation practice"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No practice words this week — great job!</p>
                  )}
                </div>

                <div className="text-center p-4 rounded-xl bg-muted">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Tip:</strong> Read together for 10-15 minutes each night. Let your child point to the words as they read!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              {students?.length === 0 ? "No students linked to your account yet." : "Loading..."}
            </p>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default ParentReport;
