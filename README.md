# LexiTrack

**AI-powered reading fluency assessments for K–6 teachers.**

Oral reading fluency checks usually mean pulling students out one at a time and scoring every word by hand. LexiTrack lets a student read a passage aloud on any device. Azure's pronunciation assessment then scores each word and phoneme, and the teacher gets accuracy, words per minute, and growth over time without hand-scoring.

**Live demo:** https://lexitrackedu.com (try **Sandbox Mode**, no account needed)

## Features

- **Read-aloud assessments.** Students join with a class code and read a passage. Audio goes to a Supabase Edge Function that calls Azure Pronunciation Assessment and returns word- and phoneme-level scores.
- **Fluency metrics.** Accuracy, wall-clock words per minute, adjustable grading strictness, and comprehension retells transcribed from speech.
- **Teacher dashboard.** Class overview, per-student history and progress charts, benchmark tracking, and error-pattern insights.
- **Intervention clusters.** Groups students who struggle with similar sounds so teachers can plan small-group instruction.
- **Parent reports.** Shareable, student-friendly progress reports for caregivers.
- **Sandbox mode.** One click signs you in as a guest teacher with your own sample class (8 students, ten weeks of reading history, intervention groups, an open assignment). Every feature works on real data, including recording new assessments, and the guest account is deleted after 24 hours.
- **Fully open.** No paywalls or plan limits: every feature is available to every account.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Framer Motion |
| Backend | Supabase (Postgres with row-level security, Auth, Edge Functions on Deno) |
| AI / speech | Azure AI Speech: Pronunciation Assessment and speech-to-text |
| Hosting | Vercel |
| Testing | Vitest, Testing Library |

## Project structure

```
src/
  pages/                 Routes (dashboard, student portal, sandbox, reports, ...)
  components/            Feature components and shadcn/ui primitives (ui/)
  integrations/supabase  Supabase client and generated database types
  lib/                   Scoring helpers, clustering, config
  test/                  Unit tests
supabase/
  functions/             Edge Functions (assess-pronunciation, transcribe-retell, get-parent-report, ...)
  functions/_shared/     Azure client, scoring math, database helpers
  migrations/            Database schema
SQL_MIGRATIONS.md        Full schema walkthrough
GUIDE_CI_SECRETS.md      How server-side secrets are managed
```

## Running it locally

Requires Node.js 18 or newer and a Supabase project.

```bash
git clone https://github.com/dmedin42/lexitrack.git
cd lexitrack
npm install
cp .env.example .env    # then fill in your Supabase URL and anon key
npm run dev             # http://localhost:8080
```

### Backend setup

1. Create the database schema from `supabase/migrations/` (or follow `SQL_MIGRATIONS.md`).
2. Deploy the Edge Functions: `supabase functions deploy`.
3. Set the server-side secrets in Supabase (**Edge Functions → Secrets**). They are never sent to the browser:

| Secret | Used for |
| --- | --- |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Pronunciation scoring and retell transcription |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically.

### Sandbox Mode

Sandbox Mode uses Supabase anonymous sign-ins, so turn on **Allow anonymous sign-ins** under **Authentication → Sign In / Providers**. When an anonymous user signs up, the `handle_new_user` trigger makes them a guest teacher and `seed_lexitrack_guest` builds their sample class (`supabase/migrations/20261105060000_guest_sandbox.sql`). An hourly `pg_cron` job, `cleanup_guest_users`, deletes guest accounts older than 24 hours along with their data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run lint` | Lint the code |

## Author

Built by [David Medina](https://david-medina.me), Information Systems student at BYU.
