import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_GRADING_STRICTNESS } from "@/lib/grading";

interface GradingStrictnessSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const LABELS: { position: number; text: string; range: [number, number] }[] = [
  { position: 1.0, text: "Lenient", range: [1.0, 7.5] },
  { position: 7.6, text: "Loud environments", range: [7.6, 8.2] },
  { position: 8.2, text: "Recommended", range: [8.3, 8.7] },
  { position: 9.0, text: "Strict", range: [9.3, 9.7] },
  { position: 10.0, text: "Impossible", range: [9.8, 10.0] },
];

function getTrackColor(value: number): string {
  if (value < 8.0) return "hsl(180 15% 60%)";       // soft gray-teal (lenient)
  if (value <= 9.2) return "hsl(173 58% 39%)";       // LexiTrack primary teal (sweet spot)
  return "hsl(0 65% 48%)";                           // deep red-teal (strict)
}

function getThumbBorder(value: number): string {
  if (value < 8.0) return "hsl(180 15% 50%)";
  if (value <= 9.2) return "hsl(173 58% 32%)";
  return "hsl(0 65% 40%)";
}

const GradingStrictnessSlider = ({ value, onChange, className = "" }: GradingStrictnessSliderProps) => {
  const pct = useMemo(() => ((value - 1) / 9) * 100, [value]);
  const trackColor = useMemo(() => getTrackColor(value), [value]);
  const thumbBorder = useMemo(() => getThumbBorder(value), [value]);

  const handleSliderInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseFloat(e.target.value);
      onChange(Math.round(raw * 10) / 10);
    },
    [onChange]
  );

  const handleNumberInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(1, Math.min(10, parseFloat(e.target.value) || DEFAULT_GRADING_STRICTNESS));
      onChange(Math.round(v * 10) / 10);
    },
    [onChange]
  );

  return (
    <div className={`space-y-0 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Range slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            min={1}
            max={10}
            step={0.1}
            value={value}
            onChange={handleSliderInput}
            className="w-full h-2.5 rounded-full appearance-none cursor-pointer touch-manipulation"
            style={{
              background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${pct}%, hsl(180 10% 88%) ${pct}%, hsl(180 10% 88%) 100%)`,
              WebkitAppearance: "none",
            }}
          />
          <style>{`
            .strictness-slider::-webkit-slider-thumb,
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: 22px;
              width: 22px;
              border-radius: 50%;
              background: hsl(0 0% 100%);
              border: 2.5px solid ${thumbBorder};
              cursor: grab;
              box-shadow: 0 1px 4px hsl(200 25% 15% / 0.15);
              transition: border-color 0.2s;
              margin-top: -6px;
            }
            input[type="range"]::-moz-range-thumb {
              height: 22px;
              width: 22px;
              border-radius: 50%;
              background: hsl(0 0% 100%);
              border: 2.5px solid ${thumbBorder};
              cursor: grab;
              box-shadow: 0 1px 4px hsl(200 25% 15% / 0.15);
            }
            input[type="range"]::-webkit-slider-runnable-track {
              height: 10px;
              border-radius: 9999px;
            }
            input[type="range"]::-moz-range-track {
              height: 10px;
              border-radius: 9999px;
              background: hsl(180 10% 88%);
            }
          `}</style>

          {/* Labels row */}
          <div className="relative w-full mt-1 h-5 select-none pointer-events-none">
            <AnimatePresence mode="wait">
            {LABELS.map((l) => {
              const leftPct = ((l.position - 1) / 9) * 100;
              const isActive = value >= l.range[0] && value <= l.range[1];

              if (!isActive) return null;

              return (
                <motion.span
                  key={l.text}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute text-[10px] font-display font-bold whitespace-nowrap -translate-x-1/2"
                  style={{
                    left: `${Math.min(95, Math.max(5, leftPct))}%`,
                    color: "hsl(173 58% 39%)",
                  }}
                >
                  {l.text}
                </motion.span>
              );
            })}
            </AnimatePresence>
          </div>
        </div>

        {/* Numeric input */}
        <div className="flex flex-col items-center gap-0">
          <Input
            type="number"
            className="w-[60px] h-8 text-center text-sm font-display font-bold"
            min={1}
            max={10}
            step={0.1}
            value={value}
            onChange={handleNumberInput}
          />
          <Label className="text-[9px] text-muted-foreground font-display">Value</Label>
        </div>
      </div>
    </div>
  );
};

export default GradingStrictnessSlider;
