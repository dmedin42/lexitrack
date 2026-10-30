import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveAssignment {
  id: string;
  student_id: string;
  passage_id: string;
  assigned_by: string | null;
  is_open: boolean;
  word_map_enabled: boolean;
  deep_dive_enabled: boolean;
  assigned_at: string | null;
}

export interface AssignmentWithPassage extends ActiveAssignment {
  passage_title?: string;
  passage_content?: string;
  student_name?: string;
  student_avatar?: string;
  username?: string | null;
}

export function useActiveAssignments(classId: string | null) {
  return useQuery<AssignmentWithPassage[]>({
    queryKey: ["active-assignments", classId],
    queryFn: async () => {
      if (!classId) return [];

      // Get students for this class
      const { data: students, error: sErr } = await (supabase as any)
        .from("students")
        .select("id, name, avatar, username")
        .eq("class_id", classId);
      if (sErr) throw sErr;
      if (!students || students.length === 0) return [];

      const studentIds = (students as any[]).map((s: any) => s.id);
      const studentMap = new Map((students as any[]).map((s: any) => [s.id, s]));

      // Get assignments for those students
      const { data: assignments, error: aErr } = await (supabase as any)
        .from("active_assignments")
        .select("*")
        .in("student_id", studentIds);
      if (aErr) throw aErr;
      if (!assignments || assignments.length === 0) return [];

      // Get unique passage IDs and fetch passages
      const passageIds = [...new Set((assignments as any[]).map((a: any) => a.passage_id))];
      const { data: passages, error: pErr } = await supabase
        .from("passages")
        .select("id, title, content")
        .in("id", passageIds);
      if (pErr) throw pErr;
      const passageMap = new Map((passages ?? []).map(p => [p.id, p]));

      return (assignments as any[]).map((row: any) => {
        const student = studentMap.get(row.student_id);
        const passage = passageMap.get(row.passage_id);
        return {
          id: row.id,
          student_id: row.student_id,
          passage_id: row.passage_id,
          assigned_by: row.assigned_by,
          is_open: row.is_open,
          word_map_enabled: row.word_map_enabled,
          deep_dive_enabled: row.deep_dive_enabled,
          assigned_at: row.assigned_at,
          passage_title: passage?.title,
          passage_content: passage?.content,
          student_name: student?.name,
          student_avatar: student?.avatar,
          username: student?.username,
        };
      });
    },
    enabled: !!classId,
  });
}

export function useAssignStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentIds,
      passageId,
      assignedBy,
      wordMapEnabled = false,
      deepDiveEnabled = false,
    }: {
      studentIds: string[];
      passageId: string;
      assignedBy: string;
      wordMapEnabled?: boolean;
      deepDiveEnabled?: boolean;
    }) => {
      const rows = studentIds.map(student_id => ({
        student_id,
        passage_id: passageId,
        assigned_by: assignedBy,
        is_open: true,
        word_map_enabled: wordMapEnabled,
        deep_dive_enabled: deepDiveEnabled,
      }));
      const { error } = await (supabase as any)
        .from("active_assignments")
        .upsert(rows, { onConflict: "student_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-assignments"] });
    },
  });
}

export function useCloseAllAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string) => {
      const { data: students, error: sErr } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", classId);
      if (sErr) throw sErr;
      const ids = (students ?? []).map(s => s.id);
      if (ids.length === 0) return;
      const { error } = await (supabase as any)
        .from("active_assignments")
        .update({ is_open: false })
        .in("student_id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-assignments"] });
    },
  });
}

export function useToggleAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      updates,
    }: {
      assignmentId: string;
      updates: Partial<Pick<ActiveAssignment, "is_open" | "word_map_enabled" | "deep_dive_enabled">>;
    }) => {
      const { error } = await (supabase as any)
        .from("active_assignments")
        .update(updates)
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-assignments"] });
    },
  });
}

export function useRemoveAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await (supabase as any)
        .from("active_assignments")
        .delete()
        .eq("student_id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-assignments"] });
    },
  });
}
