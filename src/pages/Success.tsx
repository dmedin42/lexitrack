import { Link } from "react-router-dom";
import { BookOpen, CheckCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Success() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">LexiTrack Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <Card className="max-w-lg w-full border-primary/20 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>

            <Badge className="mb-4 bg-accent/15 text-accent border-accent/30">
              <Sparkles className="w-3 h-3 mr-1" /> Founding Parent
            </Badge>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground mb-3">
              Welcome to the Family!
            </h1>

            <p className="text-muted-foreground leading-relaxed mb-8">
              You're officially a Founding Parent. You'll get early access when
              LexiTrack Home launches, plus your lifetime badge is locked in.
              We'll be in touch soon!
            </p>

            <Button asChild size="lg" className="w-full">
              <Link to="/home-waitlist">← Back to LexiTrack Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border py-6 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LexiTrack ·{" "}
          <Link to="/privacy" className="underline hover:text-foreground">Privacy</Link> ·{" "}
          <Link to="/terms" className="underline hover:text-foreground">Terms</Link>
        </p>
      </footer>
    </div>
  );
}
