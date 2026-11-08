import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

const BC_CHANNEL_NAME = "lexitrack-assessment-sync";
const RT_CHANNEL_NAME = "class-room";

export interface AssessmentBroadcastPayload {
  student_id: string;
  student_name: string;
  accuracy_score: number;
  wpm: number;
  assessment_id?: string;
}

/**
 * Broadcast assessment results via BroadcastChannel (same-browser)
 * AND Supabase Realtime (cross-browser / cross-device).
 */
export function notifyAssessmentSaved(
  studentId: string,
  assessmentId?: string,
  extras?: { studentName?: string; accuracy?: number; wpm?: number }
) {
  // BroadcastChannel — instant same-browser
  try {
    const bc = new BroadcastChannel(BC_CHANNEL_NAME);
    bc.postMessage({ type: "assessment-saved", studentId, assessmentId, ...extras });
    bc.close();
  } catch (_) {}

  // Supabase Realtime broadcast — cross-device
  const payload: AssessmentBroadcastPayload = {
    student_id: studentId,
    student_name: extras?.studentName ?? "A student",
    accuracy_score: extras?.accuracy ?? 0,
    wpm: extras?.wpm ?? 0,
    assessment_id: assessmentId,
  };
  supabase
    .channel(RT_CHANNEL_NAME)
    .send({ type: "broadcast", event: "new-submission", payload })
    .catch(() => {});
}

/**
 * Teacher-side sync hook.
 *
 * Listens to Supabase Realtime for changes on assessments, word_assessments,
 * students, and classes tables. Invalidates the relevant query caches so
 * the teacher UI stays up-to-date without polling.
 *
 * IMPORTANT: The tables must be added to supabase_realtime publication:
 *   ALTER PUBLICATION supabase_realtime ADD TABLE public.assessments;
 *   ALTER PUBLICATION supabase_realtime ADD TABLE public.word_assessments;
 *   ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
 *   ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("teacher-sync")
      // Assessments — new or updated
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assessments" },
        (payload) => {
          const studentId = (payload.new as any)?.student_id as string | undefined;
          console.log("📡 Realtime: assessments change for student", studentId);
          if (studentId) {
            queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
            queryClient.invalidateQueries({ queryKey: ["student-card-assessments", studentId] });
          }
          queryClient.invalidateQueries({ queryKey: ["word-assessments"], exact: false });
          queryClient.invalidateQueries({ queryKey: ["class-stats"], exact: false });
          queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
          queryClient.invalidateQueries({ queryKey: ["clusters"], exact: false });
        }
      )
      // Word assessments
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "word_assessments" },
        (payload) => {
          const assessmentId = (payload.new as any)?.assessment_id as string | undefined;
          console.log("📡 Realtime: word_assessments change", assessmentId);
          if (assessmentId) {
            queryClient.invalidateQueries({ queryKey: ["word-assessments", assessmentId] });
          }
          queryClient.invalidateQueries({ queryKey: ["word-assessments"], exact: false });
        }
      )
      // Students — added, removed, updated
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        (payload) => {
          const classId = (payload.new as any)?.class_id ?? (payload.old as any)?.class_id;
          console.log("📡 Realtime: students change, class", classId);
          queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
          if (classId) {
            queryClient.invalidateQueries({ queryKey: ["class-stats", classId] });
          }
        }
      )
      // Classes — created, updated, deleted
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        () => {
          console.log("📡 Realtime: classes change");
          queryClient.invalidateQueries({ queryKey: ["classes"] });
        }
      )
      // Active assignments — assigned, toggled, removed
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "active_assignments" },
        () => {
          console.log("📡 Realtime: active_assignments change");
          queryClient.invalidateQueries({ queryKey: ["active-assignments"], exact: false });
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);
      });

    // Supabase Realtime broadcast — cross-device "new-submission" from students
    const broadcastChannel = supabase
      .channel(RT_CHANNEL_NAME)
      .on("broadcast", { event: "new-submission" }, (msg) => {
        const p = msg.payload as AssessmentBroadcastPayload;
        console.log("📡 Broadcast: new submission from", p.student_name);
        toast({
          title: "📥 New Submission",
          description: `${p.student_name} just submitted — ${p.wpm} WPM, ${p.accuracy_score}% accuracy`,
        });
        if (p.student_id) {
          queryClient.invalidateQueries({ queryKey: ["student-detail", p.student_id] });
          queryClient.invalidateQueries({ queryKey: ["student-card-assessments", p.student_id] });
        }
        queryClient.invalidateQueries({ queryKey: ["class-stats"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
      })
      .subscribe();

    // BroadcastChannel — same-browser instant ping
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BC_CHANNEL_NAME);
      bc.onmessage = (event) => {
        const { studentId, studentName, accuracy, wpm } = event.data ?? {};
        console.log("📡 BroadcastChannel: assessment saved for student", studentId);
        if (studentName) {
          toast({
            title: "📥 New Submission",
            description: `${studentName} just submitted — ${wpm ?? 0} WPM, ${accuracy ?? 0}% accuracy`,
          });
        }
        if (studentId) {
          queryClient.invalidateQueries({ queryKey: ["student-detail", studentId] });
          queryClient.invalidateQueries({ queryKey: ["student-card-assessments", studentId] });
          queryClient.invalidateQueries({ queryKey: ["word-assessments"], exact: false });
        }
        queryClient.invalidateQueries({ queryKey: ["class-stats"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
      };
    } catch (_) {
      // BroadcastChannel unavailable
    }

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
      bc?.close();
    };
  }, [queryClient]);
}
