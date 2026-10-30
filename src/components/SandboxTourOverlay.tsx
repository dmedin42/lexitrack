import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TourStep } from "@/hooks/useSandboxTour";

interface SandboxTourOverlayProps {
  active: boolean;
  step: number;
  totalSteps: number;
  currentStep: TourStep;
  actionCompleted: boolean;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export default function SandboxTourOverlay({
  active,
  step,
  totalSteps,
  currentStep,
  actionCompleted,
  onNext,
  onSkip,
  onComplete,
}: SandboxTourOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  // Track target element position
  useEffect(() => {
    if (!active || currentStep.type !== "spotlight" || !currentStep.target) {
      setTargetRect(null);
      return;
    }

    const track = () => {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      rafRef.current = requestAnimationFrame(track);
    };

    const timeout = setTimeout(() => {
      track();
    }, 100);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, step, currentStep]);

  if (!active) return null;

  const isModal = currentStep.type === "modal";
  const isLastStep = step === totalSteps - 1;
  const isFirstStep = step === 0;
  const needsAction = currentStep.requiresAction && !actionCompleted;

  const pad = 12;
  const radius = 16;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Backdrop — SVG mask for rounded spotlight cutout */}
        {isModal ? (
          <div
            className="absolute inset-0 pointer-events-auto bg-background/80 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <mask id="tour-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect
                      x={targetRect.left - pad}
                      y={targetRect.top - pad}
                      width={targetRect.width + pad * 2}
                      height={targetRect.height + pad * 2}
                      rx={radius}
                      ry={radius}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="hsl(var(--foreground) / 0.5)"
                mask="url(#tour-spotlight-mask)"
              />
            </svg>
            {/* Clickable blockers around the spotlight hole */}
            {targetRect && (
              <>
                <div className="absolute pointer-events-auto" style={{ top: 0, left: 0, right: 0, height: Math.max(0, targetRect.top - pad) }} onClick={e => e.stopPropagation()} />
                <div className="absolute pointer-events-auto" style={{ top: targetRect.bottom + pad, left: 0, right: 0, bottom: 0 }} onClick={e => e.stopPropagation()} />
                <div className="absolute pointer-events-auto" style={{ top: targetRect.top - pad, left: 0, width: Math.max(0, targetRect.left - pad), height: targetRect.height + pad * 2 }} onClick={e => e.stopPropagation()} />
                <div className="absolute pointer-events-auto" style={{ top: targetRect.top - pad, left: targetRect.right + pad, right: 0, height: targetRect.height + pad * 2 }} onClick={e => e.stopPropagation()} />
              </>
            )}
          </>
        )}

        {/* Step dots */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[102] flex gap-2 pointer-events-auto">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "bg-primary scale-125"
                  : i < step
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Modal content (Step 1 & 6) */}
        {isModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-auto"
          >
            <div className="bg-card rounded-2xl shadow-lg border border-border max-w-md w-full p-8 text-center relative">
              <button
                onClick={onSkip}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                {currentStep.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {currentStep.body}
              </p>

              {isFirstStep ? (
                <Button onClick={onNext} size="lg" className="w-full gap-2">
                  Start the Tour <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={onComplete}
                    size="lg"
                    className="w-full gap-2"
                    asChild
                  >
                    <a href="/auth">Create My Account <ArrowRight className="w-4 h-4" /></a>
                  </Button>
                  <button
                    onClick={onComplete}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              )}

              {isFirstStep && (
                <button
                  onClick={onSkip}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip Tour
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Spotlight tooltip */}
        {!isModal && targetRect && (
          <motion.div
            key={`tooltip-${step}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.2 }}
            className="fixed z-[102] max-w-sm w-[90vw] pointer-events-auto"
            style={{
              top: (() => {
                const spaceBelow = window.innerHeight - targetRect.bottom;
                const spaceAbove = targetRect.top;
                if (spaceBelow >= 220) return targetRect.bottom + 16;
                if (spaceAbove >= 220) return targetRect.top - 220;
                // Overlay on top of the highlighted box
                return Math.max(16, targetRect.top + pad);
              })(),
              left: Math.min(
                Math.max(targetRect.left, 16),
                window.innerWidth - 380
              ),
            }}
          >
            <div className="bg-card rounded-xl shadow-lg border border-border p-5">
              <h3 className="font-display font-bold text-foreground text-lg mb-2">
                {currentStep.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {currentStep.body}
              </p>

              {currentStep.sideTip && (
                <div className="flex items-start gap-2 bg-accent/10 rounded-lg p-3 mb-4">
                  <Lightbulb className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80">{currentStep.sideTip}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={onSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip Tour
                </button>
                <Button
                  onClick={onNext}
                  size="sm"
                  className="gap-1.5"
                  disabled={needsAction}
                >
                  {needsAction ? "Click the word first" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
