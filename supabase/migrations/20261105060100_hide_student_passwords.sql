-- Stop sending student passwords to the browser.
--
-- Apply this after the app version that checks passwords with
-- verify_student_password() is deployed; older versions compare passwords in the
-- browser and would reject every student while this is in place.
create or replace function public.get_students_for_login(class_id_input uuid)
returns table(id uuid, username text, student_password text, name text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.username, null::text as student_password, s.name, s.avatar
    from public.students s
   where s.class_id = class_id_input
     and s.username is not null
   order by s.name
$$;

