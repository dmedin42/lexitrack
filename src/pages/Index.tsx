import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Check, Loader2, PlusCircle, BookOpen, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useClasses, useStudents } from "@/hooks/useStudents";
import { usePlanView } from "@/hooks/usePlanView";
import { useClassStats } from "@/hooks/useClassStats";
import StatsOverview from "@/components/StatsOverview";
import StudentCard from "@/components/StudentCard";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import lexitrackLogo from "@/assets/lexitrack-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { STRIPE_PUBLISHABLE_KEY as PUBLISHABLE_KEY, STRIPE_PRICING_TABLE_ID as PRICING_TABLE_ID } from "@/lib/stripe-config";


const Dashboard = () => {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const { user } = useAuth();
  const { hasSeenPlans, isLoading: planViewLoading, incrementPlanView } = usePlanView();
  const navigate = useNavigate();
  const scriptLoaded = useRef(false);
  const autoShownRef = useRef(false);
  const onboarding = useOnboarding();

  // Auto-show pricing overlay on first-ever dashboard visit (has_seen_plans === 0)
  useEffect(() => {
    if (planViewLoading || autoShownRef.current) return;
    if (hasSeenPlans === 0) {
      setShowPricing(true);
      autoShownRef.current = true;
    }
  }, [hasSeenPlans, planViewLoading]);

  // Increment plan view counter whenever the overlay opens
  useEffect(() => {
    if (showPricing) {
      incrementPlanView();
    }
  }, [showPricing, incrementPlanView]);

  // Load Stripe pricing table script when needed
  useEffect(() => {
    if (!showPricing || scriptLoaded.current) return;
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]');
    if (existing) { scriptLoaded.current = true; return; }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.head.appendChild(script);
    scriptLoaded.current = true;
  }, [showPricing]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      toast.success("🎉 Welcome to LexiTrack Pro! Your classroom is now unlimited.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const copyStudentLink = () => {
    const url = `https://lexitrackedu.com/student/${user?.id ?? ""}`;
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

        {/* Pricing Overlay for new signups */}
        <AnimatePresence>
          {showPricing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-background flex flex-col overflow-y-auto"
            >
              <header className="border-b border-border px-6 py-4 shrink-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                  <img src={lexitrackLogo} alt="LexiTrack" className="h-9 w-auto" />
                </div>
              </header>
              <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
                <div className="text-center mb-8">
                  <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-3">
                    Choose Your Plan
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Unlock unlimited students, passages, and advanced analytics — or start free and upgrade anytime.
                  </p>
                </div>
                <div className="w-[95vw] max-w-5xl rounded-xl overflow-hidden [&>stripe-pricing-table]:block mb-8">
                  {/* @ts-ignore – Stripe custom element */}
                  <stripe-pricing-table
                    pricing-table-id={PRICING_TABLE_ID}
                    publishable-key={PUBLISHABLE_KEY}
                    client-reference-id={user?.id || ""}
                    customer-email={user?.email || ""}
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-6">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Safe &amp; Secure via Stripe</span>
                </div>
                <Button
                  variant="ghost"
                  size="lg"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPricing(false)}
                >
                  Skip for now — Try Free Tier <ArrowRight className="w-4 h-4" />
                </Button>
              </main>
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* Pricing Overlay for new signups */}
      <AnimatePresence>
        {showPricing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col overflow-y-auto"
          >
            <header className="border-b border-border px-6 py-4 shrink-0">
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <img src={lexitrackLogo} alt="LexiTrack" className="h-9 w-auto" />
              </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
              <div className="text-center mb-8">
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-3">
                  Choose Your Plan
                </h1>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Unlock unlimited students, passages, and advanced analytics — or start free and upgrade anytime.
                </p>
              </div>
              <div className="w-[95vw] max-w-5xl rounded-xl overflow-hidden [&>stripe-pricing-table]:block mb-8">
                {/* @ts-ignore – Stripe custom element */}
                <stripe-pricing-table
                  pricing-table-id={PRICING_TABLE_ID}
                  publishable-key={PUBLISHABLE_KEY}
                  client-reference-id={user?.id || ""}
                  customer-email={user?.email || ""}
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-6">
                <Shield className="h-3.5 w-3.5" />
                <span>Safe &amp; Secure via Stripe</span>
              </div>
              <Button
                variant="ghost"
                size="lg"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPricing(false)}
              >
                Skip for now — Try Free Tier <ArrowRight className="w-4 h-4" />
              </Button>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

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
