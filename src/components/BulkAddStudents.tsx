import { useState, useMemo, useCallback } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AVATARS = [
  "🦊","🐼","🦉","🐬","🦋","🐢","🌻","🍎",
  "🐨","🦁","🐸","🐙","🦄","🐝","🐧","🦈",
  "🐳","🦩","🐞","🌈","🍄","🌵","⭐","🔥",
  "🚀","🎸","🎨","💎","🏀","🌊",
];

function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

function nextAvatar(current: string) {
  const idx = AVATARS.indexOf(current);
  return AVATARS[(idx + 1) % AVATARS.length];
}

interface ParsedStudent {
  name: string;
  avatar: string;
}

interface BulkAddStudentsProps {
  classId: string;
  classGrade: string;
  existingNames: string[];
  onClose: () => void;
  onStudentsAdded?: () => void;
}

const BulkAddStudents = ({
  classId,
  classGrade,
  existingNames,
  onClose,
  onStudentsAdded,
}: BulkAddStudentsProps) => {
  const [rawText, setRawText] = useState("");
  const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const existingNamesLower = useMemo(() => new Set(existingNames.map(n => n.toLowerCase())), [existingNames]);

  // Parse names from textarea
  const parsedNames = useMemo(() => {
    return rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [rawText]);

  const duplicateNames = parsedNames.filter(n => existingNamesLower.has(n.toLowerCase()));
  const uniqueNewNames = parsedNames.filter(n => !existingNamesLower.has(n.toLowerCase()));
  const allowedCount = uniqueNewNames.length;

  // Build preview list with avatars
  const previewStudents: ParsedStudent[] = useMemo(() => {
    return uniqueNewNames.map((name) => ({
      name,
      avatar: avatarOverrides[name] ?? randomAvatar(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueNewNames.join("\n")]);

  // Apply overrides
  const studentsWithOverrides = previewStudents.map((s) => ({
    ...s,
    avatar: avatarOverrides[s.name] ?? s.avatar,
  }));

  const randomizeAll = useCallback(() => {
    const overrides: Record<string, string> = {};
    uniqueNewNames.forEach((name) => {
      overrides[name] = randomAvatar();
    });
    setAvatarOverrides(overrides);
  }, [uniqueNewNames]);

  const cycleAvatar = (name: string, current: string) => {
    setAvatarOverrides((prev) => ({ ...prev, [name]: nextAvatar(current) }));
  };

  const bulkInsert = useMutation({
    mutationFn: async () => {
      const toInsert = studentsWithOverrides.slice(0, allowedCount).map((s) => ({
        class_id: classId,
        name: s.name,
        username: s.name,
        grade: classGrade,
        avatar: s.avatar,
      }));
      if (toInsert.length === 0) throw new Error("No students to add");
      const { error } = await (supabase as any).from("students").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-stats"] });
      toast.success(`${allowedCount} student${allowedCount !== 1 ? "s" : ""} added!`);
      onStudentsAdded?.();
      onClose();
    },
    onError: (err: any) => {
      const isDuplicate = err?.message?.includes("duplicate") || err?.code === "23505";
      toast.error(isDuplicate ? "A student with that name already exists in this class. Each student name must be unique within the same class." : err.message);
    },
  });

  return (
    <div className="p-5 rounded-xl bg-card border border-border shadow-card mb-4 space-y-4" data-onboarding="bulk-add-area">
      <div>
        <Label className="text-sm font-semibold">Add Students Usernames (One Per Line)</Label>
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={"AJ1\nTB1\nDK1"}
          rows={5}
          className="mt-1.5 font-mono text-sm"
        />
      </div>

      {/* Duplicate names warning */}
      {duplicateNames.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              {duplicateNames.length} duplicate name{duplicateNames.length !== 1 ? "s" : ""} skipped
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Already in this class: {duplicateNames.join(", ")}
            </p>
          </div>
        </div>
      )}


      {/* Preview list */}
      {parsedNames.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Preview ({allowedCount} student{allowedCount !== 1 ? "s" : ""})
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={randomizeAll}
            >
              <Sparkles className="w-3.5 h-3.5" /> Randomize All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto p-1 rounded-lg border border-border/50">
            {studentsWithOverrides.slice(0, allowedCount).map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40"
              >
                <button
                  type="button"
                  onClick={() => cycleAvatar(s.name, s.avatar)}
                  className="text-xl hover:scale-110 transition-transform cursor-pointer"
                  title="Click to change avatar"
                >
                  {s.avatar}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">@{s.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => bulkInsert.mutate()}
          disabled={allowedCount === 0 || bulkInsert.isPending}
        >
          {bulkInsert.isPending ? "Adding…" : `Add ${allowedCount} Student${allowedCount !== 1 ? "s" : ""}`}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default BulkAddStudents;
