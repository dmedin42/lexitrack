import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDemoId, demoClusters } from "@/data/demoData";

export interface DbCluster {
  id: string;
  class_id: string;
  error_pattern: string;
  description: string | null;
  severity: "high" | "medium" | "low";
  suggested_activity: string | null;
}

export interface DbClusterWithStudents extends DbCluster {
  studentIds: string[];
  studentNames: { id: string; name: string; avatar: string }[];
}

export function useClusters(classId?: string) {
  return useQuery({
    queryKey: ["clusters", classId],
    queryFn: async () => {
      if (classId && isDemoId(classId)) {
        return demoClusters.filter(c => c.class_id === classId);
      }

      let q = supabase.from("intervention_clusters").select("*");
      if (classId) q = q.eq("class_id", classId);
      const { data: clusters, error } = await q;
      if (error) throw error;

      const clusterIds = (clusters ?? []).map(c => c.id);
      if (clusterIds.length === 0) return [];

      const { data: links } = await supabase
        .from("cluster_students")
        .select("cluster_id, student_id")
        .in("cluster_id", clusterIds);

      const studentIds = [...new Set((links ?? []).map(l => l.student_id))];
      const { data: students } = await supabase
        .from("students")
        .select("id, name, avatar")
        .in("id", studentIds.length > 0 ? studentIds : ["__none__"]);

      const studentMap = new Map((students ?? []).map(s => [s.id, s]));

      return (clusters ?? []).map(c => {
        const sIds = (links ?? []).filter(l => l.cluster_id === c.id).map(l => l.student_id);
        return {
          ...c,
          studentIds: sIds,
          studentNames: sIds.map(id => studentMap.get(id)).filter(Boolean) as { id: string; name: string; avatar: string }[],
        } as DbClusterWithStudents;
      });
    },
    enabled: !!classId,
  });
}
