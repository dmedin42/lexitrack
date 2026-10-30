import { useEffect, useRef } from "react";
import { Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { usePlanView } from "@/hooks/usePlanView";
import { STRIPE_PUBLISHABLE_KEY as PUBLISHABLE_KEY, STRIPE_PRICING_TABLE_ID as PRICING_TABLE_ID } from "@/lib/stripe-config";

interface UpgradeProModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: "students" | "passages";
}


const UpgradeProModal = ({ open, onOpenChange, trigger }: UpgradeProModalProps) => {
  const { user } = useAuth();
  const { incrementPlanView } = usePlanView();
  const scriptLoaded = useRef(false);
  const prevOpen = useRef(false);

  // Increment view counter every time the modal opens
  useEffect(() => {
    if (open && !prevOpen.current) {
      incrementPlanView();
    }
    prevOpen.current = open;
  }, [open, incrementPlanView]);

  // Load Stripe pricing table script once
  useEffect(() => {
    if (scriptLoaded.current) return;
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]');
    if (existing) {
      scriptLoaded.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.head.appendChild(script);
    scriptLoaded.current = true;
  }, []);

  const triggerMessage =
    trigger === "students"
      ? ""
      : trigger === "passages"
        ? "You've reached the free plan limit of 10 passages."
        : "Upgrade to unlock the full experience.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] rounded-2xl p-8 overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-2xl font-extrabold">Choose Your Plan</DialogTitle>
          {triggerMessage && (
            <DialogDescription className="text-base">{triggerMessage}</DialogDescription>
          )}
        </DialogHeader>

        <div className="my-4 rounded-xl overflow-hidden [&>stripe-pricing-table]:block min-h-[520px]">
          {/* @ts-ignore – Stripe custom element */}
          <stripe-pricing-table
            pricing-table-id={PRICING_TABLE_ID}
            publishable-key={PUBLISHABLE_KEY}
            client-reference-id={user?.id || ""}
            customer-email={user?.email || ""}
          />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-2">
          <Shield className="h-3.5 w-3.5" />
          <span>Safe &amp; Secure via Stripe</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeProModal;
