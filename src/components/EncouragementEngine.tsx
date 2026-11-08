import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Target, Zap, Shield, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface WordData {
  word: string;
  errorType: string;
}

interface EncouragementEngineProps {
  assessmentId: string | undefined;
  studentName: string;
  studentId: string;
  currentWPM: number;
  previousWPM: number | null;
  accuracy: number;
  words: WordData[];
  savedNote?: string | null;
}

interface Encouragement {
  id: string;
  icon: typeof Sparkles;
  label: string;
  message: string;
  color: string;
}

const EncouragementEngine = ({
  assessmentId,
  studentName,
  studentId,
  currentWPM,
  previousWPM,
  accuracy,
  words,
  savedNote,
}: EncouragementEngineProps) => {
  const [selectedNote, setSelectedNote] = useState<string | null>(savedNote ?? null);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(!!savedNote);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const firstName = studentName.split(" ")[0];

  // Detect multi-syllabic words attempted (3+ syllables approximation: 7+ chars)
  const attemptedHardWords = useMemo(() => {
    return words.filter(w => w.word.length >= 7 && w.errorType !== "omission");
  }, [words]);

  // Generate encouragement options based on data — always positive!
  const encouragements = useMemo<Encouragement[]>(() => {
    const options: Encouragement[] = [];

    // Precision Hero — accuracy > 95%
    if (accuracy > 95) {
      options.push({
        id: "precision",
        icon: Target,
        label: "Precision Hero",
        message: `Amazing, ${firstName}! You read so carefully today. Keep it up!`,
        color: "text-primary",
      });
    }

    // Speed Racer — WPM increased by 3+ (lowered threshold)
    if (previousWPM !== null && currentWPM - previousWPM >= 3) {
      options.push({
        id: "speed",
        icon: Zap,
        label: "Speed Racer",
        message: `Wow, ${firstName}! You're getting faster every time. Great rhythm today!`,
        color: "text-[hsl(45,90%,45%)]",
      });
    }

    // Brave Reader — attempted hard words
    if (attemptedHardWords.length >= 2) {
      options.push({
        id: "brave",
        icon: Shield,
        label: "Brave Reader",
        message: `So proud of you, ${firstName}! You tackled some tricky words today!`,
        color: "text-accent",
      });
    }

    // Growing Reader — first assessment or steady performance
    if (previousWPM === null) {
      options.push({
        id: "first",
        icon: Sparkles,
        label: "Great Start",
        message: `What a wonderful first reading, ${firstName}! I can't wait to hear you read again!`,
        color: "text-primary",
      });
    }

    // Fallback: always provide at least one positive option
    if (options.length === 0) {
      options.push({
        id: "effort",
        icon: Sparkles,
        label: "Great Effort",
        message: `Great job reading today, ${firstName}! You're doing amazing!`,
        color: "text-primary",
      });
    }

    return options.slice(0, 3);
  }, [accuracy, currentWPM, previousWPM, attemptedHardWords, firstName]);

  const handleSelect = async (enc: Encouragement) => {
    if (!assessmentId) return;
    setSelectedNote(enc.message);
    setSaving(true);
    try {
      await (supabase as any)
        .from("assessments")
        .update({ teacher_encouragement: enc.message })
        .eq("id", assessmentId);
      queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
      setShowCelebration(true);
      toast({ title: "Encouragement saved!" });
    } catch (err: any) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!assessmentId) return;
    setSaving(true);
    try {
      await (supabase as any)
        .from("assessments")
        .update({ teacher_encouragement: null })
        .eq("id", assessmentId);
      setSelectedNote(null);
      setShowCelebration(false);
      queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
      toast({ title: "Encouragement cleared" });
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl bg-card border border-border shadow-sm p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[hsl(45,90%,45%)]" />
          Quick Feedback
        </h3>
        {selectedNote && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1"
            onClick={handleClear}
            disabled={saving}
          >
            <X className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showCelebration && selectedNote ? (
          /* Celebration card — screen-share friendly */
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-gradient-to-br from-primary/10 via-[hsl(45,90%,50%,0.08)] to-accent/10 border-2 border-primary/20 p-6 text-center"
          >
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-lg font-display font-bold text-foreground leading-relaxed">
              {selectedNote}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-primary">
              <Check className="w-4 h-4" />
              <span className="text-xs font-medium">Saved to {firstName}'s record</span>
            </div>
          </motion.div>
        ) : (
          /* Selection buttons */
          <motion.div
            key="buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-2"
          >
            <p className="text-xs text-muted-foreground mb-1">
              Select feedback to show {firstName} and save to their record:
            </p>
            {encouragements.map((enc) => (
              <Button
                key={enc.id}
                variant="outline"
                className="h-auto py-3 px-4 text-left justify-start gap-3 whitespace-normal"
                onClick={() => handleSelect(enc)}
                disabled={saving}
              >
                <enc.icon className={`w-5 h-5 shrink-0 ${enc.color}`} />
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${enc.color}`}>
                    {enc.label}
                  </span>
                  <p className="text-sm text-foreground mt-0.5">{enc.message}</p>
                </div>
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EncouragementEngine;
