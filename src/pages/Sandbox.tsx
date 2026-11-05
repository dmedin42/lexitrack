import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Users, Mic, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { startGuestSandbox } from "@/lib/guestSandbox";
import logoImg from "@/assets/lexitrack-logo.png";

const included = [
  { icon: Users, text: "A 3rd-grade class with 8 students and ten weeks of reading history" },
  { icon: BarChart3, text: "Word maps, growth charts, and intervention groups built from that data" },
  { icon: Mic, text: "Real assessments: record a reading and get it scored by Azure Speech" },
];

/** Landing spot for "Sandbox" links: starts a guest teacher session. */
export default function Sandbox() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anyone already signed in (guest or not) goes straight to their dashboard.
  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const start = async () => {
    setError(null);
    setStarting(true);
    const { error } = await startGuestSandbox();
    if (error) {
      setError(error);
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logoImg} alt="LexiTrack" className="h-9" />
        </div>
        <Card>
          <CardContent className="p-8">
            <h1 className="font-display font-bold text-2xl text-foreground text-center">Explore LexiTrack as a guest teacher</h1>
            <p className="text-muted-foreground text-center mt-2">
              Sandbox Mode gives you your own sample class to work with. Change anything you like; it all resets after 24 hours.
            </p>
            <ul className="mt-6 space-y-3">
              {included.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-foreground">
                  <Icon className="w-4 h-4 mt-0.5 text-primary shrink-0" aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full mt-8 gap-2" onClick={start} disabled={starting || loading}>
              {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {starting ? "Setting up your class…" : "Start the sandbox"}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive text-center mt-3">
                Couldn't open the sandbox: {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center mt-4">
              No account or email needed. <a href="/auth" className="underline hover:text-foreground">Sign in instead</a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
