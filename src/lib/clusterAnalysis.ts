import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordRow {
  error_type: string;
}

interface StudentPattern {
  studentId: string;
  dominantPattern: string | null;
  severity: "high" | "medium" | "low";
}

interface ClusterDef {
  error_pattern: string;
  severity: "high" | "medium" | "low";
  suggested_activity: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLUSTER_DEFS: Record<string, Omit<ClusterDef, "severity">> = {
  "Omission Errors": {
    error_pattern: "Omission Errors",
    description: "Students who frequently skip words while reading.",
    suggested_activity:
      "Practice echo reading — have students repeat each sentence line by line.",
  },
  Mispronunciation: {
    error_pattern: "Mispronunciation",
    description: "Students struggling with correct phoneme production.",
    suggested_activity:
      "Focus on phoneme isolation drills for the target sounds. Use mirrors for mouth position.",
  },
  "Substitution Errors": {
    error_pattern: "Substitution Errors",
    description: "Students who replace words with different words while reading.",
    suggested_activity:
      "Guided re-reading with a finger tracker. Slow down and point to each word.",
  },
  "Insertion Errors": {
    error_pattern: "Insertion Errors",
    description: "Students who add extra words not present in the passage.",
    suggested_activity:
      "Practice tracking print with a pointer. Read with the student to model pace.",
  },
  "Strong Reader": {
    error_pattern: "Strong Reader",
    description: "Students with fewer than 5% total errors — on track or exceeding expectations.",
    suggested_activity:
      "Offer extension passages at the next grade level to maintain engagement.",
  },
};

// ─── Core analysis helpers ────────────────────────────────────────────────────

function classifyStudent(words: WordRow[]): StudentPattern["dominantPattern"] | null {
  if (words.length === 0) return null;

  const total = words.length;
  const counts: Record<string, number> = {
    omission: 0,
    mispronunciation: 0,
    substitution: 0,
    insertion: 0,
    correct: 0,
  };

  for (const w of words) {
    const t = (w.error_type ?? "correct").toLowerCase();
    if (t in counts) counts[t]++;
    else counts.correct++;
  }

  const pct = (k: string) => counts[k] / total;
  const errorTotal = total - counts.correct;
  const errorPct = errorTotal / total;

  // Strong reader check first
  if (errorPct < 0.05) return "Strong Reader";

  // Collect triggered patterns (can be multiple; pick dominant)
  const triggered: { pattern: string; pct: number }[] = [];
  if (pct("omission") > 0.15) triggered.push({ pattern: "Omission Errors", pct: pct("omission") });
  if (pct("mispronunciation") > 0.20) triggered.push({ pattern: "Mispronunciation", pct: pct("mispronunciation") });
  if (pct("substitution") > 0.15) triggered.push({ pattern: "Substitution Errors", pct: pct("substitution") });
  if (pct("insertion") > 0.10) triggered.push({ pattern: "Insertion Errors", pct: pct("insertion") });

  if (triggered.length === 0) return null;

  // Return the pattern with the highest percentage
  triggered.sort((a, b) => b.pct - a.pct);
  return triggered[0].pattern;
}

function getSeverity(pattern: string, words: WordRow[]): "high" | "medium" | "low" {
  if (words.length === 0) return "low";
  const total = words.length;
  const pct = (k: string) => words.filter(w => w.error_type?.toLowerCase() === k).length / total;

  if (pattern === "Omission Errors") return pct("omission") > 0.25 ? "high" : "medium";
  if (pattern === "Mispronunciation") return pct("mispronunciation") > 0.30 ? "high" : "medium";
  if (pattern === "Substitution Errors") return pct("substitution") > 0.25 ? "high" : "medium";
  return "low";
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Run after every assessment save.
 * Reads all students in the class, loads their most recent word_assessments,
 * groups them by dominant error pattern, then rewrites intervention_clusters.
 */
export async function runClusterAnalysis(
  triggeringStudentId: string,
  classId: string,
  triggeringWords: WordRow[]
): Promise<void> {
  try {
    // 1. Fetch all students in the class
    const { data: students, error: sErr } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", classId);
    if (sErr) throw sErr;
    if (!students || students.length === 0) return;

    // 2. For each student, load their most recent word_assessments
    const studentPatterns: StudentPattern[] = [];

    await Promise.all(
      students.map(async (s) => {
        let words: WordRow[];

        if (s.id === triggeringStudentId) {
          // Use in-memory data for the just-assessed student
          words = triggeringWords;
        } else {
          // Fetch latest assessment id for this student
          const { data: latest } = await supabase
            .from("assessments")
            .select("id")
            .eq("student_id", s.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!latest) return;

          const { data: wa } = await supabase
            .from("word_assessments")
            .select("error_type")
            .eq("assessment_id", latest.id);

          words = (wa ?? []) as WordRow[];
        }

        const pattern = classifyStudent(words);
        if (!pattern) return;

        studentPatterns.push({
          studentId: s.id,
          dominantPattern: pattern,
          severity: getSeverity(pattern, words),
        });
      })
    );

    if (studentPatterns.length === 0) return;

    // 3. Group students by pattern
    const byPattern = new Map<string, { studentIds: string[]; severities: ("high" | "medium" | "low")[] }>();
    for (const sp of studentPatterns) {
      if (!sp.dominantPattern) continue;
      if (!byPattern.has(sp.dominantPattern)) {
        byPattern.set(sp.dominantPattern, { studentIds: [], severities: [] });
      }
      byPattern.get(sp.dominantPattern)!.studentIds.push(sp.studentId);
      byPattern.get(sp.dominantPattern)!.severities.push(sp.severity);
    }

    // 4. Delete old auto-generated clusters for this class
    const { error: delErr } = await supabase
      .from("intervention_clusters")
      .delete()
      .eq("class_id", classId);
    if (delErr) throw delErr;

    // 5. Insert new clusters
    const clusterInserts: any[] = [];
    for (const [pattern, { severities }] of byPattern.entries()) {
      const def = CLUSTER_DEFS[pattern];
      if (!def) continue;
      // Pick the highest severity among students in the group
      const severity =
        severities.includes("high") ? "high" :
        severities.includes("medium") ? "medium" : "low";

      clusterInserts.push({
        class_id: classId,
        error_pattern: def.error_pattern,
        description: def.description,
        severity,
        suggested_activity: def.suggested_activity,
      });
    }

    if (clusterInserts.length === 0) return;

    const { data: insertedClusters, error: cErr } = await supabase
      .from("intervention_clusters")
      .insert(clusterInserts)
      .select("id, error_pattern");
    if (cErr) throw cErr;

    // 6. Insert cluster_students join rows
    const csRows: any[] = [];
    for (const ic of insertedClusters ?? []) {
      const group = byPattern.get(ic.error_pattern);
      if (!group) continue;
      for (const sid of group.studentIds) {
        csRows.push({ cluster_id: ic.id, student_id: sid });
      }
    }

    if (csRows.length > 0) {
      const { error: csErr } = await supabase.from("cluster_students").insert(csRows);
      if (csErr) throw csErr;
    }

    console.log(`✅ [Clusters] Wrote ${insertedClusters?.length ?? 0} clusters for class ${classId}`);
  } catch (err) {
    // Non-fatal: don't surface cluster errors to the user
    console.error("⚠️ [Clusters] Analysis failed (non-fatal):", err);
  }
}
