-- Delete Sandbox Mode guest accounts older than a day, with everything they created.
create or replace function public.cleanup_guest_users(max_age interval default interval '24 hours')
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  expired uuid[];
  removed integer;
begin
  expired := array(
    select id from auth.users
     where is_anonymous and created_at < now() - max_age
  );
  if cardinality(expired) = 0 then
    return 0;
  end if;

  -- References to a teacher without ON DELETE CASCADE are cleared first.
  delete from public.vouch_log where teacher_id = any(expired);
  update public.word_assessments set vouched_by = null where vouched_by = any(expired);

  -- Classes cascade to students, assessments, word results, groups and assignments.
  delete from public.classes where teacher_id = any(expired);
  delete from public.students where teacher_id = any(expired);
  delete from public.passages where teacher_id = any(expired);

  -- The user cascades to teachers and user_roles.
  delete from auth.users where id = any(expired);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.cleanup_guest_users(interval) from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid) from cron.job where jobname = 'cleanup-guest-users';
select cron.schedule('cleanup-guest-users', '17 * * * *', $cron$select public.cleanup_guest_users()$cron$);
