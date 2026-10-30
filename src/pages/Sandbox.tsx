import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, Target, Users, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WordMap from "@/components/WordMap";
import SandboxTourOverlay from "@/components/SandboxTourOverlay";
import { useSandboxTour } from "@/hooks/useSandboxTour";
import {
  sandboxStudent,
  sandboxAssessment,
  sandboxWords,
  sandboxErrorPatterns,
  sandboxClusters,
  TOUR_ERROR_WORD_INDEX,
} from "@/data/sandboxData";
import logoImg from "@/assets/lexitrack-logo.png";

const severityColors: Record<string, string> = {
  high: "border-l-destructive bg-destructive/5",
  medium: "border-l-accent bg-accent/5",
  low: "border-l-primary bg-primary/5",
};

const severityIcons: Record<string, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: TrendingUp,
  low: Zap,
};

export default function Sandbox() {
  const tour = useSandboxTour();
  const [correctedWords, setCorrectedWords] = useState<Set<number>>(new Set());

  // Build word map data, applying local corrections
  const wordMapData = sandboxWords.map((w, i) => ({
    id: w.id,
    word: w.word,
    errorType: correctedWords.has(i) ? ("correct" as const) : w.errorType,
    detectedWord: w.detectedWord,
    phonemes: w.phonemes,
    confidence: correctedWords.has(i) ? 100 : w.confidence,
    offsetMs: w.offsetMs,
    durationMs: w.durationMs,
    vouched: correctedWords.has(i),
  }));

  // Handle the forced-click interaction on step 3
  const handleErrorWordClick = useCallback(() => {
    if (tour.active && tour.step === 2) {
      setCorrectedWords(prev => new Set(prev).add(TOUR_ERROR_WORD_INDEX));
      tour.markActionComplete();
    }
  }, [tour]);

  const totalWords = sandboxWords.length;
  const errorCount = sandboxWords.filter(w => w.errorType !== "correct").length;
  const accuracyPct = Math.round(((totalWords - errorCount + correctedWords.size) / totalWords) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="LexiTrack" className="h-7" />
            <span className="font-display font-bold text-foreground text-lg">LexiTrack</span>
          </div>
          {!tour.active && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth">Sign In</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/auth">Create Account</a>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Student header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">{sandboxStudent.avatar}</div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {sandboxStudent.name}'s Assessment
            </h1>
            <p className="text-sm text-muted-foreground">
              {sandboxAssessment.passageTitle} · {sandboxAssessment.date}
            </p>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">WPM</p>
            <p className="text-3xl font-display font-bold text-primary">
              {sandboxAssessment.fluencyScore}
            </p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Accuracy</p>
            <p className="text-3xl font-display font-bold text-primary">{accuracyPct}%</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
            <p className="text-3xl font-display font-bold text-foreground">
              {sandboxAssessment.durationSeconds}s
            </p>
          </div>
          <div className="stat-card text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Words</p>
            <p className="text-3xl font-display font-bold text-foreground">{totalWords}</p>
          </div>
        </div>

        {/* Word Map Section */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Word Map — Real-Time Transcript
          </h2>
          {/* Wrapper: data-tour for spotlight, also listen for click on error word */}
          <div
            data-tour="word-map"
            className="bg-card rounded-xl border border-border p-6 shadow-sm"
          >
            <div onClick={handleErrorWordClick}>
              {/* Render words individually so we can tag the error word */}
              <div className="relative">
                <div className="leading-9 text-lg font-medium">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 mb-4 text-xs">
                    {[
                      { label: "Correct", cls: "word-correct" },
                      { label: "Substitution", cls: "word-substitution" },
                      { label: "Mispronunciation", cls: "word-mispronunciation" },
                      { label: "Omission", cls: "word-omission" },
                    ].map(l => (
                      <span key={l.label} className={`${l.cls} text-xs`}>{l.label}</span>
                    ))}
                  </div>

                  {wordMapData.map((w, i) => {
                    const errorClassMap: Record<string, string> = {
                      correct: "word-correct",
                      substitution: "word-substitution",
                      mispronunciation: "word-mispronunciation",
                      omission: "word-omission",
                      insertion: "word-insertion",
                    };
                    const isTargetError = i === TOUR_ERROR_WORD_INDEX;
                    return (
                      <span
                        key={i}
                        className={`${errorClassMap[w.errorType]} ${w.vouched ? "!border-primary !bg-primary/10 !text-primary" : ""} mr-1 inline-block transition-all ${
                          isTargetError && tour.active && tour.step === 2
                            ? "ring-2 ring-primary animate-pulse scale-110"
                            : ""
                        }`}
                        data-tour={isTargetError ? "error-word" : undefined}
                      >
                        {w.word}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error Pattern Insights */}
        <section data-tour="insights">
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Error Pattern Insights
          </h2>
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Mispronunciations</p>
                <div className="flex flex-wrap gap-2">
                  {sandboxErrorPatterns
                    .filter(p => p.errorType === "mispronunciation")
                    .map(p => (
                      <Badge key={p.word} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                        "{p.word}" ×{p.count}
                      </Badge>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Substitutions</p>
                <div className="flex flex-wrap gap-2">
                  {sandboxErrorPatterns
                    .filter(p => p.errorType === "substitution")
                    .map(p => (
                      <Badge key={p.word} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
                        "{p.word}" ×{p.count}
                      </Badge>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Omissions</p>
                <div className="flex flex-wrap gap-2">
                  {sandboxErrorPatterns
                    .filter(p => p.errorType === "omission")
                    .map(p => (
                      <Badge key={p.word} variant="secondary" className="bg-muted text-muted-foreground">
                        "{p.word}" ×{p.count}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cluster Groups */}
        <section data-tour="clusters">
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Intervention Clusters
          </h2>
          <div className="space-y-4">
            {sandboxClusters.map((cluster) => {
              const Icon = severityIcons[cluster.severity];
              return (
                <motion.div
                  key={cluster.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-card rounded-xl border border-border border-l-4 p-5 shadow-sm ${severityColors[cluster.severity]}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 shrink-0 text-foreground/70" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-foreground">{cluster.errorPattern}</h3>
                        <Badge variant="outline" className="text-xs capitalize">{cluster.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{cluster.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{cluster.studentCount} students</span> · {cluster.suggestedActivity}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Sticky CTA after tour */}
      {!tour.active && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur-md border-t border-border p-4 z-50"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Ready to try with your own students?
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={tour.resetTour}>
                Replay Tour
              </Button>
              <Button size="sm" asChild>
                <a href="/auth">Create My Account</a>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tour Overlay */}
      <SandboxTourOverlay
        active={tour.active}
        step={tour.step}
        totalSteps={tour.totalSteps}
        currentStep={tour.currentStep}
        actionCompleted={tour.actionCompleted}
        onNext={tour.nextStep}
        onSkip={tour.skipTour}
        onComplete={tour.completeTour}
      />
    </div>
  );
}
