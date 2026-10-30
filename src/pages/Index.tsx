import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Check, Loader2, PlusCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClasses, useStudents } from "@/hooks/useStudents";
import { useClassStats } from "@/hooks/useClassStats";
import StatsOverview from "@/components/StatsOverview";
import StudentCard from "@/components/StudentCard";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingOverlay from "@/components/OnboardingOverlay";

const Dashboard = () => {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const onboarding = useOnboarding();

  const copyStudentLink = () => {
    const url = `${window.location.origin}/student/${user?.id ?? ""}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Auto-select first class
  if (classes && classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0].id);
  }

  const selectedClass = classes?.find((c) => c.id === selectedClassId);
  const { data: students, isLoading: studentsLoading } = useStudents(selectedClassId || undefined);
  const { data: stats } = useClassStats(selectedClassId || undefined, selectedClass?.benchmark_wpm);

  // Still loading classes — show teal spinner
  if (classesLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground text-sm">Loading your dashboard…</p>
        </div>
      </AppLayout>
    );
  }

  // No classes created yet — onboarding CTA
  if (classes && classes.length === 0) {
    return (
      <AppLayout>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 text-center">
          <BookOpen className="w-14 h-14 text-primary mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Welcome to LexiTrack!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">Create your first class to start tracking student reading fluency.</p>
          <Button size="lg" className="gap-2" onClick={() => {
            if (onboarding.active) {
              onboarding.nextStep();
            } else {
              navigate("/manage-class");
            }
          }} data-onboarding="add-first-student">
            <PlusCircle className="w-5 h-5" /> Add Your First Student
          </Button>
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
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">Class Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {selectedClass
                ? `${selectedClass.grade} Grade • ${selectedClass.name} • ${students?.length ?? 0} Students`
                : "Select a class"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyStudentLink} className="gap-2" data-onboarding="student-link">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Student Link"}
            </Button>
          </div>
        </div>

        {stats && <StatsOverview stats={stats} />}

        <div className="mt-8">
          <h2 className="text-xl font-display font-bold text-foreground mb-4">Students</h2>
          {studentsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-3 text-muted-foreground text-sm">Loading students…</p>
            </div>
          ) : students && students.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {students.map((student, i) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  index={i}
                  benchmarkWPM={selectedClass?.benchmark_wpm ?? 80}
                  onboardingTarget={i === 0 ? "student-card" : undefined}
                />
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
              <PlusCircle className="w-10 h-10 text-primary mb-3" />
              <p className="text-muted-foreground mb-4">No students in this class yet.</p>
              <Button variant="outline" className="gap-2" onClick={() => {
                if (onboarding.active) {
                  onboarding.nextStep();
                } else {
                  navigate("/manage-class");
                }
              }} data-onboarding="add-first-student">
                <PlusCircle className="w-4 h-4" /> Add Your First Student
              </Button>
            </motion.div>
          )}
        </div>
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
    </AppLayout>
  );
};

export default Dashboard;
