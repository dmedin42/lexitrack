-- New classes start with a grading strictness of 8.8 (Azure threshold 88).
-- Existing classes keep whatever strictness their teacher already set.
alter table public.classes alter column grading_strictness set default 8.8;
