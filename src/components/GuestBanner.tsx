import { useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/** Shown on every teacher page while someone is exploring Sandbox Mode. */
const GuestBanner = () => {
  const [leaving, setLeaving] = useState(false);

  const createAccount = async () => {
    setLeaving(true);
    // The sandbox class is a throwaway demo, so signing out simply discards it.
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="w-full bg-primary text-primary-foreground" role="status">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        <span className="flex items-center gap-2 text-center">
          <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
          You're in Sandbox Mode as a guest teacher. Try anything; it resets after 24 hours.
        </span>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 rounded-full px-3 text-xs"
          onClick={createAccount}
          disabled={leaving}
        >
          {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Create a free account"}
        </Button>
      </div>
    </div>
  );
};

export default GuestBanner;
