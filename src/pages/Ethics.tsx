import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Users, Brain, BookOpen, Scale, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import lexitrackLogo from "@/assets/lexitrack-logo.png";

const Ethics = () => (
  <div className="min-h-screen bg-background">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Skip to main content
    </a>

    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
        <Link to="/auth" className="flex items-center gap-2.5">
          <img src={lexitrackLogo} alt="LexiTrack" className="h-9 w-auto" />
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/auth" className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </Button>
      </div>
    </nav>

    <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
      <div className="space-y-3 mb-12">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground">
            AI Ethics &amp; Governance
          </h1>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          LexiTrack is built on a simple belief: <strong className="text-foreground">AI should empower educators, never replace them.</strong> This page explains how we design, deploy, and govern artificial intelligence to protect students and support teachers.
        </p>
        <p className="text-xs text-muted-foreground">Effective Date: March 4, 2026</p>
      </div>

      <div className="space-y-12">
        {/* Human-in-the-Loop */}
        <section className="space-y-4" aria-labelledby="hitl">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 id="hitl" className="font-display text-xl font-bold text-foreground">
              Human-in-the-Loop: Teachers Lead, AI Assists
            </h2>
          </div>
          <div className="space-y-3 text-sm text-foreground/90 leading-relaxed pl-7">
            <p>
              LexiTrack is a <strong>Teaching Assistant</strong>—not a replacement for professional educator judgment. Our AI listens to a student read aloud, measures words per minute, and flags potential errors, but <strong>the teacher always has the final word.</strong>
            </p>
            <p>
              Every AI-generated score is advisory. Educators can override any result using our built-in "Vouch" system, reclassifying individual words the AI may have misjudged. No student is ever placed, retained, promoted, or referred for services based solely on an AI score. LexiTrack does not make autonomous educational decisions—period.
            </p>
            <p>
              This is not a checkbox commitment. It is a core architectural principle: <strong>every scoring pipeline ends with a human review step.</strong> We believe the most impactful literacy tools amplify teacher expertise rather than bypass it.
            </p>
          </div>
        </section>

        {/* Bias Mitigation */}
        <section className="space-y-4" aria-labelledby="bias">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h2 id="bias" className="font-display text-xl font-bold text-foreground">
              Bias Mitigation &amp; Algorithmic Fairness
            </h2>
          </div>
          <div className="space-y-3 text-sm text-foreground/90 leading-relaxed pl-7">
            <p>
              Speech-to-text engines can carry inherent biases—particularly against students who speak with regional accents, dialects, or who are multilingual learners. We take this seriously because <strong>equitable assessment is non-negotiable.</strong>
            </p>
            <p>
              LexiTrack addresses dialect and accent bias through a configurable <strong>"Grading Strictness" slider</strong> (1.0–10.0) that allows teachers to calibrate AI sensitivity based on grade level, student population, and instructional context. Teachers who know their students best can lower the threshold so that a student's natural speech patterns are not penalized.
            </p>
            <p>
              Additionally, our word-level "Vouch" override lets educators correct any individual word the AI flagged incorrectly—ensuring that dialectal pronunciations or accent variations are recognized as valid. We continuously review error-pattern data in aggregate (never at the individual student level) to identify and reduce systematic scoring disparities across demographic groups.
            </p>
            <p className="p-3 rounded-lg bg-muted border border-border text-sm">
              <strong className="text-foreground">Our commitment:</strong> If our AI is unfair to any student, we want to know. Educators and districts can report fairness concerns directly to{" "}
              <a href="mailto:dmedin42@byu.edu" className="text-primary hover:underline font-medium">dmedin42@byu.edu</a>, and we will investigate within 15 business days.
            </p>
          </div>
        </section>

        {/* AI Transparency */}
        <section className="space-y-4" aria-labelledby="transparency">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 id="transparency" className="font-display text-xl font-bold text-foreground">
              AI Transparency &amp; Secure Processing
            </h2>
          </div>
          <div className="space-y-3 text-sm text-foreground/90 leading-relaxed pl-7">
            <p>
              <strong>LexiTrack collects zero Student PII.</strong> No student names, SSIDs, birthdates, or contact information are ever collected or stored. Students are identified only by app-assigned pseudonymous IDs chosen by the educator—making re-identification impossible without the teacher's own records.
            </p>
            <p>
              Student voice recordings are processed using <strong>Microsoft Azure AI Speech Services</strong> operating within a <strong>Private Virtual Network (Secure Enclave)</strong>. Audio never traverses the public internet—it is encrypted in transit (TLS 1.2+) and at rest (AES-256), processed in isolated single-tenant compute environments, and <strong>deleted immediately after analysis is complete.</strong>
            </p>
            <p>
              LexiTrack's AI is strictly <strong>inference-only</strong>. We do not train, fine-tune, or improve any public or private AI model using student data. This means student voices are never fed into foundation models by OpenAI, Google, Meta, Anthropic, or any other provider. Your students' data stays in a walled garden.
            </p>
            <p>
              We maintain a transparent sub-processor list on our{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link> page, so district IT teams always know exactly who has access to what data and why.
            </p>
          </div>
        </section>

        {/* Pedagogical Alignment */}
        <section className="space-y-4" aria-labelledby="pedagogy">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 id="pedagogy" className="font-display text-xl font-bold text-foreground">
              Pedagogical Alignment: Built on the Science of Reading
            </h2>
          </div>
          <div className="space-y-3 text-sm text-foreground/90 leading-relaxed pl-7">
            <p>
              LexiTrack is not a general-purpose AI tool repurposed for education. It was <strong>built from the ground up</strong> to support the <strong>Science of Reading (SoR)</strong> framework—the evidence-based consensus on how children learn to read.
            </p>
            <p>
              Our assessment engine focuses exclusively on the components that decades of literacy research identify as critical: <strong>Oral Reading Fluency (ORF)</strong>, word-level accuracy, phoneme recognition, and prosody indicators. Every metric we surface—Words Correct Per Minute (WCPM), accuracy percentage, error classification—maps directly to Curriculum-Based Measurement (CBM) methodologies used in MTSS/RTI frameworks nationwide.
            </p>
            <p>
              We don't chase AI trends. We build tools that help teachers do what they already do best—listen to a child read and know exactly where to help next.
            </p>
          </div>
        </section>

        {/* Accountability */}
        <section className="space-y-4" aria-labelledby="accountability">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 id="accountability" className="font-display text-xl font-bold text-foreground">
              Accountability &amp; Incident Response
            </h2>
          </div>
          <div className="space-y-3 text-sm text-foreground/90 leading-relaxed pl-7">
            <p>
              <strong>LexiTrack Education assumes full responsibility for the behavior of its AI systems.</strong> If our speech-to-text engine produces a scoring error, that is our responsibility to investigate, disclose, and remediate—not the teacher's or the district's.
            </p>
            <p>
              In the event of a confirmed AI malfunction, data breach, or systematic scoring anomaly, we will: (1) notify affected districts within <strong>72 hours</strong>, (2) provide a root-cause analysis, and (3) implement corrective measures. We maintain an internal AI incident log and will share relevant findings with district partners upon request.
            </p>
            <p>
              We welcome external audits. Districts may request documentation of our AI scoring methodology, error rates, and fairness metrics at any time by contacting{" "}
              <a href="mailto:dmedin42@byu.edu" className="text-primary hover:underline font-medium">dmedin42@byu.edu</a>.
            </p>
          </div>
        </section>
      </div>
    </main>

    <footer className="border-t border-border py-10 px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={lexitrackLogo} alt="LexiTrack" className="h-7 w-auto" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} LexiTrack. Built for educators, by educators.</p>
        </div>
        <div className="border-t border-border pt-4 mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
          <Link to="/privacy" className="hover:underline hover:text-foreground transition-colors">Privacy</Link>
          <span className="text-border">·</span>
          <Link to="/terms" className="hover:underline hover:text-foreground transition-colors">Terms of Service</Link>
          <span className="text-border">·</span>
          <Link to="/accessibility" className="hover:underline hover:text-foreground transition-colors">Accessibility</Link>
          <span className="text-border">·</span>
          <Link to="/ethics" className="hover:underline hover:text-foreground transition-colors">AI Ethics</Link>
        </div>
      </div>
    </footer>
  </div>
);

export default Ethics;
