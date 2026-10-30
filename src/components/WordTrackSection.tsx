import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import WordMap from "@/components/WordMap";

interface WordTrackSectionProps {
  activeId: string | undefined;
  scoredWords: any[];
}

const WordTrackSection = ({ activeId, scoredWords }: WordTrackSectionProps) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-display font-bold text-foreground text-base">Word Track</h3>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <WordMap key={activeId} words={scoredWords} trimTrailing={true} />
        </div>
      )}
    </div>
  );
};

export default WordTrackSection;
