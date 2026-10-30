import { useState, useMemo, useEffect } from "react";
import nlp from "compromise";
import { Badge } from "@/components/ui/badge";

interface RetellSubstantiveVolumeProps {
  transcription: string;
}

interface TaggedWord {
  text: string;
  isSubstantive: boolean;
}

// K-6 Stop Words: Common "noise" words in student speech that don't carry substantive weight
const K6_STOP_WORDS = new Set([
  "um", "umm", "Um", "Umm", "uh", "uhh", "Uh", "Uhh", "mhm", "like", "well", "basically", 
  "actually", "anyway", "was", "were", "to", "of", 
]);

function tagWords(text: string): TaggedWord[] {
  // 1. SPLITTING AGENT: Fixes cases like "basically.Uhh" by adding a space after punctuation
  const sanitizedText = text.replace(/([.!?,])([A-Za-z])/g, '$1 $2');
  
  const doc = nlp(sanitizedText);
  const terms = doc.termList();

  return terms.map((term: any) => {
    // Clean text for stop-word checking (lowercase and no punctuation)
    const wordText = term.text.toLowerCase().replace(/[.!?,]/g, "");
    const tags: string[] = Array.from(term.tags || []);
    
    // 2. REFINED LOGIC: Highlights Nouns/Verbs/Adj but excludes Pronouns and our K-6 Stop List
    const isSubstantive =
      tags.some((t: string) =>
        ["Noun", "Verb", "Adjective", "Value", "Cardinal", "Ordinal", "NumericValue"].includes(t)
      ) &&
      !tags.some((t: string) =>
        ["Pronoun", "Determiner", "Conjunction", "Preposition", "Auxiliary"].includes(t)
      ) &&
      !K6_STOP_WORDS.has(wordText);

    return { text: term.text, isSubstantive };
  });
}

const RetellSubstantiveVolume = ({ transcription }: RetellSubstantiveVolumeProps) => {
  const initialWords = useMemo(() => tagWords(transcription), [transcription]);
  const [words, setWords] = useState(initialWords);

  // Sync state if transcription changes externally
  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  const contentWordCount = words.filter((w) => w.isSubstantive).length;

  const toggleWord = (index: number) => {
    setWords((prev) =>
      prev.map((w, i) =>
        i === index ? { ...w, isSubstantive: !w.isSubstantive } : w
      )
    );
  };

  if (!transcription) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h4 className="font-display font-bold text-foreground text-sm">Substantive Volume</h4>
        <Badge className="bg-[hsl(142,60%,45%)] text-white text-sm">
          {contentWordCount} content words
        </Badge>
      </div>

      <div className="leading-8 text-base">
        {words.map((w, i) => (
          <span
            key={i}
            onClick={() => toggleWord(i)}
            className={`inline-block mr-1 cursor-pointer rounded px-1.5 py-0.5 transition-all select-none ${
              w.isSubstantive
                ? "bg-[hsl(142,60%,45%,0.15)] border border-[hsl(142,60%,45%,0.4)] text-foreground font-medium"
                : "text-muted-foreground opacity-30 border border-transparent"
            }`}
            title={w.isSubstantive ? "Content word — click to toggle" : "Stop word — click to toggle"}
          >
            {w.text}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Click any word to toggle its classification.</p>
    </div>
  );
};

export default RetellSubstantiveVolume;
