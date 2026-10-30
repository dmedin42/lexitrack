import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS } from "@/hooks/useOnboarding";
import { useIsMobile } from "@/hooks/use-mobile";

interface OnboardingOverlayProps {
  active: boolean;
  step: number;
  totalSteps: number;
  isOnExpectedRoute: boolean;
  onNext: () => void;
  onSkip: () => void;
  onGoToStep: () => void;
  showPrivacyFact: boolean;
}

const SPOTLIGHT_PADDING = 14;
const SPOTLIGHT_RADIUS = 12;

const OnboardingOverlay = ({
  active,
  step,
  totalSteps,
  isOnExpectedRoute,
  onNext,
  onSkip,
  onGoToStep,
  showPrivacyFact,
}: OnboardingOverlayProps) => {
  const isMobile = useIsMobile();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const prevTargetRef = useRef<Element | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const currentStep = ONBOARDING_STEPS[step];

  // Clean highlight classes from an element
  const removeHighlight = useCallback((el: Element | null) => {
    if (el) {
      el.classList.remove("ring-2", "ring-primary", "animate-pulse", "relative", "z-[52]");
    }
  }, []);

  // Add highlight classes to an element
  const addHighlight = useCallback((el: Element) => {
    el.classList.add("ring-2", "ring-primary", "animate-pulse", "relative", "z-[52]");
  }, []);

  // Track target element with a lightweight poll (every 200ms) instead of RAF
  useEffect(() => {
    if (!active || !isOnExpectedRoute) {
      setTargetRect(null);
      removeHighlight(prevTargetRef.current);
      prevTargetRef.current = null;
      return;
    }

    const findAndTrack = () => {
      const el = document.querySelector(`[data-onboarding="${currentStep.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect((prev) => {
          // Only update state if rect actually changed (prevents unnecessary re-renders)
          if (
            prev &&
            Math.abs(prev.top - rect.top) < 1 &&
            Math.abs(prev.left - rect.left) < 1 &&
            Math.abs(prev.width - rect.width) < 1 &&
            Math.abs(prev.height - rect.height) < 1
          ) {
            return prev;
          }
          return rect;
        });

        // Swap highlight if target element changed
        if (prevTargetRef.current !== el) {
          removeHighlight(prevTargetRef.current);
          addHighlight(el);
          prevTargetRef.current = el;
        }
      } else {
        setTargetRect(null);
      }
    };

    // Initial delay for route transitions, then start polling
    const initTimeout = setTimeout(() => {
      findAndTrack();
      pollRef.current = setInterval(findAndTrack, 200);
    }, 350);

    return () => {
      clearTimeout(initTimeout);
      if (pollRef.current) clearInterval(pollRef.current);
      removeHighlight(prevTargetRef.current);
      prevTargetRef.current = null;
    };
  }, [active, step, isOnExpectedRoute, currentStep.target, removeHighlight, addHighlight]);

  if (!active) return null;

  // Build SVG-based spotlight mask (smooth rounded corners)
  const renderSpotlightMask = () => {
    if (!targetRect) return null;
    const x = targetRect.left - SPOTLIGHT_PADDING;
    const y = targetRect.top - SPOTLIGHT_PADDING;
    const w = targetRect.width + SPOTLIGHT_PADDING * 2;
    const h = targetRect.height + SPOTLIGHT_PADDING * 2;
    const r = SPOTLIGHT_RADIUS;

    return (
      <svg
        className="fixed inset-0 z-[51] pointer-events-none"
        width="100%"
        height="100%"
        style={{ transition: "opacity 0.2s ease" }}
      >
        <defs>
          <mask id="onboarding-spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={r}
              ry={r}
              fill="black"
              style={{ transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--foreground) / 0.45)"
          mask="url(#onboarding-spotlight)"
        />
      </svg>
    );
  };

  // Block clicks outside the spotlight area
  const renderBlockers = () => {
    if (!targetRect) return (
      <div className="fixed inset-0 z-[51] bg-foreground/40" onClick={(e) => e.stopPropagation()} />
    );

    const x = targetRect.left - SPOTLIGHT_PADDING;
    const y = targetRect.top - SPOTLIGHT_PADDING;
    const w = targetRect.width + SPOTLIGHT_PADDING * 2;
    const h = targetRect.height + SPOTLIGHT_PADDING * 2;

    // Four blocker divs around the spotlight cutout
    return (
      <>
        {/* Top */}
        <div className="fixed top-0 left-0 right-0 z-[51]" style={{ height: y }} onClick={(e) => e.stopPropagation()} />
        {/* Bottom */}
        <div className="fixed left-0 right-0 bottom-0 z-[51]" style={{ top: y + h }} onClick={(e) => e.stopPropagation()} />
        {/* Left */}
        <div className="fixed left-0 z-[51]" style={{ top: y, height: h, width: x }} onClick={(e) => e.stopPropagation()} />
        {/* Right */}
        <div className="fixed z-[51]" style={{ top: y, height: h, left: x + w, right: 0 }} onClick={(e) => e.stopPropagation()} />
      </>
    );
  };

  // Position tooltip: try below target, flip above if not enough room, center as fallback
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 53 };
    }

    const tooltipH = 200;
    const tooltipW = isMobile ? window.innerWidth - 32 : 360;
    const spaceBelow = window.innerHeight - targetRect.bottom - SPOTLIGHT_PADDING;
    const spaceAbove = targetRect.top - SPOTLIGHT_PADDING;

    let top: number;
    if (spaceBelow >= tooltipH + 20) {
      top = targetRect.bottom + SPOTLIGHT_PADDING + 12;
    } else if (spaceAbove >= tooltipH + 20) {
      top = targetRect.top - SPOTLIGHT_PADDING - tooltipH - 12;
    } else {
      // Overlay: center vertically on target
      top = Math.max(60, targetRect.top + targetRect.height / 2 - tooltipH / 2);
    }

    const left = isMobile ? 16 : Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipW - 16));

    return { position: "fixed", top, left, zIndex: 53 };
  };

  return (
    <>
      {/* Progress bar - fixed top */}
      <motion.div
        initial={{ y: -48 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[55] bg-card border-b border-border px-4 py-2.5"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {ONBOARDING_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-300 ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium truncate hidden sm:inline transition-colors duration-200 ${
                  i === step ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded transition-colors duration-300 ${
                    i < step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* SVG spotlight mask (smooth rounded cutout) */}
      {isOnExpectedRoute && renderSpotlightMask()}

      {/* Click blockers around spotlight */}
      {isOnExpectedRoute && renderBlockers()}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {isOnExpectedRoute && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={getTooltipStyle()}
            className="bg-card border border-border rounded-xl p-5 shadow-lg max-w-[90vw] sm:max-w-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display font-bold text-foreground text-base">
                {currentStep.title}
              </h3>
              <button
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                aria-label="Skip tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{currentStep.description}</p>
            <div className="flex items-center justify-between">
              <button
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Skip Tutorial
              </button>
              <Button size="sm" onClick={onNext} className="gap-1.5">
                {step === totalSteps - 1 ? "Finish" : "Next"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Continue Demo" FAB - shown when user navigates away */}
      <AnimatePresence>
        {!isOnExpectedRoute && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`fixed z-[55] ${
              isMobile ? "bottom-20 right-4" : "bottom-6 right-6"
            }`}
          >
            <Button
              onClick={onGoToStep}
              className="gap-2 shadow-lg rounded-full px-5 h-11"
            >
              <RotateCcw className="w-4 h-4" />
              Continue Demo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Fact badge */}
      <AnimatePresence>
        {showPrivacyFact && isOnExpectedRoute && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed z-[55] ${
              isMobile ? "bottom-20 left-4 right-4" : "bottom-6 left-6 max-w-xs"
            }`}
          >
            <div className="bg-card border border-primary/20 rounded-lg p-3 shadow-md flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Privacy Fact:</span> LexiTrack is Privacy-by-Design. Passwords stay encrypted, and we never ask for last names or SSIDs.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OnboardingOverlay;
