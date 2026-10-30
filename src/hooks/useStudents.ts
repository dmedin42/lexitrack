import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { demoClasses, demoStudents, getDemoAssessmentsForStudent, isDemoId } from "@/data/demoData";
import { useDemo } from "@/hooks/useDemo";

export interface DbStudent {
  id: string;
  class_id: string;
  name: string;
  grade: string;
  avatar: string;
  goal_wpm: number | null;
  goal_date: string | null;
  username: string | null;
  student_password: string | null;
}

export interface DbClass {
  id: string;
  teacher_id: string;
  name: string;
  grade: string;
  school_year: string;
  benchmark_wpm: number;
}

export function useClasses() {
  const { isDemo } = useDemo();
  return useQuery({
    queryKey: ["classes", isDemo],
    queryFn: async () => {
      if (isDemo) return demoClasses;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", user.id);
      if (error) throw error;
      return (data as DbClass[]) ?? [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useStudents(classId?: string) {
  const { isDemo } = useDemo();
  return useQuery({
    queryKey: ["students", classId, isDemo],
    queryFn: async () => {
      if (isDemo && classId && isDemoId(classId)) {
        return demoStudents.filter(s => s.class_id === classId);
      }
      if (isDemo) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let q = supabase
        .from("students")
        .select("*, classes!inner(teacher_id)")
        .eq("classes.teacher_id", user.id);
      if (classId) q = q.eq("class_id", classId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as DbStudent[];
    },
    enabled: !!classId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}


export function useStudentWithAssessments(studentId: string) {
  return useQuery({
    queryKey: ["student-detail", studentId],
    queryFn: async () => {
      if (isDemoId(studentId)) {
        const student = demoStudents.find(s => s.id === studentId);
        if (!student) throw new Error("Student not found");
        const cls = demoClasses.find(c => c.id === student.class_id);
        const assessments = getDemoAssessmentsForStudent(studentId);
        return {
          student,
          benchmarkWPM: cls?.benchmark_wpm ?? 90,
          assessments,
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: student, error: sErr } = await supabase
        .from("students")
        .select("*, classes!inner(teacher_id, benchmark_wpm)")
        .eq("id", studentId)
        .eq("classes.teacher_id", user.id)
        .single();
      if (sErr) throw sErr;

      const cls = (student as any).classes;

      // Fetch class-level enable_retell flag
      const { data: classSettings } = await (supabase as any)
        .from("classes")
        .select("enable_retell")
        .eq("id", (student as any).class_id)
        .single();

      const { data: assessments, error: aErr } = await supabase
        .from("assessments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (aErr) throw aErr;

      return {
        student: student as unknown as DbStudent,
        benchmarkWPM: cls?.benchmark_wpm ?? 80,
        assessments: assessments ?? [],
        enableRetell: classSettings?.enable_retell ?? false,
      };
    },
    enabled: !!studentId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
