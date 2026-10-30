# LexiTrack SQL Migrations

Run these in order in your Supabase SQL Editor.

---

## Migration 1: Core Tables

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- App roles enum
create type public.app_role as enum ('teacher', 'caregiver');

-- User roles table (security best practice: roles in separate table)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Teachers / Educators
create table public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  school text,
  created_at timestamptz default now()
);

-- Classes
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  name text not null,
  grade text not null,
  school_year text not null default '2025-2026',
  benchmark_wpm integer not null default 80,
  created_at timestamptz default now()
);

-- Students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  grade text not null,
  avatar text default '🧒',
  goal_wpm integer,
  goal_date date,
  created_at timestamptz default now()
);

-- Passages
create table public.passages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  grade_level text,
  word_count integer not null,
  created_at timestamptz default now()
);

-- Assessments
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  passage_id uuid references public.passages(id),
  passage_title text,
  date timestamptz not null default now(),
  fluency_score integer not null,
  accuracy_score integer not null,
  duration_seconds integer,
  created_at timestamptz default now()
);

-- Word-level assessment results
create table public.word_assessments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  word_index integer not null,
  word text not null,
  error_type text not null check (error_type in ('correct','substitution','mispronunciation','omission','insertion')),
  detected_word text,
  confidence integer default 0,
  offset_ms integer default 0,
  duration_ms integer default 0,
  vouched boolean default false,
  vouched_by uuid references public.teachers(id),
  vouched_at timestamptz
);

-- Phoneme details
create table public.phoneme_details (
  id uuid primary key default gen_random_uuid(),
  word_assessment_id uuid not null references public.word_assessments(id) on delete cascade,
  phoneme text not null,
  expected text not null,
  quality integer not null check (quality between 0 and 100)
);

-- Intervention clusters
create table public.intervention_clusters (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  error_pattern text not null,
  description text,
  severity text not null check (severity in ('high','medium','low')),
  suggested_activity text,
  created_at timestamptz default now()
);

-- Cluster membership
create table public.cluster_students (
  cluster_id uuid not null references public.intervention_clusters(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (cluster_id, student_id)
);

-- Caregivers
create table public.caregivers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz default now()
);

create table public.caregiver_students (
  caregiver_id uuid not null references public.caregivers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (caregiver_id, student_id)
);

-- Vouch audit log
create table public.vouch_log (
  id uuid primary key default gen_random_uuid(),
  word_assessment_id uuid not null references public.word_assessments(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id),
  original_error_type text not null,
  reason text,
  created_at timestamptz default now()
);
```

---

## Migration 2: RLS Policies

```sql
-- Enable RLS on all tables
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.passages enable row level security;
alter table public.assessments enable row level security;
alter table public.word_assessments enable row level security;
alter table public.phoneme_details enable row level security;
alter table public.intervention_clusters enable row level security;
alter table public.cluster_students enable row level security;
alter table public.caregivers enable row level security;
alter table public.caregiver_students enable row level security;
alter table public.vouch_log enable row level security;

-- Security definer: check role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Helper: get class IDs for current teacher
create or replace function public.get_teacher_class_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.classes where teacher_id = auth.uid();
$$;

-- Helper: get student IDs for current caregiver
create or replace function public.get_caregiver_student_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select student_id from public.caregiver_students where caregiver_id = auth.uid();
$$;

-- User roles: users can read their own roles
create policy "Users read own roles" on public.user_roles
  for select using (user_id = auth.uid());

-- Teachers: own row only
create policy "Teachers read own" on public.teachers for select using (id = auth.uid());
create policy "Teachers update own" on public.teachers for update using (id = auth.uid());

-- Classes: teacher owns
create policy "Classes select" on public.classes for select using (teacher_id = auth.uid());
create policy "Classes insert" on public.classes for insert with check (teacher_id = auth.uid());
create policy "Classes update" on public.classes for update using (teacher_id = auth.uid());
create policy "Classes delete" on public.classes for delete using (teacher_id = auth.uid());

-- Students: teacher's classes + caregiver's linked students
create policy "Students teacher select" on public.students for select using (class_id in (select public.get_teacher_class_ids()));
create policy "Students caregiver select" on public.students for select using (id in (select public.get_caregiver_student_ids()));
create policy "Students teacher insert" on public.students for insert with check (class_id in (select public.get_teacher_class_ids()));
create policy "Students teacher update" on public.students for update using (class_id in (select public.get_teacher_class_ids()));
create policy "Students teacher delete" on public.students for delete using (class_id in (select public.get_teacher_class_ids()));

-- Passages: readable by all authenticated
create policy "Passages read" on public.passages for select using (auth.uid() is not null);
create policy "Passages teacher insert" on public.passages for insert with check (public.has_role(auth.uid(), 'teacher'));

-- Assessments
create policy "Assessments teacher select" on public.assessments for select using (
  student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids()))
);
create policy "Assessments caregiver select" on public.assessments for select using (
  student_id in (select public.get_caregiver_student_ids())
);
create policy "Assessments teacher insert" on public.assessments for insert with check (
  student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids()))
);

-- Word assessments
create policy "Word assessments teacher select" on public.word_assessments for select using (
  assessment_id in (select a.id from public.assessments a where a.student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids())))
);
create policy "Word assessments caregiver select" on public.word_assessments for select using (
  assessment_id in (select a.id from public.assessments a where a.student_id in (select public.get_caregiver_student_ids()))
);
create policy "Word assessments teacher insert" on public.word_assessments for insert with check (
  assessment_id in (select a.id from public.assessments a where a.student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids())))
);
create policy "Word assessments teacher update" on public.word_assessments for update using (
  assessment_id in (select a.id from public.assessments a where a.student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids())))
);

-- Phoneme details
create policy "Phonemes teacher select" on public.phoneme_details for select using (
  word_assessment_id in (select wa.id from public.word_assessments wa join public.assessments a on wa.assessment_id = a.id join public.students s on a.student_id = s.id where s.class_id in (select public.get_teacher_class_ids()))
);
create policy "Phonemes caregiver select" on public.phoneme_details for select using (
  word_assessment_id in (select wa.id from public.word_assessments wa join public.assessments a on wa.assessment_id = a.id where a.student_id in (select public.get_caregiver_student_ids()))
);
create policy "Phonemes teacher insert" on public.phoneme_details for insert with check (
  word_assessment_id in (select wa.id from public.word_assessments wa join public.assessments a on wa.assessment_id = a.id join public.students s on a.student_id = s.id where s.class_id in (select public.get_teacher_class_ids()))
);

-- Clusters
create policy "Clusters select" on public.intervention_clusters for select using (class_id in (select public.get_teacher_class_ids()));
create policy "Clusters insert" on public.intervention_clusters for insert with check (class_id in (select public.get_teacher_class_ids()));
create policy "Clusters update" on public.intervention_clusters for update using (class_id in (select public.get_teacher_class_ids()));
create policy "Clusters delete" on public.intervention_clusters for delete using (class_id in (select public.get_teacher_class_ids()));

-- Cluster students
create policy "Cluster students select" on public.cluster_students for select using (
  cluster_id in (select ic.id from public.intervention_clusters ic where ic.class_id in (select public.get_teacher_class_ids()))
);
create policy "Cluster students insert" on public.cluster_students for insert with check (
  cluster_id in (select ic.id from public.intervention_clusters ic where ic.class_id in (select public.get_teacher_class_ids()))
);

-- Caregivers
create policy "Caregivers read own" on public.caregivers for select using (id = auth.uid());
create policy "Caregivers update own" on public.caregivers for update using (id = auth.uid());

-- Caregiver-student links: caregivers read own, teachers can insert
create policy "Caregiver students caregiver select" on public.caregiver_students for select using (caregiver_id = auth.uid());
create policy "Caregiver students teacher select" on public.caregiver_students for select using (
  student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids()))
);
create policy "Caregiver students teacher insert" on public.caregiver_students for insert with check (
  student_id in (select s.id from public.students s where s.class_id in (select public.get_teacher_class_ids()))
);

-- Vouch log
create policy "Vouch log teacher select" on public.vouch_log for select using (teacher_id = auth.uid());
create policy "Vouch log teacher insert" on public.vouch_log for insert with check (teacher_id = auth.uid());
```

---

## Migration 3: Auth Trigger (auto-create profile on signup)

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data->>'role' = 'caregiver' then
    insert into public.user_roles (user_id, role) values (new.id, 'caregiver');
    insert into public.caregivers (id, full_name, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  else
    insert into public.user_roles (user_id, role) values (new.id, 'teacher');
    insert into public.teachers (id, full_name, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## Post-Migration Setup: Edge Function Secrets

After running the migrations, ensure your Edge Function has the necessary Azure credentials:

1. **Set Secrets**:
   Run these in your terminal (if using Supabase CLI) or add them in the Supabase Dashboard:
   - `AZURE_SPEECH_KEY`: Your Azure Speech Service API Key.
   - `AZURE_SPEECH_REGION`: (Optional) Your Azure Region (e.g., `eastus`).

2. **Deploy Function**:
   ```bash
   supabase functions deploy assess-pronunciation
   ```

