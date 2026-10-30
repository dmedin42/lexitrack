import { Link } from "react-router-dom";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const conformanceData = [
  {
    criterion: "1.1.1 Non-text Content (Level A)",
    level: "Supports",
    remarks:
      "All informational images, icons, and data-visualization charts (progress charts, word maps, cluster views) include descriptive alt text or ARIA labels. Decorative images use empty alt attributes. AI-generated assessment charts render with accessible tooltips that convey data values to screen readers.",
  },
  {
    criterion: "1.2.1 Audio-only and Video-only (Level A)",
    level: "Supports",
    remarks:
      'LexiTrack\'s core workflow records students reading aloud. Every audio recording is processed by Azure AI Speech Services and a full text transcription is generated and stored. Teachers can review the "Transcribed Text" alongside the word-level accuracy map, ensuring equivalent text alternatives for all audio content.',
  },
  {
    criterion: "1.3.1 Info and Relationships (Level A)",
    level: "Supports",
    remarks:
      "Semantic HTML5 elements (headings, tables, lists, landmarks) are used throughout. Data tables in the Assessment History and Class Dashboard use proper <th> scope attributes. Form inputs are associated with visible <label> elements.",
  },
  {
    criterion: "1.4.3 Contrast (Minimum) (Level AA)",
    level: "Supports",
    remarks:
      "LexiTrack is designed for K-6 readability with high-contrast color tokens. Body text meets a minimum 4.5:1 contrast ratio against backgrounds. Large headings (Nunito 700+) exceed 3:1. The word-map color coding (correct/substitution/omission) uses distinct hues with sufficient luminance contrast, supplemented by underline patterns so color is never the sole differentiator.",
  },
  {
    criterion: "2.1.1 Keyboard (Level A)",
    level: "Supports",
    remarks:
      "All interactive controls—including Start/Stop Assessment buttons, navigation tabs, dialog modals, form inputs, and the grading strictness slider—are fully operable via keyboard (Tab, Enter, Space, Arrow keys). Focus indicators are visible on all focusable elements. Teachers can conduct an entire assessment workflow without a mouse.",
  },
  {
    criterion: "2.4.1 Bypass Blocks (Level A)",
    level: "Supports",
    remarks:
      "A skip-to-main-content link is provided at the top of every page, allowing keyboard users to bypass the navigation header and jump directly to the main content area.",
  },
  {
    criterion: "2.4.7 Focus Visible (Level AA)",
    level: "Supports",
    remarks:
      "All interactive elements display a visible focus ring using the application's ring color token. Custom components (sliders, toggles, cards) maintain focus visibility through Tailwind's ring utilities.",
  },
  {
    criterion: "3.1.1 Language of Page (Level A)",
    level: "Supports",
    remarks:
      'The HTML document declares lang="en" for English. LexiTrack\'s reading passages and UI are currently provided in English. The platform architecture supports future localization for Spanish-language content to serve Utah Dual Language Immersion (DLI) programs.',
  },
  {
    criterion: "3.3.2 Labels or Instructions (Level A)",
    level: "Supports",
    remarks:
      "All form fields include visible labels. The Student Portal provides clear on-screen instructions for each assessment step. Placeholder text supplements (but does not replace) visible labels.",
  },
  {
    criterion: "4.1.2 Name, Role, Value (Level A)",
    level: "Supports",
    remarks:
      "All UI components use Radix UI primitives with built-in ARIA attributes. Custom interactive elements (word map tokens, assessment cards, the grading strictness slider) include appropriate aria-label, role, and aria-valuenow attributes. Dialog components use aria-modal and proper focus trapping.",
  },
];

const getBadgeClass = (level: string) => {
  switch (level) {
    case "Supports":
      return "bg-[hsl(var(--word-correct)/0.15)] text-[hsl(var(--word-correct))] border-[hsl(var(--word-correct)/0.3)]";
    case "Supports with Exceptions":
      return "bg-[hsl(var(--word-mispronunciation)/0.15)] text-[hsl(var(--word-mispronunciation))] border-[hsl(var(--word-mispronunciation)/0.3)]";
    case "Not Applicable":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "";
  }
};

const Accessibility = () => {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-bold text-lg">LexiTrack</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 print:hidden">
            <Download className="w-4 h-4" />
            Download VPAT (PDF)
          </Button>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Title Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              Accessibility Conformance Report
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Voluntary Product Accessibility Template (VPAT®) 2.5 — WCAG 2.1 Edition for{" "}
            <strong className="text-foreground">LexiTrack</strong>, an AI-powered K-6 literacy assessment platform.
          </p>
        </div>

        {/* Product Info */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4" aria-labelledby="product-info-heading">
          <h2 id="product-info-heading" className="font-display text-xl font-bold text-foreground">
            Product Information
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground font-medium">Product Name</dt>
              <dd className="text-foreground font-semibold">LexiTrack</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Product Version</dt>
              <dd className="text-foreground">Web Application (SaaS)</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Report Date</dt>
              <dd className="text-foreground">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">WCAG Version</dt>
              <dd className="text-foreground">WCAG 2.1 Level AA</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Evaluation Method</dt>
              <dd className="text-foreground">Manual inspection &amp; automated tooling</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Contact</dt>
              <dd className="text-foreground">dmedin42@byu.edu</dd>
            </div>
          </dl>
        </section>

        {/* Conformance Table */}
        <section className="space-y-4" aria-labelledby="conformance-heading">
          <h2 id="conformance-heading" className="font-display text-xl font-bold text-foreground">
            WCAG 2.1 Level AA Conformance
          </h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-display font-bold w-[240px]">Criteria</TableHead>
                  <TableHead className="font-display font-bold w-[180px]">Conformance Level</TableHead>
                  <TableHead className="font-display font-bold">Remarks &amp; Explanations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conformanceData.map((row) => (
                  <TableRow key={row.criterion}>
                    <TableCell className="font-medium text-foreground align-top text-sm">
                      {row.criterion}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant="outline" className={getBadgeClass(row.level)}>
                        {row.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground leading-relaxed align-top">
                      {row.remarks}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Self-Certification */}
        <section
          className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4"
          aria-labelledby="certification-heading"
        >
          <h2 id="certification-heading" className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Self-Certification Statement
          </h2>
          <div className="text-sm text-foreground leading-relaxed space-y-3">
            <p>
              LexiTrack Education certifies that the LexiTrack web application has been evaluated against the
              Web Content Accessibility Guidelines (WCAG) 2.1 Level AA success criteria. Based on this evaluation,
              LexiTrack <strong>substantially conforms</strong> to the WCAG 2.1 Level AA standard.
            </p>
            <p>
              This product is designed to be compatible with assistive technologies including screen readers
              (NVDA, JAWS, VoiceOver), keyboard-only navigation, and browser zoom up to 200%. The platform
              meets ADA Title II requirements for public educational institutions.
            </p>
            <p>
              LexiTrack is committed to continuous accessibility improvement. Feedback and accommodation
              requests can be directed to{" "}
              <a
                href="mailto:dmedin42@byu.edu"
                className="text-primary underline hover:opacity-80 transition-opacity"
              >
                dmedin42@byu.edu
              </a>.
            </p>
          </div>
          <div className="pt-2 border-t border-primary/10 text-xs text-muted-foreground">
            <p>VPAT® is a registered trademark of the Information Technology Industry Council (ITI).</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground print:hidden">
        © {new Date().getFullYear()} LexiTrack Education. All rights reserved.
      </footer>
    </div>
  );
};

export default Accessibility;
