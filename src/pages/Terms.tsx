import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Scale, Database, Bot, FileText, Trash2, Users } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-bold text-lg">LexiTrack</span>
          </Link>
          <span className="text-xs text-muted-foreground">Effective Date: March 1, 2026</span>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl font-extrabold text-foreground">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            These Terms of Service ("Terms") govern the use of the LexiTrack platform ("Service"), an AI-powered K-6
            literacy assessment tool operated by LexiTrack Education ("Company," "we," "us"). By accessing or using the
            Service, you ("User," "Educator," or "District") agree to these Terms in their entirety.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: March 1, 2026 · Version 2.0
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4" aria-labelledby="section-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 id="section-1" className="font-display text-xl font-bold text-foreground">
              1. Data Sovereignty &amp; Ownership
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>1.1</strong> All Student Data, as defined under the Family Educational Rights and Privacy Act
              ("FERPA," 20 U.S.C. § 1232g), the Utah Student Data Protection Act (Utah Code §&nbsp;53E-9), and the
              Children's Online Privacy Protection Act ("COPPA," 15 U.S.C. §&nbsp;6501–6506), is and shall remain the
              exclusive property of the Local Education Agency ("LEA")—i.e., the school district or charter school.
            </p>
            <p>
              <strong>1.2</strong> LexiTrack operates as a <strong>"School Official"</strong> with a legitimate
              educational interest under FERPA 34 CFR § 99.31(a)(1)(i)(B). LexiTrack shall use Student Data solely for
              the purpose of providing the contracted educational services and for no other purpose.
            </p>
            <p>
              <strong>1.3</strong> LexiTrack collects <strong>zero Student Personally Identifiable Information (PII)</strong>. No student names, SSIDs, birthdates, email addresses, or other direct identifiers are collected or stored. Students are identified exclusively by app-assigned pseudonymous IDs. LexiTrack does not claim ownership, copyright, or intellectual property rights over any Student Data, including but not limited to: pseudonymous student identifiers, audio recordings of student reading, transcription data, assessment scores, word-level error analyses, and phoneme-level performance data.
            </p>
            <p>
              <strong>1.4</strong> All Student Data is stored exclusively within the United States, utilizing SOC 2
              Type II compliant infrastructure (Supabase/AWS) and Microsoft Azure data centers located in domestic
              regions.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4" aria-labelledby="section-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 id="section-2" className="font-display text-xl font-bold text-foreground">
              2. Prohibition on Data Mining &amp; Targeted Advertising
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>2.1</strong> LexiTrack <strong>strictly prohibits</strong> the use of Student Data—including voice
              recordings, transcripts, assessment results, error patterns, and behavioral analytics—for the purposes of:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Targeted advertising or behavioral profiling of students or educators;</li>
              <li>Sale, lease, rent, or commercial distribution of Student Data to any third party;</li>
              <li>Building student profiles for non-educational commercial purposes;</li>
              <li>Cross-service data aggregation outside the scope of LexiTrack's educational function.</li>
            </ul>
            <p>
              <strong>2.2</strong> The Service displays no advertisements to students, educators, or caregivers at any
              point during use.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4" aria-labelledby="section-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 id="section-3" className="font-display text-xl font-bold text-foreground">
              3. AI Training &amp; Data Processing Disclaimer
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>3.1</strong> Student audio recordings and transcription data are processed via Microsoft Azure
              AI Speech Services operating within a <strong>Private Virtual Network (VNET)</strong>. All inference occurs
              within isolated, single-tenant compute environments.
            </p>
            <p>
              <strong>3.2</strong> Student Data is <strong>NOT</strong> used to train, fine-tune, improve, or augment any
              public Large Language Models (LLMs), foundation models, or third-party artificial intelligence systems.
              This includes, but is not limited to, OpenAI, Google, Meta, Anthropic, or any open-source model
              repositories.
            </p>
            <p>
              <strong>3.3</strong> LexiTrack's AI processing is strictly <strong>inference-only</strong>. Audio is
              evaluated against reference text for pronunciation accuracy and fluency scoring. Upon completion of
              processing, raw audio data may be retained solely for the purpose of teacher review and is subject to
              the deletion policies described in Section 6.
            </p>
            <p>
              <strong>3.4</strong> Sub-processors with access to Student Data are limited to: (a) Supabase (database
              and authentication) and (b) Microsoft Azure (AI Speech Services). A current sub-processor list is maintained at{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">
                the Privacy Policy page
              </Link>.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4" aria-labelledby="section-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 id="section-4" className="font-display text-xl font-bold text-foreground">
              4. Student Data Privacy Agreement (SDPC Alignment)
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>4.1</strong> LexiTrack is prepared to execute the{" "}
              <strong>Utah National Data Privacy Agreement (NDPA) Exhibit E</strong> (General Offer of Privacy Terms),
              enabling LEAs to adopt LexiTrack's privacy commitments through the Student Data Privacy Consortium (SDPC)
              "piggy-backing" mechanism.
            </p>
            <p>
              <strong>4.2</strong> Upon request, LexiTrack will provide a completed SDPC Application form, including
              Exhibit A (Description of Services), Exhibit B (Schedule of Data), Exhibit C (Data Transfer and Fees),
              and Exhibit D (Data Security Requirements).
            </p>
            <p>
              <strong>4.3</strong> Districts that are members of the Utah Student Data Privacy Alliance may adopt these
              Terms as binding privacy obligations without the need for a separate bilateral agreement, subject to
              written notification to LexiTrack at{" "}
              <a href="mailto:dmedin42@byu.edu" className="text-primary hover:underline font-medium">
                dmedin42@byu.edu
              </a>.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4" aria-labelledby="section-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 id="section-5" className="font-display text-xl font-bold text-foreground">
              5. Agentic AI Accuracy &amp; Human-in-the-Loop
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>5.1</strong> LexiTrack utilizes AI-powered agents to automate the scoring of student reading
              fluency (Words Per Minute), accuracy (percentage of correctly pronounced words), and error classification
              (substitutions, omissions, mispronunciations, and insertions).
            </p>
            <p>
              <strong>5.2</strong> <strong>AI-generated scores are advisory in nature.</strong> The educator ("Teacher")
              serves as the <strong>Human-in-the-Loop</strong> and retains final, sole authority over all student
              benchmarking scores, grade-level determinations, and instructional decisions.
            </p>
            <p>
              <strong>5.3</strong> Teachers may override any AI-generated score at any time through the manual score
              override feature. The "Vouch" system allows teachers to reclassify individual word-level errors (e.g.,
              marking a flagged mispronunciation as "correct") to ensure assessment integrity.
            </p>
            <p>
              <strong>5.4</strong> LexiTrack does not make autonomous educational decisions. No student shall be
              placed, retained, promoted, or referred for services based solely on AI-generated assessment data without
              educator review and professional judgment.
            </p>
            <p>
              <strong>5.5</strong> The configurable "Grading Strictness" slider allows educators to calibrate the AI
              sensitivity threshold (1.0–10.0) based on grade level, student population, and instructional context,
              ensuring age-appropriate and culturally responsive scoring.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-4" aria-labelledby="section-6">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            <h2 id="section-6" className="font-display text-xl font-bold text-foreground">
              6. Data Deletion &amp; Portability
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>6.1 Right to Be Forgotten.</strong> Upon termination, expiration, or non-renewal of the service
              agreement, LexiTrack will delete all Student Data within <strong>thirty (30) calendar days</strong>. This
              deletion applies to all storage locations, including primary databases, backup systems, and any local
              processing nodes.
            </p>
            <p>
              <strong>6.2 Educator-Initiated Deletion.</strong> Educators may delete individual student records or
              entire class datasets at any time via the "Data Management" panel on the Manage Class page. Deletion is
              cascading and permanent, removing assessment records, word-level analyses, phoneme details, and all
              associated metadata.
            </p>
            <p>
              <strong>6.3 Data Export.</strong> Prior to deletion, educators may export student assessment data in CSV
              format via the Data Management interface. LexiTrack supports the LEA's right to data portability under
              the Utah Student Data Protection Act.
            </p>
            <p>
              <strong>6.4 Parent/Guardian Requests.</strong> In accordance with FERPA and COPPA, parents or guardians
              may request review or deletion of their child's data. Such requests will be facilitated within thirty (30)
              calendar days of receipt. Requests should be directed to{" "}
              <a href="mailto:dmedin42@byu.edu" className="text-primary hover:underline font-medium">
                dmedin42@byu.edu
              </a>.
            </p>
          </div>
        </section>

        {/* Section 7 - Content & Passage Rights */}
        <section className="space-y-4" aria-labelledby="section-7">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 id="section-7" className="font-display text-xl font-bold text-foreground">
              7. Content &amp; Passage Rights
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>7.1</strong> Educators who upload or input reading passages into the LexiTrack platform represent
              and warrant that they have the legal right, license, or authorization to use such content for educational
              assessment purposes. This includes passages sourced from published curricula, open educational resources
              (OER), educator-authored content, or materials for which the school/district holds a valid license.
            </p>
            <p>
              <strong>7.2</strong> LexiTrack does not claim ownership of educator-uploaded passages. Passages are stored
              solely to facilitate student assessments and are subject to the same deletion and portability policies
              described in Section 6.
            </p>
            <p>
              <strong>7.3</strong> Educators assume full responsibility for ensuring that uploaded content does not
              infringe upon third-party copyrights, trademarks, or intellectual property rights. LexiTrack shall not be
              held liable for unauthorized use of copyrighted materials by educators.
            </p>
          </div>
        </section>

        {/* Section 8 - COPPA School Consent */}
        <section className="space-y-4" aria-labelledby="section-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 id="section-8" className="font-display text-xl font-bold text-foreground">
              8. COPPA School Consent Model
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>8.1</strong> LexiTrack does <strong>not</strong> collect any Student Personally Identifiable Information (PII) from students of any age. No student names, SSIDs, birthdates, or contact information are collected. Students are identified solely by app-assigned pseudonymous IDs. This zero-PII approach exceeds the requirements of the COPPA School Consent exception (16 CFR § 312.5(c)(3)).
            </p>
            <p>
              <strong>8.2</strong> By creating an educator account, the User represents and warrants that they are an
              authorized school official and have the authority to provide consent for the collection of student data on
              behalf of their school or district. This consent is limited to the educational purposes described herein.
            </p>
            <p>
              <strong>8.3</strong> Student data collected under the School Consent model is limited to: app-assigned pseudonymous identifiers, audio recordings of reading (deleted after analysis), AI-generated transcriptions and scores, and teacher-assigned class/grade associations. No Student PII is collected at any point, consistent with our Privacy-by-Design data minimization protocol.
            </p>
          </div>
        </section>

        {/* Section 9 - AI Data Governance */}
        <section className="space-y-4" aria-labelledby="section-9">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 id="section-9" className="font-display text-xl font-bold text-foreground">
              9. AI Data Governance &amp; Model Privacy
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>9.1</strong> LexiTrack <strong>never</strong> uses student voice recordings, transcripts, assessment scores, or any Student Data to train, fine-tune, retrain, or improve its own proprietary models, or any third-party foundation models, large language models, or AI systems. This prohibition applies to all current and future AI providers.
            </p>
            <p>
              <strong>9.2</strong> All AI processing occurs within a <strong>private, encrypted session</strong> inside Microsoft Azure enterprise infrastructure, utilizing Private Virtual Networks (VNETs) and single-tenant compute. No Student Data is exposed to shared or multi-tenant AI services.
            </p>
            <p>
              <strong>9.3</strong> Student Data is deleted or anonymized in accordance with the LEA's data retention policy and applicable federal and state law (FERPA, COPPA, Utah Student Data Protection Act). Audio recordings are deleted immediately after inference unless explicitly retained by the educator for review purposes.
            </p>
            <p>
              <strong>9.4</strong> LexiTrack does not engage in <strong>"Social Scoring,"</strong> predictive behavioral analytics, psychological profiling, or any form of non-educational algorithmic assessment. The AI analyzes <em>only</em> literacy components: word-level accuracy, Words Correct Per Minute (WCPM), phoneme-level pronunciation, and error classification.
            </p>
          </div>
        </section>

        {/* Section 10 - Accountability */}
        <section className="space-y-4" aria-labelledby="section-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 id="section-10" className="font-display text-xl font-bold text-foreground">
              10. Accountability &amp; Algorithmic Fairness
            </h2>
          </div>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>10.1 Responsibility.</strong> LexiTrack Education assumes full responsibility for the accuracy, reliability, and fairness of its AI-generated assessments. In the event of a confirmed scoring error, systematic bias, or AI malfunction, LexiTrack will notify affected districts within <strong>72 hours</strong>, provide a root-cause analysis, and implement corrective measures.
            </p>
            <p>
              <strong>10.2 Fairness Reporting.</strong> Educators and districts may report concerns about algorithmic fairness—including potential accent, dialect, or demographic bias—to{" "}
              <a href="mailto:dmedin42@byu.edu" className="text-primary hover:underline font-medium">dmedin42@byu.edu</a>. LexiTrack will investigate all reports within 15 business days and provide written findings.
            </p>
            <p>
              <strong>10.3 Audit Rights.</strong> Districts may request documentation of LexiTrack's AI scoring methodology, aggregate error rates, and fairness metrics at any time. LexiTrack welcomes external audits and will cooperate with district-initiated reviews of algorithmic performance.
            </p>
            <p>
              <strong>10.4 No Autonomous Decisions.</strong> LexiTrack's AI does not make autonomous educational decisions. All AI-generated outputs are advisory. The educator retains sole, final authority over student placement, promotion, retention, and referral decisions.
            </p>
          </div>
        </section>

        {/* Section 11 - General */}
        <section className="space-y-4" aria-labelledby="section-11">
          <h2 id="section-11" className="font-display text-xl font-bold text-foreground">
            11. General Provisions
          </h2>
          <div className="pl-7 space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>11.1 Governing Law.</strong> These Terms shall be governed by and construed in accordance with the
              laws of the State of Utah, without regard to conflict of law principles.
            </p>
            <p>
              <strong>11.2 Amendments.</strong> LexiTrack reserves the right to modify these Terms with thirty (30) days'
              prior written notice to registered Users. Continued use of the Service after such notice constitutes
              acceptance of the amended Terms.
            </p>
            <p>
              <strong>11.3 Severability.</strong> If any provision of these Terms is held to be invalid or unenforceable,
              the remaining provisions shall continue in full force and effect.
            </p>
            <p>
              <strong>11.4 Conflict with DPA.</strong> In the event of a conflict between these Terms and a signed
              Student Data Privacy Agreement (DPA) with a Local Education Agency, the terms of the DPA shall prevail.
            </p>
            <p>
              <strong>11.5 Entire Agreement.</strong> These Terms, together with the{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>{" "}
              and any executed NDPA/DPA, constitute the entire agreement between the User and LexiTrack.
            </p>
            <p>
              <strong>11.6 Contact.</strong> For questions regarding these Terms, contact:{" "}
              <a href="mailto:dmedin42@byu.edu" className="text-primary hover:underline font-medium">
                dmedin42@byu.edu
              </a>.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} LexiTrack Education. All rights reserved.</p>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
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
};

export default Terms;
