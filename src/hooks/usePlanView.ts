import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useCallback } from "react";

export function usePlanView() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const queryClient = useQueryClient();

  const queryKey = ["has-seen-plans", user?.id];

  const enabled = !!user?.id && !isDemo;

  const { data: hasSeenPlans, isLoading: queryLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await (supabase as any)
        .from("teachers")
        .select("has_seen_plans")
        .eq("id", user.id)
        .single();
      if (error || !data) return 0;
      return (data.has_seen_plans as number) ?? 0;
    },
    enabled,
    staleTime: 60_000,
  });

  // Consider loading if query is enabled but still fetching, OR if user hasn't loaded yet
  const isLoading = enabled ? queryLoading : !isDemo;
  const incrementPlanView = useCallback(async () => {
    if (!user?.id || isDemo) return;
    await (supabase as any).rpc("increment_plan_view", { t_id: user.id });
    queryClient.setQueryData(queryKey, (prev: number | undefined) => (prev ?? 0) + 1);
  }, [user?.id, isDemo, queryClient]);

  return {
    hasSeenPlans: isDemo ? 1 : (hasSeenPlans ?? 0),
    isLoading,
    incrementPlanView,
  };
}
