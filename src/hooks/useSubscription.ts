import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";

export function useSubscription() {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const queryClient = useQueryClient();

  const queryKey = ["subscription-status", user?.id];

  const { data: subscriptionStatus, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return "free";
      const { data, error } = await (supabase as any)
        .from("teachers")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      if (error || !data) return "free";
      return (data.subscription_status as string) ?? "free";
    },
    enabled: !!user?.id && !isDemo,
    staleTime: 5_000,
    refetchInterval: 30_000,
  });

  // Re-fetch on window focus (portal return) and ?upgraded=true
  useEffect(() => {
    if (!user?.id || isDemo) return;

    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") handleFocus();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Check for upgraded param
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      queryClient.invalidateQueries({ queryKey });
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id, isDemo, queryClient]);

  const isPro = isDemo || subscriptionStatus === "pro" || subscriptionStatus === "active";

  return { isPro, subscriptionStatus: subscriptionStatus ?? "free", isLoading };
}
