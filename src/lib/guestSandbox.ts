import { supabase } from "@/lib/supabase/client";

/**
 * Starts the guest sandbox: an anonymous Supabase session. The database signup
 * trigger turns it into a guest teacher with a sample class, students and
 * reading history, so every feature works on real data. Guest accounts are
 * deleted automatically after 24 hours.
 */
export async function startGuestSandbox(): Promise<{ error: string | null }> {
  // Leaving the old read-only demo mode, if it was ever turned on in this tab.
  try {
    sessionStorage.removeItem("lexitrack-demo");
  } catch {
    /* storage unavailable */
  }
  const { error } = await supabase.auth.signInAnonymously();
  return { error: error?.message ?? null };
}
