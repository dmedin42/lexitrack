import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Play,
  Mic,
  BarChart3,
  Users,
  Brain,
  CheckCircle2,
  ArrowRight,
  Star,
  Shield,
  Zap,
  GraduationCap,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TryItYourselfSandbox from "@/components/TryItYourselfSandbox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LaunchInterestSection from "@/components/LaunchInterestSection";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import lexitrackLogo from "@/assets/lexitrack-logo.png";

type AuthMode = "login" | "signup";
type RoleChoice = "teacher" | "caregiver";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    icon: Mic,
    title: "AI-Powered Listening",
    description: "Students read aloud and our AI instantly assesses pronunciation, fluency, and accuracy in real time.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: BarChart3,
    title: "Live Progress Dashboards",
    description:
      "Track WPM, accuracy trends, and reading levels with beautiful charts that update after every session.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Brain,
    title: "Error Pattern Insights",
    description: "Automatically detect substitution, omission, and mispronunciation patterns to target instruction.",
    color: "bg-destructive/10 text-destructive",
  },
  {
    icon: Users,
    title: "Cluster Grouping",
    description: "AI groups students by similar reading profiles so you can differentiate instruction effortlessly.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: GraduationCap,
    title: "Student Portal",
    description: "Kids log in with a simple class code—no passwords. Fun, accessible interface built for K-6 learners.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Shield,
    title: "Caregiver Reports",
    description: "Share secure, beautiful progress reports with parents via a simple link. Keep families in the loop.",
    color: "bg-primary/10 text-primary",
  },
];

const testimonials = [
  {
    quote: "I used to lose 3+ hours a week pulling students one by one. Now they all read at once and I get my mornings back.",
    name: "Ms. Rivera",
    role: "2nd Grade Teacher",
    stars: 5,
  },
  {
    quote: "ORF was eating into my reading block. LexiTrack gave me that time back for actual small-group instruction.",
    name: "Mr. Thompson",
    role: "K-1 Literacy Coach",
    stars: 5,
  },
  {
    quote: "No more scrambling to fit in assessments before report cards. The whole class reads in one session.",
    name: "Dr. Patel",
    role: "Reading Specialist",
    stars: 5,
  },
];

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signup");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<RoleChoice>("teacher");
  const [loading, setLoading] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [passageRightsChecked, setPassageRightsChecked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { enableDemo } = useDemo();
  const authRef = useRef<HTMLDivElement>(null);

  const handleDemoMode = () => {
    enableDemo();
    navigate("/", { replace: true });
  };

  const handleSandbox = () => {
    localStorage.removeItem("lexi_tour_complete");
    navigate("/sandbox");
  };

  const scrollToAuth = () => {
    authRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (!authLoading && user) return null;

  const doSignUp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: "https://lexitrackedu.com/pricing",
        },
      });
      if (error) throw error;
      localStorage.setItem("lexitrack_new_signup", "true");
      toast({ title: "Account created!", description: "Please confirm your email and sign in to get started." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      // Show consent dialog instead of submitting directly
      setConsentChecked(false);
      setPassageRightsChecked(false);
      setShowConsentDialog(true);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ───── Navbar ───── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <img src={lexitrackLogo} alt="LexiTrack" className="h-9 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleSandbox} className="gap-1.5">
              <Play className="w-3.5 h-3.5" /> Sandbox
            </Button>
            <Button size="sm" onClick={() => { setMode("login"); scrollToAuth(); }}>
              Login
            </Button>
            <GoogleSignInButton iconOnly />
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-5 px-4 py-1.5 text-sm font-medium">
                <Zap className="w-3.5 h-3.5 mr-1.5" /> AI-Powered Reading Assessment for K-6
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-foreground leading-tight mb-6"
            >
              Stop Pulling Students <span className="text-primary">One by One.</span>
              <br />
              Assess the Whole Class.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              LexiTrack’s literacy-tuned AI recognizes developmental speech patterns, ensuring grade-schoolers in loud
              rooms are graded with fairness, not frustration. Get WPM, accuracy, and growth trajectories instantly—all
              from a single read-aloud.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" onClick={scrollToAuth} className="gap-2 text-base px-8 py-6">
                Sign up <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleSandbox} className="gap-2 text-base px-8 py-6">
                <Play className="w-4 h-4" /> Try Sandbox Mode
              </Button>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="mt-12">
            <button
              onClick={scrollToAuth}
              className="mx-auto flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-xs">See how it works</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="py-20 px-6 bg-secondary/40">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-4"
            >
              Reclaim Your Instructional Time
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
              ORF shouldn't take all day. Let AI handle the listening so you can focus on teaching.
            </motion.p>
          </AnimatedSection>

          <AnimatedSection className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="h-full border-border hover:shadow-card-hover transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-4"
            >
              How It Works
            </motion.h2>
          </AnimatedSection>
          <AnimatedSection className="space-y-0">
            {[
              {
                step: "1",
                title: "Assign a Passage",
                desc: "Input your existing reading passages and assign to the whole class or individual students.",
              },
              {
                step: "2",
                title: "Students Read Aloud",
                desc: "Students log in with a class code and read the passage into their device's microphone. No downloads needed.",
              },
              {
                step: "3",
                title: "AI Analyzes Instantly",
                desc: "Our engine calculates WPM, accuracy, and maps every word—correct, substituted, omitted, or mispronounced.",
              },
              {
                step: "4",
                title: "You Get Actionable Data",
                desc: "View dashboards, cluster students by need, track growth over time, and share reports with caregivers.",
              },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i} className="flex gap-5 items-start py-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-extrabold text-lg shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ───── Try It Yourself ───── */}
      <section className="py-20 px-6 bg-primary/5 border-y border-primary/10">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-10">
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1" /> Interactive Demo
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-3"
            >
              Try It Yourself
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Read the passage below into your microphone and see real AI analysis in action—Word Map, phoneme deep
              dives, and live metrics.
            </motion.p>
          </AnimatedSection>
          <AnimatedSection>
            <motion.div variants={fadeUp} custom={3}>
              <TryItYourselfSandbox />
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ───── CTA + Auth Form ───── */}
      <section ref={authRef} className="py-20 px-6" id="get-started">
        <div className="max-w-md mx-auto">
          <AnimatedSection className="text-center mb-8">
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-display font-extrabold text-3xl text-foreground mb-2"
            >
              {mode === "login" ? "Welcome Back" : "Get Your Time Back"}
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground">
              {mode === "login" ? "Sign in to your LexiTrack account" : "Stop spending hours on ORF. Start teaching."}
            </motion.p>
          </AnimatedSection>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border shadow-elevated">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!email) {
                            toast({ title: "Enter your email first", variant: "destructive" });
                            return;
                          }
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                              redirectTo: window.location.origin + "/reset-password",
                            });
                            if (error) throw error;
                            toast({
                              title: "Check your email",
                              description: "We sent a password reset link to " + email,
                            });
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          }
                        }}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign up"}
                  </Button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
                  </div>
                </div>

                <GoogleSignInButton />

                <Button variant="outline" className="w-full gap-2 mt-2" onClick={handleSandbox}>
                  <Play className="w-4 h-4" /> Try Sandbox Mode
                </Button>

                <p className="text-sm text-center text-muted-foreground mt-4">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-primary hover:underline font-medium"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </CardContent>
            </Card>

            {mode === "signup" && (
              <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> FERPA-compliant &amp; Secure
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Unlimited Student Tracking
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Cancel anytime
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={lexitrackLogo} alt="LexiTrack" className="h-7 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
            © {new Date().getFullYear()} LexiTrack. Built for educators, by educators.
            <span className="text-border">·</span>
            <Link to="/privacy" className="hover:underline hover:text-foreground transition-colors">Privacy</Link>
            <span className="text-border">·</span>
            <Link to="/terms" className="hover:underline hover:text-foreground transition-colors">Terms</Link>
            <span className="text-border">·</span>
            <Link to="/accessibility" className="hover:underline hover:text-foreground transition-colors">Accessibility</Link>
          </p>
        </div>
      </footer>

      {/* COPPA Consent Dialog */}
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent className="rounded-2xl max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Consent &amp; Terms Required</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-5">
                <p>Before creating your account, please review and confirm the following:</p>

                {/* Checkbox 1: Educator authority + COPPA + Privacy + TOS */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="coppa-consent"
                    checked={consentChecked}
                    onCheckedChange={(v) => setConsentChecked(v === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="coppa-consent"
                    className="text-sm leading-snug text-muted-foreground font-normal cursor-pointer"
                  >
                    I confirm I am an educator and have the authority to provide consent for student data collection on
                    behalf of my school/district under the COPPA School Consent model. I agree to the{" "}
                    <a
                      href="https://lexitrackedu.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service
                    </Link>
                    .
                  </Label>
                </div>

                {/* Checkbox 2: Passage rights */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="passage-rights"
                    checked={passageRightsChecked}
                    onCheckedChange={(v) => setPassageRightsChecked(v === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="passage-rights"
                    className="text-sm leading-snug text-muted-foreground font-normal cursor-pointer"
                  >
                    I confirm that all reading passages I upload to LexiTrack are materials I have the legal right,
                    license, or authorization to use for educational assessment purposes.
                  </Label>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!consentChecked || !passageRightsChecked}
              onClick={() => {
                setShowConsentDialog(false);
                doSignUp();
              }}
            >
              I Agree — Create Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Auth;
