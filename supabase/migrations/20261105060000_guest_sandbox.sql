-- Guest sandbox
--
-- "Try Sandbox Mode" signs visitors in with a Supabase anonymous session. The
-- signup trigger turns that session into a guest teacher with a sample 3rd-grade
-- class: students, about ten weeks of reading assessments with word-level
-- results, intervention groups, passages, and an open assignment. Everything in
-- the app works on that data. Guest accounts are removed after 24 hours (see the
-- cleanup migration).
--
-- Because anyone can now become a signed-in teacher with one click, this also
-- closes gaps that trusted any signed-in teacher or any visitor:
--   * any teacher could edit or delete every teacher's passages
--   * any signed-in user could read the launch-interest email list
--   * student login sent every student's password to the browser (the check now
--     happens in the database; the next migration stops sending passwords)

-- ---------------------------------------------------------------------------
-- 1. Sample class for a new guest teacher
-- ---------------------------------------------------------------------------
create or replace function public.seed_lexitrack_guest(p_teacher uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class uuid;
  v_assign_passage uuid;
  v_passages uuid[] := '{}';
  v_pid uuid;
  v_suffix text := left(replace(p_teacher::text, '-', ''), 6);
  v_days int[] := array[52, 38, 24, 11, 2];
  st record;
  v_student uuid;
  k int;
  v_passage record;
  v_words text[];
  n int;
  i int;
  w text;
  r numeric;
  r2 numeric;
  h int;
  v_type text;
  v_detected text;
  v_acc int;
  v_dur int;
  v_t numeric;
  v_ms_per_word numeric;
  v_target_wpm numeric;
  v_scale numeric;
  p_omit numeric;
  p_misp numeric;
  p_sub numeric;
  v_chunks text[];
  v_low int;
  j int;
  v_ph jsonb;
  v_item jsonb;
  v_analysis jsonb;
  v_correct int;
  v_attempted int;
  v_first int;
  v_last int;
  v_wpm int;
  v_accuracy int;
  v_fluency int;
  v_assessment uuid;
  v_date timestamptz;
  v_wa_rows jsonb;
begin
  -- Only seed a teacher who has no classes yet.
  if exists (select 1 from public.classes where teacher_id = p_teacher) then
    return;
  end if;

  -- Original passages written for the sandbox.
  for v_passage in
    select * from (values
      (1, 'The Lighthouse Keeper''s Cat', '3',
       'Every night, Pip the cat climbed the winding stairs of the old lighthouse. At the top, she sat beside the great lamp and watched the boats sail home. When fog rolled in from the sea, the keeper turned the light up bright. Pip would press her nose against the cold glass and stare at the gray water. One stormy evening, she spotted a small fishing boat drifting toward the rocks. Pip meowed loudly until the keeper rushed upstairs. He sounded the foghorn three times, and the boat turned away just in time. The sailors waved their caps, and Pip curled up for a well-earned nap.'),
      (2, 'Planting a Garden', '3',
       'On Saturday morning, Leah and her grandpa planted a garden behind the house. First they pulled the weeds and raked the soil until it was soft and dark. Grandpa showed Leah how to dig small holes with a trowel. She dropped two seeds into each hole and gently covered them with dirt. They planted beans, carrots, and bright yellow sunflowers. Leah filled the watering can and gave every row a long drink. Each day after school, she checked for tiny green sprouts. After two weeks, the first leaves finally poked through the ground, and Leah cheered so loudly that the neighbors laughed.'),
      (3, 'The Great Snow Day', '3',
       'When Marcus woke up, the whole town was covered in snow. School was closed, so he pulled on his boots, his coat, and his warmest mittens. Outside, the air was so cold that his breath made little clouds. Marcus and his sister built a snowman with a carrot nose and buttons made of stones. Then they dragged their sled to the top of Maple Hill. The ride down was fast and bumpy, and they tumbled into a soft drift at the bottom. By lunchtime their cheeks were bright red. Mom made hot cocoa, and they told her every detail of their great adventure.'),
      (4, 'How Bees Help Flowers', '3',
       'Bees are busy insects that help many plants grow. When a bee lands on a flower, it drinks a sweet liquid called nectar. While it feeds, yellow dust called pollen sticks to the tiny hairs on its body. Then the bee flies to another flower, and some of the pollen rubs off. This helps the flower make seeds, which can grow into new plants. Without bees, we would have fewer apples, berries, and pumpkins. Bees also make honey from nectar and store it in their hive for winter. Next time you see a bee, remember how important its job is.')
    ) as t(ord, title, grade, content)
    order by ord
  loop
    insert into public.passages (title, content, grade_level, word_count, teacher_id)
    values (v_passage.title, v_passage.content, v_passage.grade,
            array_length(regexp_split_to_array(trim(v_passage.content), '\s+'), 1), p_teacher)
    returning id into v_pid;
    if v_passage.ord = 4 then
      v_assign_passage := v_pid;
    else
      v_passages := v_passages || v_pid;
    end if;
  end loop;

  insert into public.classes
    (teacher_id, name, grade, school_year, benchmark_wpm, default_time_limit,
     word_map_enabled, deep_dive_enabled, student_results_visible,
     show_wpm_to_student, show_accuracy_to_student)
  values
    (p_teacher, 'Room 12', '3rd', '2026-2027', 90, 60, true, true, true, true, true)
  returning id into v_class;

  -- Students: reading rate (WPM) at the first and latest assessment, and error
  -- rates on the latest one. Earlier assessments have more errors for students
  -- who are improving.
  for st in
    select * from (values
      ('Maya',  '🦊', 125, 98, 121, 0.005, 0.015, 0.005, 0.6),
      ('Sofia', '🌻', 120, 104, 116, 0.005, 0.020, 0.005, 0.4),
      ('Ava',   '🦋', 105, 84, 101, 0.010, 0.050, 0.010, 0.6),
      ('Noah',  '🐬', 95, 70, 88, 0.030, 0.050, 0.020, 0.6),
      ('Sam',   '🚀', 95, 66, 92, 0.020, 0.040, 0.030, 1.0),
      ('Zoe',   '🐼', 95, 74, 86, 0.010, 0.030, 0.190, 0.5),
      ('Leo',   '🐢', 80, 52, 66, 0.040, 0.260, 0.020, 0.5),
      ('Eli',   '🦉', 80, 62, 64, 0.200, 0.050, 0.020, 0.0)
    ) as t(name, avatar, goal, wpm_start, wpm_end, omit_end, misp_end, sub_end, improve)
  loop
    insert into public.students
      (class_id, teacher_id, name, grade, avatar, username, student_password, goal_wpm, goal_date)
    values
      (v_class, p_teacher, st.name, '3rd', st.avatar,
       lower(st.name) || '-' || v_suffix, '1234', st.goal, date '2027-05-21')
    returning id into v_student;

    for k in 0..4 loop
      select id, title, content into v_passage
        from public.passages where id = v_passages[(k % 3) + 1];
      v_words := regexp_split_to_array(trim(v_passage.content), '\s+');
      n := array_length(v_words, 1);

      -- Earlier assessments: slower and, for improving students, less accurate.
      v_scale := 1 + st.improve * (4 - k) / 4.0;
      p_omit := st.omit_end * v_scale;
      p_misp := st.misp_end * v_scale;
      p_sub  := st.sub_end * v_scale;
      h := abs(hashtext(v_student::text || k::text));
      v_target_wpm := st.wpm_start + (st.wpm_end - st.wpm_start) * k / 4.0 + (h % 7) - 3;
      -- Time per attempted word, so that correct words per minute lands near the target.
      v_ms_per_word := 60000.0 / (v_target_wpm / greatest(0.55, 1 - p_misp - p_sub));

      v_t := 500 + (h % 400);
      v_analysis := '[]'::jsonb;
      v_wa_rows := '[]'::jsonb;
      v_correct := 0; v_attempted := 0; v_first := null; v_last := 0;

      for i in 1..n loop
        w := regexp_replace(v_words[i], '[^A-Za-z''-]', '', 'g');
        if w = '' then
          w := v_words[i];
        end if;
        h := abs(hashtext(v_student::text || ':' || k::text || ':' || i::text));
        r := (h % 10000) / 10000.0;
        r2 := ((h / 10000) % 1000) / 1000.0;
        v_detected := null;
        v_chunks := array(select m[1] from regexp_matches(lower(w), '[aeiouy]+|[^aeiouy]+', 'g') as m);
        if coalesce(array_length(v_chunks, 1), 0) = 0 then
          v_chunks := array[lower(w)];
        end if;

        -- The 60-second reading window: words past it were never reached.
        if v_t > 60500 then
          v_item := jsonb_build_object('word', w, 'word_index', i - 1, 'error_type', 'unread',
                                       'accuracy_score', 0, 'offset_ms', 0, 'duration_ms', 0,
                                       'phonemes', '[]'::jsonb);
          v_analysis := v_analysis || jsonb_build_array(v_item);
          continue;
        end if;

        -- Short words are easier.
        if length(w) <= 2 then
          r := r * 2;
        end if;

        if r < p_omit then
          v_type := 'omission';
        elsif r < p_omit + p_misp then
          v_type := 'mispronunciation';
        elsif r < p_omit + p_misp + p_sub then
          v_type := 'substitution';
          v_detected := case when length(w) >= 4 then left(w, 1) || substr(w, 3) else w || 's' end;
        else
          v_type := 'correct';
        end if;

        v_attempted := v_attempted + 1;

        if v_type = 'omission' then
          v_item := jsonb_build_object('word', w, 'word_index', i - 1, 'error_type', 'omission',
                                       'accuracy_score', 0, 'offset_ms', round(v_t), 'duration_ms', 0,
                                       'phonemes', '[]'::jsonb);
          v_t := v_t + 120;
        else
          v_dur := round(v_ms_per_word * 0.7 * (0.85 + 0.3 * r2));
          v_acc := case v_type
                     when 'correct' then 85 + (h % 15)
                     when 'mispronunciation' then 30 + (h % 30)
                     else 25 + (h % 30)
                   end;
          if v_type = 'correct' then
            v_correct := v_correct + 1;
          end if;

          -- Sound-chunk scores: one weak chunk for a mispronounced word.
          v_low := (h % array_length(v_chunks, 1)) + 1;
          v_ph := '[]'::jsonb;
          for j in 1..array_length(v_chunks, 1) loop
            v_ph := v_ph || jsonb_build_array(jsonb_build_object(
              'phoneme', v_chunks[j],
              'offset_ms', round(v_t + (j - 1) * v_dur / array_length(v_chunks, 1)::numeric),
              'duration_ms', v_dur / array_length(v_chunks, 1),
              'accuracy_score', case
                when v_type = 'correct' then 80 + ((h / (j + 3)) % 20)
                when v_type = 'mispronunciation' and j = v_low then 15 + ((h / (j + 3)) % 30)
                when v_type = 'mispronunciation' then 65 + ((h / (j + 3)) % 30)
                else 35 + ((h / (j + 3)) % 35)
              end));
          end loop;

          v_item := jsonb_build_object('word', w, 'word_index', i - 1, 'error_type', v_type,
                                       'accuracy_score', v_acc, 'offset_ms', round(v_t),
                                       'duration_ms', v_dur, 'phonemes', v_ph);
          if v_detected is not null then
            v_item := v_item || jsonb_build_object('detected_word', v_detected);
          end if;
          if v_first is null then
            v_first := round(v_t);
          end if;
          v_last := round(v_t) + v_dur;
          v_t := v_t + v_ms_per_word * (0.9 + 0.2 * r2);
        end if;

        v_analysis := v_analysis || jsonb_build_array(v_item);
        v_wa_rows := v_wa_rows || jsonb_build_array(jsonb_build_object(
          'word_index', i - 1, 'word', w, 'error_type', v_type, 'detected_word', v_detected,
          'confidence', (v_item->>'accuracy_score')::int,
          'offset_ms', (v_item->>'offset_ms')::int, 'duration_ms', (v_item->>'duration_ms')::int));
      end loop;

      -- Same formulas the app uses when it recalculates after a teacher correction.
      v_accuracy := case when v_attempted > 0 then round(v_correct * 100.0 / v_attempted) else 0 end;
      v_wpm := case when v_last - coalesce(v_first, 0) > 5000
                    then round(v_correct / ((v_last - v_first) / 60000.0)) else 0 end;
      h := abs(hashtext(v_student::text || 'scores' || k::text));
      v_fluency := least(99, greatest(35, round(v_wpm * 0.45 + v_accuracy * 0.4 + (h % 6))));
      v_date := now() - make_interval(days => v_days[k + 1], hours => (h % 6) + 1);

      insert into public.assessments
        (student_id, passage_id, passage_title, date, created_at, wpm, accuracy_score,
         fluency_score, completeness_score, prosody_score, duration_seconds, word_analysis)
      values
        (v_student, v_passage.id, v_passage.title, v_date, v_date, v_wpm, v_accuracy,
         v_fluency, round(v_attempted * 100.0 / n), least(97, greatest(40, v_fluency - 6 + (h % 10))),
         round(v_t / 1000.0, 1), v_analysis)
      returning id into v_assessment;

      insert into public.word_assessments
        (assessment_id, word_index, word, error_type, detected_word, confidence, offset_ms, duration_ms, created_at)
      select v_assessment, (x->>'word_index')::int, x->>'word', x->>'error_type', x->>'detected_word',
             (x->>'confidence')::int, (x->>'offset_ms')::int, (x->>'duration_ms')::int, v_date
        from jsonb_array_elements(v_wa_rows) as x;
    end loop;

    -- Everyone has the nonfiction passage assigned and open in the student portal.
    insert into public.active_assignments
      (student_id, passage_id, assigned_by, is_open, word_map_enabled, deep_dive_enabled)
    values (v_student, v_assign_passage, p_teacher, true, true, true);
  end loop;

  -- Intervention groups, using the same pattern names as the app's cluster analysis.
  with groups(pattern, description, severity, activity, members) as (values
    ('Mispronunciation', 'Students struggling with correct phoneme production.', 'medium',
     'Focus on phoneme isolation drills for the target sounds. Use mirrors for mouth position.',
     array['Leo']),
    ('Omission Errors', 'Students who frequently skip words while reading.', 'medium',
     'Practice echo reading — have students repeat each sentence line by line.',
     array['Eli']),
    ('Substitution Errors', 'Students who replace words with different words while reading.', 'medium',
     'Guided re-reading with a finger tracker. Slow down and point to each word.',
     array['Zoe']),
    ('Strong Reader', 'Students with fewer than 5% total errors — on track or exceeding expectations.', 'low',
     'Offer extension passages at the next grade level to maintain engagement.',
     array['Maya', 'Sofia'])
  ), made as (
    insert into public.intervention_clusters (class_id, error_pattern, description, severity, suggested_activity)
    select v_class, pattern, description, severity, activity from groups
    returning id, error_pattern
  )
  insert into public.cluster_students (cluster_id, student_id)
  select made.id, s.id
    from made
    join groups g on g.pattern = made.error_pattern
    join public.students s on s.class_id = v_class and s.name = any(g.members);
end;
$$;

revoke all on function public.seed_lexitrack_guest(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Signup trigger: anonymous sessions become seeded guest teachers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role public.app_role;
  is_guest boolean := coalesce(new.is_anonymous, false);
begin
  if is_guest then
    user_role := 'teacher';
  else
    user_role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'teacher'::public.app_role);
  end if;

  insert into public.user_roles (user_id, role) values (new.id, user_role);

  if user_role = 'teacher' then
    insert into public.teachers (id, full_name, email, school, onboarding_completed)
    values (
      new.id,
      case when is_guest then 'Guest Teacher'
           else coalesce(new.raw_user_meta_data->>'full_name', 'Teacher Name') end,
      coalesce(new.email, 'guest-' || left(new.id::text, 8) || '@sandbox.lexitrackedu.com'),
      case when is_guest then 'LexiTrack Sandbox Elementary' else null end,
      is_guest
    );
  end if;

  -- A seeding problem must never block the sign-in itself.
  if is_guest then
    begin
      perform public.seed_lexitrack_guest(new.id);
    exception when others then
      raise warning 'seed_lexitrack_guest failed for %: %', new.id, sqlerrm;
    end;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Tighter access now that anyone can become a signed-in teacher
-- ---------------------------------------------------------------------------

-- Teachers can only change or remove their own passages.
alter policy "Passages teacher update" on public.passages
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());
alter policy "Passages teacher delete" on public.passages
  using (teacher_id = auth.uid());

-- The launch-interest email list is readable only with the service role.
alter policy "Authenticated users can read" on public.launch_interest
  using (auth.role() = 'service_role');

-- Student login: the database checks passwords. (Hiding them from the login list
-- ships separately, once the app uses this check; see the next migration.)
create or replace function public.verify_student_password(student_id_input uuid, password_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
     where s.id = student_id_input
       and s.student_password is not null
       and s.student_password = password_input
  )
$$;

revoke all on function public.verify_student_password(uuid, text) from public;
grant execute on function public.verify_student_password(uuid, text) to anon, authenticated;

-- Class lists for student login are scoped to one teacher's link.
create or replace function public.get_classes_for_login(teacher_id_input uuid default null)
returns table(id uuid, name text, grade text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.grade
    from public.classes c
   where c.teacher_id = teacher_id_input
   order by c.name
$$;

-- The unscoped version listed every class in the database and is unused.
revoke all on function public.get_classes_for_login() from public, anon, authenticated;

-- Leftover from the removed paid plans.
revoke all on function public.increment_plan_view(uuid) from public, anon;
