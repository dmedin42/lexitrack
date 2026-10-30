import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import lexitrackLogo from "@/assets/lexitrack-logo.png";

const Privacy = () =>
<div className="min-h-screen bg-background">
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

    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground mb-2">
        LexiTrack Privacy Policy
      </h1>
      <p className="text-muted-foreground mb-10">Effective Date: February 23, 2026</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90">
        <section>
          <h2 className="font-display font-bold text-xl text-foreground">1. Our Commitment to Education</h2>
          <p className="text-muted-foreground leading-relaxed">
            LexiTrack is designed specifically for the classroom. We are committed to protecting the privacy of students and educators. Our practices are designed to comply with the Family Educational Rights and Privacy Act (FERPA) and the Children's Online Privacy Protection Act (COPPA).
          </p>
          <div className="mt-4 p-4 rounded-lg bg-muted border border-border space-y-3">
            <p className="text-foreground font-semibold text-sm uppercase tracking-wide">Privacy-by-Design</p>
            <p className="text-muted-foreground leading-relaxed">
              LexiTrack is a <strong className="text-foreground">'Privacy-by-Design'</strong> research tool developed at BYU. To ensure compliance, we collect <strong className="text-foreground">ZERO Student PII</strong> (No SSIDs, Names, or Birthdates). We utilize <strong className="text-foreground">app-assigned student IDs</strong> and strictly adhere to the <strong className="text-foreground">FERPA 'Studies' Exception</strong> to improve K-6 instruction.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl text-foreground">2. Data Collection &amp; Usage</h2>
          <ul className="space-y-3 text-muted-foreground leading-relaxed list-none pl-0">
            <li>
              <strong className="text-foreground">Teacher Data:</strong> We collect name, email, and school affiliation to manage your account and subscription.
            </li>
            <li>
              <strong className="text-foreground">Student Data — Zero PII:</strong> LexiTrack does <strong className="text-foreground">not</strong> collect any Student Personally Identifiable Information (PII). We do not collect student names, SSIDs, birthdates, email addresses, home addresses, or any other information that could directly identify a student. Students are identified only by app-assigned pseudonymous IDs (e.g., "ER1", "AJ1") chosen by the educator.
            </li>
            <li>
              <strong className="text-foreground">Audio Recordings:</strong> Student audio recordings are processed solely to provide reading fluency analytics and are deleted immediately after analysis. We do not use student data or recordings to train third-party AI models.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl text-foreground">3. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard encryption (AES-256) and secure cloud infrastructure (SOC 2 compliant) to ensure all data is protected at rest and in transit. Audio is processed in real-time by Microsoft Azure and is not stored on LexiTrack or Azure servers after the analysis is complete. 
          </p>
        </section>

         <section>
           <h2 className="font-display font-bold text-xl text-foreground">4. No Data Selling</h2>
           <p className="text-muted-foreground leading-relaxed">
             LexiTrack does not sell student or teacher data to third parties. We do not display advertisements within the platform.
           </p>
         </section>

         <section>
           <h2 className="font-display font-bold text-xl text-foreground">5. Sub-processors</h2>
           <p className="text-muted-foreground leading-relaxed mb-3">
             LexiTrack relies on the following third-party sub-processors to deliver our service:
           </p>
           <ul className="space-y-3 text-muted-foreground leading-relaxed list-none pl-0">
             <li>
               <strong className="text-foreground">Supabase</strong> — Database hosting, authentication, and file storage.
             </li>
             <li>
               <strong className="text-foreground">Stripe</strong> — Payment processing and subscription billing.
             </li>
             <li>
               <strong className="text-foreground">Microsoft Azure</strong> — Speech-to-Text processing for reading fluency analysis.
             </li>
           </ul>
          </section>

         <section>
           <h2 className="font-display font-bold text-xl text-foreground">6. AI Data Governance &amp; Model Privacy</h2>
           <div className="space-y-3 text-muted-foreground leading-relaxed">
             <p>
               <strong className="text-foreground">No Model Training.</strong> LexiTrack <strong className="text-foreground">never</strong> uses student voice recordings, transcripts, or assessment data to train, fine-tune, or improve our own AI models or any third-party models (including OpenAI, Google, Meta, or Anthropic).
             </p>
             <p>
               <strong className="text-foreground">Walled-Garden Processing.</strong> All AI inference occurs within a <strong className="text-foreground">Private Virtual Network (Secure Enclave)</strong> on Microsoft Azure enterprise infrastructure. Audio is encrypted end-to-end (TLS 1.2+ in transit, AES-256 at rest) and processed in isolated, single-tenant compute environments that are never shared with other customers or services.
             </p>
             <p>
               <strong className="text-foreground">Retention &amp; Deletion.</strong> Student audio and transcription data is deleted immediately after analysis unless the educator opts to retain it for review. All data retention is governed by the district's data retention policy and is subject to FERPA and COPPA requirements. Upon contract termination, all Student Data is deleted within 30 calendar days.
             </p>
             <p>
               <strong className="text-foreground">No Social Scoring or Behavioral Analytics.</strong> LexiTrack does not perform social scoring, predictive behavioral analytics, or psychological profiling. Our AI analyzes <em>only</em> literacy components: word-level accuracy, Words Correct Per Minute (WCPM), phoneme recognition, and error classification (substitutions, omissions, mispronunciations).
             </p>
           </div>
         </section>

         <section>
           <h2 className="font-display font-bold text-xl text-foreground">6. Technical &amp; Academic Information</h2>
           <p className="text-muted-foreground leading-relaxed">
             LexiTrack is built on evidence-based pedagogical principles centered on <strong className="text-foreground">Oral Reading Fluency (ORF)</strong>, a well-established indicator of reading proficiency for K-6 learners. The platform measures words-per-minute (WPM) and word-level accuracy to provide actionable, formative assessment data aligned with curriculum-based measurement (CBM) research.
           </p>
           <p className="text-muted-foreground leading-relaxed mt-3 p-3 rounded-lg bg-muted border border-border text-sm">
             <strong className="text-foreground">Important:</strong> LexiTrack provides formative assessment feedback to educators and does not replace direct teacher instruction.
           </p>
         </section>

         <section>
          <h2 className="font-display font-bold text-xl text-foreground">7. Metadata Dictionary</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The following table documents every category of data collected by LexiTrack, its storage location, and the specific educational purpose it serves. <strong className="text-foreground">No Student PII is collected at any point.</strong>
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Data Field</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Storage Location</th>
                    <th className="text-left p-3 font-semibold text-foreground border-b border-border">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="p-3">Teacher Name</td>
                    <td className="p-3">US Servers (Supabase)</td>
                    <td className="p-3">Account management</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/50">
                    <td className="p-3">Teacher Email</td>
                    <td className="p-3">US Servers (Supabase)</td>
                    <td className="p-3">Authentication &amp; communication</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">App-Assigned Student ID (pseudonymous)</td>
                    <td className="p-3">US Servers (Supabase)</td>
                    <td className="p-3">Assessment identification (no real names or SSIDs)</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/50">
                    <td className="p-3">Student Avatar Emoji</td>
                    <td className="p-3">US Servers (Supabase)</td>
                    <td className="p-3">Visual identification in UI</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3">Audio Recording</td>
                    <td className="p-3">US Servers (Azure)</td>
                    <td className="p-3">Speech-to-text processing (deleted immediately after analysis)</td>
                  </tr>
                  <tr className="border-b border-border bg-muted/50">
                    <td className="p-3">Assessment Scores (WPM, Accuracy)</td>
                    <td className="p-3">US Servers (Supabase)</td>
                    <td className="p-3">Educational progress tracking</td>
                  </tr>
                  <tr>
                    <td className="p-3">Word-Level Error Data</td>
                    <td className="p-3">US Servers (Supabase)</td>
                    <td className="p-3">Reading error pattern analysis</td>
                  </tr>
                </tbody>
              </table>
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
         <div className="border-t border-border pt-4">
           <p className="text-xs text-muted-foreground text-center leading-relaxed">
             <strong className="text-foreground/70">Security Specs:</strong> Data Residency — All data is stored and processed within US-based data centers (US-East/US-West). Encryption at rest (AES-256) and in transit (TLS 1.2+). Infrastructure is SOC 2 Type II compliant.
           </p>
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
  </div>;


export default Privacy;