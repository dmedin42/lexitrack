import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionSectionProps {
  isPro: boolean;
  subscriptionStatus: string;
  onUpgrade: () => void;
}



const SubscriptionSection = ({ isPro, subscriptionStatus, onUpgrade }: SubscriptionSectionProps) => {
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-link");
      if (error) throw error;
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      if (parsed?.url) {
        window.location.href = parsed.url;
      } else {
        throw new Error(parsed?.error || "Failed to generate portal link");
      }
    } catch (err: any) {
      toast.error("Could not open subscription portal", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border shadow-card mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Subscription</h3>
            <p className="text-xs text-muted-foreground">
              {isPro ? "You have unlimited access." : "Upgrade to unlock all features."}
            </p>
          </div>
          {isPro ? (
            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">
              Pro Plan
            </Badge>
          ) : (
            <Badge variant="secondary">Free Plan</Badge>
          )}
        </div>

        <div>
          {!isPro && (
            <Button size="sm" onClick={onUpgrade} className="gap-1.5">
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSection;
