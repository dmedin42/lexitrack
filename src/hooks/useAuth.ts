import { useState, useEffect, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/hooks/useDemo";

export type AppRole = "teacher" | "caregiver";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth() {
  const { isDemo, disableDemo } = useDemo();

  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    loading: !isDemo,
  });

  const fetchRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("Failed to fetch user role:", error.message);
        return null;
      }
      return (data?.role as AppRole) ?? null;
    } catch (e) {
      console.warn("Error fetching role:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const user = session?.user ?? null;
        let role: AppRole | null = null;
        if (user) {
          // Use setTimeout to avoid Supabase deadlock between auth and DB calls
          setTimeout(async () => {
            if (!mounted) return;
            role = await fetchRole(user.id);
            setState({ session, user, role, loading: false });
          }, 0);
        } else {
          setState({ session: null, user: null, role: null, loading: false });
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      let role: AppRole | null = null;
      if (user) {
        role = await fetchRole(user.id);
      }
      setState({ session, user, role, loading: false });
    }).catch(() => {
      if (mounted) {
        setState({ session: null, user: null, role: null, loading: false });
      }
    });

    // Safety timeout — never stay loading forever
    const timeout = setTimeout(() => {
      if (mounted) {
        setState(prev => prev.loading ? { ...prev, loading: false } : prev);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signOut = useCallback(async () => {
    if (isDemo) {
      disableDemo();
      return;
    }
    await supabase.auth.signOut();
  }, [isDemo, disableDemo]);

  // In demo mode, return a fake teacher user
  if (isDemo) {
    return {
      session: null,
      user: { id: "demo-teacher" } as User,
      role: "teacher" as AppRole,
      loading: false,
      signOut,
    };
  }

  return { ...state, signOut };
}
