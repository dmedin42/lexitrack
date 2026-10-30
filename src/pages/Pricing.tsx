import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import lexitrackLogo from "@/assets/lexitrack-logo.png";
import { STRIPE_PUBLISHABLE_KEY as PUBLISHABLE_KEY, STRIPE_PRICING_TABLE_ID as PRICING_TABLE_ID } from "@/lib/stripe-config";


const Pricing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const scriptLoaded = useRef(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  // Load Stripe pricing table script once
  useEffect(() => {
    if (scriptLoaded.current) return;
    const existing = document.querySelector(
      'script[src="https://js.stripe.com/v3/pricing-table.js"]'
    );
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

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src={lexitrackLogo} alt="LexiTrack" className="h-9 w-auto" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-3">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Unlock unlimited students, passages, and advanced analytics with
            LexiTrack Pro — or start free and upgrade anytime.
          </p>
        </div>

        <div className="w-[95vw] max-w-5xl rounded-xl overflow-hidden [&>stripe-pricing-table]:block mb-8">
          {/* @ts-ignore – Stripe custom element */}
          <stripe-pricing-table
            pricing-table-id={PRICING_TABLE_ID}
            publishable-key={PUBLISHABLE_KEY}
            client-reference-id={user?.id || ""}
            customer-email={user?.email || ""}
          />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Shield className="h-3.5 w-3.5" />
          <span>Safe &amp; Secure via Stripe</span>
        </div>

        <Button
          variant="ghost"
          size="lg"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/", { replace: true })}
        >
          Skip for now — Try Free Tier <ArrowRight className="w-4 h-4" />
        </Button>
      </main>
    </div>
  );
};

export default Pricing;
