import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Sparkles, Mic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TryItYourselfSandbox = lazy(() => import("@/components/TryItYourselfSandbox"));

/** Only mounts children when the sentinel enters the viewport */
function LazySection({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref}>{visible ? children : (fallback ?? <div className="min-h-[300px]" />)}</div>;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const features = [
  { emoji: "📸", title: "Zero Prep", description: "Snap-to-Read setup removes the manual stopwatch struggle." },
  { emoji: "⏱️", title: "Peace in 60s", description: "Verify you're doing a great job and identify phonics gaps instantly." },
  { emoji: "📄", title: "Portfolio Ready", description: "Generate tangible proof of growth for evaluators automatically." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const CHECKOUT_URL = "https://buy.stripe.com/aFa5kFdvM3cqgZieW6bwk00";

function handleCheckout() {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", { value: 0.99, currency: "USD" });
  }
  window.open(CHECKOUT_URL, "_blank", "noopener");
}

export default function HomeWaitlist() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">LexiTrack Home</span>
          </Link>
          <Badge variant="secondary" className="text-xs font-medium">Coming Soon</Badge>
        </div>
      </header>

      {/* Hero + CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge className="mb-6 bg-accent/15 text-accent border-accent/30 hover:bg-accent/20">
              <Sparkles className="w-3 h-3 mr-1" /> For Homeschool Families
            </Badge>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight mb-6"
          >
            Become a Founding Parent for $1.
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Lock in lifetime access and help us build the future of reading assessment.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Button size="lg" onClick={handleCheckout} className="text-base px-8 py-6 gap-2">
              Pre-order for $1 <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-6 bg-secondary/40">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display font-bold text-2xl sm:text-3xl text-foreground mb-4"
          >
            The 1-Minute AI Reading Assessment
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground font-medium"
          >
            Zero Stopwatches. Zero Manual Logs. Zero Guilt.
          </motion.p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-display font-bold text-2xl text-foreground text-center mb-10"
          >
            How It Works
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="border-border h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <span className="text-3xl mb-3 block">{f.emoji}</span>
                    <h3 className="font-display font-bold text-foreground text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Try It Yourself */}
      <LazySection fallback={<div className="min-h-[400px] py-16 px-6 bg-secondary/40" />}>
        <section className="py-16 px-6 bg-secondary/40">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Mic className="w-3 h-3 mr-1" /> Live Demo
              </Badge>
              <h2 className="font-display font-bold text-2xl text-foreground mb-3">Try It Yourself</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                See how LexiTrack analyzes reading in real time. Read the passage below out loud and get instant results.
              </p>
            </motion.div>
            <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading demo…</div>}>
              <TryItYourselfSandbox />
            </Suspense>
          </div>
        </section>
      </LazySection>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LexiTrack ·{" "}
          <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link> ·{" "}
          <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
        </p>
      </footer>
    </div>
  );
}
