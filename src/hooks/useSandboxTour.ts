import { useState, useCallback, useEffect } from "react";

const LS_KEY = "lexi_tour_complete";

export interface TourStep {
  index: number;
  label: string;
  type: "modal" | "spotlight";
  target?: string; // data-tour attribute value
  title: string;
  body: string;
  sideTip?: string;
  requiresAction?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    index: 0,
    label: "Welcome",
    type: "modal",
    title: "Welcome to the Future of ORF",
    body: "Take a 60-second tour to see how LexiTrack turns hours of manual grading into seconds of insight. We've pre-loaded a sample assessment for you.",
  },
  {
    index: 1,
    label: "Word Map",
    type: "spotlight",
    target: "word-map",
    title: "The Word Map",
    body: "While AJ reads, AI maps every word in real-time. 🟢 Green is accurate, 🔴 Red is a substitution, ⚪ Gray is an omission.",
    sideTip: "💡 Pro-Tip: No more stopwatches. LexiTrack calculates WPM and Accuracy automatically.",
  },
  {
    index: 2,
    label: "Override",
    type: "spotlight",
    target: "error-word",
    title: "Human-in-the-Loop",
    body: "AI isn't the boss—you are. Click the highlighted word to manually override the AI decision with one click.",
    requiresAction: true,
  },
  {
    index: 3,
    label: "Insights",
    type: "spotlight",
    target: "insights",
    title: "Error Pattern Insights",
    body: "Stop tallying errors by hand. We automatically identify patterns like 'Initial Consonant Blends' or 'Vowel Digraphs' so you can target your instruction immediately.",
  },
  {
    index: 4,
    label: "Clusters",
    type: "spotlight",
    target: "clusters",
    title: "The 'Monday Morning' Solution",
    body: "LexiTrack automatically groups your students by their specific struggles—so you walk in Monday morning with a plan.",
  },
  {
    index: 5,
    label: "Get Started",
    type: "modal",
    title: "Ready to Reclaim Your Thursday Nights?",
    body: "You just did in 60 seconds what usually takes 2 hours of testing and data entry. Ready to set up your real class?",
  },
];

export function useSandboxTour() {
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(true);

  const [actionCompleted, setActionCompleted] = useState(false);

  const currentStep = TOUR_STEPS[step];

  const emitEvent = useCallback((stepIndex: number) => {
    window.dispatchEvent(
      new CustomEvent("tour_step_reached", { detail: { step: stepIndex } })
    );
  }, []);

  useEffect(() => {
    if (active) emitEvent(step);
  }, [step, active, emitEvent]);

  const nextStep = useCallback(() => {
    setActionCompleted(false);
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1);
    }
  }, [step]);

  const completeTour = useCallback(() => {
    setActive(false);
    localStorage.setItem(LS_KEY, "true");
    emitEvent(TOUR_STEPS.length); // completion event
  }, [emitEvent]);

  const skipTour = useCallback(() => {
    setActive(false);
    localStorage.setItem(LS_KEY, "true");
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setStep(0);
    setActive(true);
    setActionCompleted(false);
  }, []);

  const markActionComplete = useCallback(() => {
    setActionCompleted(true);
  }, []);

  return {
    step,
    active,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    nextStep,
    skipTour,
    completeTour,
    resetTour,
    actionCompleted,
    markActionComplete,
  };
}
