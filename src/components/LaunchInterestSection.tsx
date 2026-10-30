import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const aspirationalQuotes = [
  {
    quote: "This could completely change the way we do reading assessments.",
    attribution: "— Future K-2 Teacher",
  },
  {
    quote: "I could finally focus on the specific issues my kids are struggling with the most.",
    attribution: "— Future Literacy Coach",
  },
  {
    quote: "Imagine sending parents a real progress report after every reading session—automatically.",
    attribution: "— Future Reading Specialist",
  },
];

const featureOptions = [
  "AI-Powered Read-Aloud Analysis",
  "Live Progress Dashboards",
  "Error Pattern Insights",
  "Student Cluster Grouping",
  "Passwordless Student Portal",
  "Caregiver / Parent Reports",
];

const roleOptions = [
  "Classroom Teacher",
  "Literacy Coach",
  "Reading Specialist",
  "Administrator",
  "Caregiver / Parent",
  "Other",
];

const gradeOptions = [
  "Pre-K",
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
];

export default function LaunchInterestSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [questionnaireSubmitted, setQuestionnaireSubmitted] = useState(false);
  const [signups, setSignups] = useState<{ email: string; date: string }[]>([]);
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const trimmed = email.trim();
    const { error } = await supabase.from("launch_interest" as any).insert({ email: trimmed } as any);
    if (error) {
      toast({
        title: "Oops!",
        description: error.message.includes("duplicate") ? "That email is already signed up." : error.message,
        variant: "destructive",
      });
      return;
    }
    const entry = { email: trimmed, date: new Date().toLocaleDateString() };
    setSignups((prev) => [...prev, entry]);
    setSubmitted(true);
    setShowQuestionnaire(true);
    toast({ title: "You're on the list! 🎉", description: "We'll notify you when LexiTrack launches." });
    setEmail("");
  };

  const toggleFeature = (f: string) =>
    setSelectedFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const toggleGrade = (g: string) =>
    setSelectedGrades((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleQuestionnaireSubmit = async () => {
    const lastSignup = signups[signups.length - 1];
    if (lastSignup) {
      await supabase
        .from("launch_interest" as any)
        .update({
          features: selectedFeatures,
          role: selectedRole || null,
          grades: selectedGrades,
        } as any)
        .eq("email", lastSignup.email);
    }
    setQuestionnaireSubmitted(true);
    toast({ title: "Thanks for your feedback!", description: "Your responses help us build a better tool." });
  };

  return (
    <section className="py-20 px-6 bg-secondary/40">
      <div className="max-w-6xl mx-auto">
        {/* Email signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto"
        >
          <Card className="border-primary/20 shadow-elevated">
            <CardContent className="p-8 text-center">
              <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-xl text-foreground mb-2">Get Early Access</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Be the first to know when LexiTrack launches. Sign up and we'll send you a notification when the full
                version is live.
              </p>

              {!submitted ? (
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" className="gap-1.5 shrink-0">
                    Notify Me <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
                  <CheckCircle2 className="w-4 h-4" /> You're signed up!
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Signups table */}
        {signups.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto mt-6">
            <Card className="border-border">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Recent Signups
                </h4>
                <div className="divide-y divide-border">
                  {signups.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-foreground truncate mr-4">{s.email}</span>
                      <span className="text-muted-foreground text-xs shrink-0">{s.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Optional questionnaire */}
        <AnimatePresence>
          {showQuestionnaire && !questionnaireSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg mx-auto mt-8"
            >
              <Card className="border-accent/20">
                <CardContent className="p-8">
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    Quick Questionnaire <span className="text-muted-foreground font-normal text-sm">(optional)</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">Help us build what matters most to you.</p>

                  {/* Q1: Most valuable feature */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground block mb-2">
                      What feature is the most valuable to you?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {featureOptions.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => toggleFeature(f)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedFeatures.includes(f)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Role */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground block mb-2">
                      What best describes your role?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {roleOptions.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRole(r)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedRole === r
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Grade levels */}
                  <div className="mb-6">
                    <label className="text-sm font-medium text-foreground block mb-2">
                      What grade levels do you work with?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {gradeOptions.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGrade(g)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selectedGrades.includes(g)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleQuestionnaireSubmit} className="gap-1.5">
                      Submit Feedback <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" onClick={() => setShowQuestionnaire(false)}>
                      Skip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {questionnaireSubmitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
              <CheckCircle2 className="w-4 h-4" /> Thank you! Your feedback helps shape LexiTrack.
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
