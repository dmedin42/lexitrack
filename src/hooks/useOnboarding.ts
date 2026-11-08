import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingStep {
  index: number;
  label: string;
  route: string;
  target: string; // data-onboarding attribute value
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    index: 0,
    label: "Add Student",
    route: "/",
    target: "add-first-student",
    title: "Welcome to LexiTrack!",
    description: "Let's get you set up in under 2 minutes. Click here to add your first student.",
  },
  {
    index: 1,
    label: "Enter Names",
    route: "/manage-class",
    target: "bulk-add-area",
    title: "Add Your First Student",
    description: "Type a student username below and click 'Add' to create their account.",
  },
  {
    index: 2,
    label: "Set Password",
    route: "/manage-class",
    target: "save-student",
    title: "Set a Student Password",
    description: "Great! Now set a simple password for this student's portal access and hit Save.",
  },
  {
    index: 3,
    label: "Create Passage",
    route: "/assessments",
    target: "save-passage",
    title: "Create a Reading Passage",
    description: "We've added a sample passage for your first test. Click 'Create Passage' to save it to your library.",
  },
  {
    index: 4,
    label: "Assign Reading",
    route: "/assessments",
    target: "assign-button",
    title: "Assign to Your Student",
    description: "Select the passage, check your student, and click 'Assign' to send them a reading.",
  },
  {
    index: 5,
    label: "Student Link",
    route: "/assessments",
    target: "student-link-copy",
    title: "Try the Student Portal!",
    description: "Copy this link and open it in a new tab to see exactly what your students see. Record a sample to see the AI in action!",
  },
  {
    index: 6,
    label: "Settings",
    route: "/manage-class",
    target: "class-preferences",
    title: "Privacy-by-Design Settings",
    description: "Toggle these settings to adjust what your students see and AI sensitivity. LexiTrack never collects PII.",
  },
  {
    index: 7,
    label: "Finished!",
    route: "/",
    target: "student-card",
    title: "You're All Set! 🎉",
    description: "After a student reads, click their name to view word-level data and manually correct the AI.",
  },
];

const SESSION_KEY = "lexitrack_onboarding_step";
const SESSION_ACTIVE_KEY = "lexitrack_onboarding_active";

export function useOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_ACTIVE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored !== null ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [completed, setCompleted] = useState<boolean | null>(null);
  const loadedRef = useRef(false);

  // Persist active + step to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, String(active));
      sessionStorage.setItem(SESSION_KEY, String(step));
    } catch {}
  }, [active, step]);

  // Load onboarding state from DB
  useEffect(() => {
    if (!user || user.id === "demo-teacher" || loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      const { data } = await (supabase as any)
        .from("teachers")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      const isCompleted = data?.onboarding_completed === true;
      setCompleted(isCompleted);

      if (isCompleted) {
        // Onboarding already done — ensure overlay is hidden and sessionStorage is clean
        setActive(false);
        try {
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        } catch {}
      } else {
        // Resume or auto-activate onboarding
        setActive(true);
        try {
          sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
        } catch {}
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored !== null) {
          const resumeStep = parseInt(stored, 10);
          if (resumeStep >= 0 && resumeStep < ONBOARDING_STEPS.length) {
            setStep(resumeStep);
          }
        } else {
          setStep(0);
        }
      }
    };
    load();
  }, [user]);

  // Route watcher: when location changes during active tour, check if we
  // arrived at the expected route for the current step
  useEffect(() => {
    if (!active) return;
    const currentStepData = ONBOARDING_STEPS[step];
    if (!currentStepData) return;

    // If we navigated AWAY from the expected route (e.g. user pressed Back),
    // don't crash — just show the "Continue Demo" FAB via isOnExpectedRoute
  }, [location.pathname, active, step]);

  const startTour = useCallback(() => {
    setActive(true);
    setStep(0);
    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
      sessionStorage.setItem(SESSION_KEY, "0");
    } catch {}
  }, []);

  const nextStep = useCallback(() => {
    const next = step + 1;
    if (next >= ONBOARDING_STEPS.length) {
      completeOnboarding();
      return;
    }
    setStep(next);
    // Persist synchronously BEFORE navigating so the target page reads correct values
    try {
      sessionStorage.setItem(SESSION_KEY, String(next));
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
    } catch {}
    const targetRoute = ONBOARDING_STEPS[next].route;
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  }, [step, location.pathname, navigate]);

  const goToCurrentStep = useCallback(() => {
    const targetRoute = ONBOARDING_STEPS[step].route;
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  }, [step, location.pathname, navigate]);

  const completeOnboarding = useCallback(async () => {
    setActive(false);
    setCompleted(true);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    } catch {}
    if (user && user.id !== "demo-teacher") {
      await (supabase as any)
        .from("teachers")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    }
  }, [user]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const startOnboarding = useCallback(() => {
    setActive(true);
    setStep(0);
    try {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, "true");
      sessionStorage.setItem(SESSION_KEY, "0");
    } catch {}
  }, []);

  const currentStep = ONBOARDING_STEPS[step];
  const isOnExpectedRoute = location.pathname === currentStep?.route;
  const totalSteps = ONBOARDING_STEPS.length;
  const showPrivacyFact = active && step === 6;

  return {
    active,
    setActive,
    step,
    currentStep,
    totalSteps,
    isOnExpectedRoute,
    nextStep,
    skipOnboarding,
    startOnboarding,
    startTour,
    goToCurrentStep,
    completed,
    showPrivacyFact,
  };
}
