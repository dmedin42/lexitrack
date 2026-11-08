import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useDemo } from "@/hooks/useDemo";
import { demoPassages } from "@/data/demoData";

export interface DbPassage {
  id: string;
  title: string;
  content: string;
  word_count: number;
  grade_level: string | null;
  created_at: string | null;
  teacher_id: string | null;
}

export function usePassages() {
  const { isDemo } = useDemo();
  return useQuery({
    queryKey: ["passages"],
    queryFn: async () => {
      if (isDemo) return demoPassages;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase
        .from("passages")
        .select("*") as any)
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DbPassage[]) ?? [];
    },
  });
}

export function useCreatePassage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (passage: { title: string; content: string; grade_level?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const wordCount = passage.content.trim().split(/\s+/).filter(Boolean).length;
      const { data, error } = await supabase
        .from("passages")
        .insert({
          title: passage.title,
          content: passage.content,
          word_count: wordCount,
          grade_level: passage.grade_level || null,
          teacher_id: user.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passages"] });
    },
  });
}

export function useUpdatePassage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; grade_level?: string }) => {
      const updateData: any = { ...updates };
      if (updates.content) {
        updateData.word_count = updates.content.trim().split(/\s+/).filter(Boolean).length;
      }
      const { data, error } = await supabase
        .from("passages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passages"] });
    },
  });
}

export function useDeletePassage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("passages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passages"] });
    },
  });
}
