import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Volume2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVouch } from "@/hooks/useVouch";
import { useToast } from "@/hooks/use-toast";

interface WordMapWord {
  id: string;
  word: string;
  errorType: "correct" | "substitution" | "mispronunciation" | "omission" | "insertion" | "unread";
  detectedWord?: string;
  phonemes?: { phoneme: string; expected: string; quality: number }[];
  confidence: number;
  offsetMs: number;
  durationMs: number;
  vouched?: boolean;
}

interface WordMapProps {
  words: WordMapWord[];
  enableDeepDive?: boolean;
  showVouch?: boolean;
  /** Remove trailing unread/omission words the student never reached */
  trimTrailing?: boolean;
  /** Auto-play TTS when a word is clicked (student view) */
  autoPlayOnClick?: boolean;
}

const errorClassMap: Record<string, string> = {
  correct: "word-correct",
  substitution: "word-substitution",
  mispronunciation: "word-mispronunciation",
  omission: "word-omission",
  insertion: "word-insertion",
  unread: "word-omission",
};

const WordMap = ({ words, enableDeepDive = true, showVouch = true, trimTrailing = false, autoPlayOnClick = false }: WordMapProps) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const vouch = useVouch();
  const { toast } = useToast();

  // Trim trailing consecutive omission/unread words (student never reached them)
  const displayWords = useMemo(() => {
    if (!trimTrailing) return words;
    let lastAttemptedIdx = words.length - 1;
    while (lastAttemptedIdx >= 0 && (words[lastAttemptedIdx].errorType === "omission" || words[lastAttemptedIdx].errorType === "unread")) {
      lastAttemptedIdx--;
    }
    return words.slice(0, lastAttemptedIdx + 1);
  }, [words, trimTrailing]);

  const selected = selectedIdx !== null ? displayWords[selectedIdx] : null;

  const playWordAudio = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const handleWordClick = (w: WordMapWord, i: number) => {
    if (autoPlayOnClick) {
      playWordAudio(w.detectedWord || w.word);
      return;
    }
    if (enableDeepDive && w.errorType !== "correct") {
      setSelectedIdx(i === selectedIdx ? null : i);
    }
  };

  const handleVouch = (wordId: string, errorType: string) => {
    vouch.mutate(
      { wordAssessmentId: wordId, originalErrorType: errorType },
      { onSuccess: () => toast({ title: "Marked as correct" }) }
    );
  };

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {[
          { label: "Correct", cls: "word-correct" },
          { label: "Substitution", cls: "word-substitution" },
          { label: "Mispronunciation", cls: "word-mispronunciation" },
          { label: "Omission", cls: "word-omission" },
          { label: "Insertion", cls: "word-insertion" },
        ].map(l => (
          <span key={l.label} className={`${l.cls} text-xs`}>{l.label}</span>
        ))}
      </div>

      {/* Word flow */}
      <div className="leading-9 text-lg font-medium">
        {displayWords.map((w, i) => (
          <span
            key={i}
            className={`${errorClassMap[w.errorType]} ${w.vouched ? "!border-primary !bg-primary/10 !text-primary" : ""} mr-1 inline-block transition-all ${autoPlayOnClick || (w.errorType !== "correct" && enableDeepDive) ? "hover:scale-105 cursor-pointer" : ""}`}
            onClick={() => handleWordClick(w, i)}
          >
            {w.errorType === "insertion" ? `[${w.detectedWord}]` : w.word}
            {w.vouched && <CheckCircle2 className="inline w-3 h-3 ml-0.5" />}
          </span>
        ))}
      </div>

      {/* Deep Dive panel */}
      {selected && selectedIdx !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-xl bg-card border border-border shadow-elevated"
        >
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-display font-bold text-foreground">Deep Dive</h4>
            <button onClick={() => setSelectedIdx(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Error Type</p>
            <span className={`${errorClassMap[selected.errorType]} text-xs font-semibold uppercase`}>
              {selected.errorType}
            </span>
          </div>

          {/* Phoneme breakdown */}
          {selected.phonemes && selected.phonemes.length > 0 && (
            <div className="mt-4">
              <p className="text-muted-foreground text-sm mb-2">Phoneme Breakdown</p>
              <div className="flex gap-2 flex-wrap">
                {selected.phonemes.map((p, pi) => (
                  <div
                    key={pi}
                    className={`px-3 py-2 rounded-lg border text-center min-w-[60px] ${
                      p.quality >= 70
                        ? "border-word-correct/30 bg-word-correct/5"
                        : "border-word-substitution/30 bg-word-substitution/5"
                    }`}
                  >
                    <p className="text-lg font-mono font-bold text-foreground">/{p.phoneme}/</p>
                    <p className="text-xs text-muted-foreground">expect: /{p.expected}/</p>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.quality >= 70 ? "bg-word-correct" : "bg-word-substitution"}`}
                        style={{ width: `${p.quality}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => playWordAudio(selected.detectedWord || selected.word)}
            >
              <Volume2 className="w-3.5 h-3.5" /> Play Audio
            </Button>
            {showVouch && !selected.vouched && (
              <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleVouch(selected.id, selected.errorType)}
                disabled={vouch.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Correct
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default WordMap;
