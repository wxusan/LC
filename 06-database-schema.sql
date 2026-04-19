-- =====================================================================
--  LC Platform — Database schema + RLS + seed
--  Run this in the Supabase SQL Editor, in order, top to bottom.
--
--  After running:
--    1. Go to Authentication → Policies → verify RLS is ON for every table.
--    2. Create your super-admin user in Authentication → Users → Invite user,
--       then run the block at the very bottom to promote them.
--    3. Verify isolation with the cross-tenant test at the very end.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- citext = case-insensitive text; used for username so 'Malika' == 'malika'.
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'lc_admin', 'teacher', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lc_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type locale_code as enum ('en', 'ru', 'uz');
exception when duplicate_object then null; end $$;

-- User lifecycle. invited = invitation sent, never logged in.
-- active = working account. suspended = blocked from login (admin action).
-- archived = soft-deleted, kept for audit (do not show in lists).
do $$ begin
  create type user_status as enum ('invited', 'active', 'suspended', 'archived');
exception when duplicate_object then null; end $$;

-- Invitation lifecycle. Replaces deriving state from accepted_at + expires_at.
do $$ begin
  create type invite_status as enum ('pending', 'accepted', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

-- Class lifecycle. archived = old semester, kept for grade history.
-- cancelled = never ran (e.g., not enough enrollment).
do $$ begin
  create type class_status as enum ('active', 'archived', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------

-- Learning centers (tenants)
create table if not exists learning_centers (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  status        lc_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Profiles: one row per human, mirrors auth.users.id
-- Identity = phone_number (globally unique, E.164 format e.g. '+998901234567')
-- Handle   = username    (globally unique, citext, 3-24 chars, letters/digits/_-)
-- Supabase auth.users stores phone + encrypted_password; we mirror phone here
-- for convenience and add username for login UX. Email is INTENTIONALLY absent.
create table if not exists profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  phone_number        text unique not null,
  username            citext unique not null,
  full_name           text,
  role                user_role not null,
  status              user_status not null default 'invited',
  learning_center_id  uuid references learning_centers(id) on delete cascade,
  locale              locale_code not null default 'ru',
  created_at          timestamptz not null default now(),
  -- super_admin has no LC. Everyone else must.
  constraint lc_required_for_non_super
    check (role = 'super_admin' or learning_center_id is not null),
  -- Phone must look like E.164: '+' then 8-15 digits. We accept any country for
  -- dev, but the UI should only allow +998 for MVP.
  constraint phone_e164_shape
    check (phone_number ~ '^\+[1-9][0-9]{7,14}$'),
  -- Username: 3-24 chars, a-z0-9_- (we enforce lowercase via citext + regex).
  constraint username_shape
    check (username ~ '^[a-z0-9_-]{3,24}$')
);

-- Classes (scoped to an LC).
-- level   = free-form ("IELTS 5.5", "A2", "Intermediate") — filter/display only.
-- schedule = free-form ("Mon/Wed 18:00-20:00") — upgrade to structured sessions
--            when we add attendance in v1.0.
create table if not exists classes (
  id                  uuid primary key default uuid_generate_v4(),
  learning_center_id  uuid not null references learning_centers(id) on delete cascade,
  name                text not null,
  subject             text,
  level               text,
  schedule            text,
  status              class_status not null default 'active',
  created_at          timestamptz not null default now()
);

-- Teacher ↔ class (many-to-many)
create table if not exists class_teachers (
  class_id    uuid not null references classes(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  primary key (class_id, teacher_id)
);

-- Student ↔ class (many-to-many)
create table if not exists class_students (
  class_id    uuid not null references classes(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- Assignments (created by a teacher for a class)
create table if not exists assignments (
  id              uuid primary key default uuid_generate_v4(),
  class_id        uuid not null references classes(id) on delete cascade,
  teacher_id      uuid not null references profiles(id) on delete set null,
  title           text not null,
  description     text,
  due_at          timestamptz,
  attachment_url  text,
  created_at      timestamptz not null default now()
);

-- Submissions (by a student to an assignment)
create table if not exists submissions (
  id              uuid primary key default uuid_generate_v4(),
  assignment_id   uuid not null references assignments(id) on delete cascade,
  student_id      uuid not null references profiles(id) on delete cascade,
  text_answer     text,
  file_url        text,
  submitted_at    timestamptz not null default now(),
  grade           smallint check (grade between 0 and 100),
  feedback        text,
  graded_at       timestamptz,
  graded_by       uuid references profiles(id) on delete set null,
  -- A student submits once per assignment. Let them update until graded.
  unique (assignment_id, student_id)
);

-- Invitations (phone-based onboarding for LC admins, teachers, students).
-- Flow: LC admin enters a phone + role → we create an invitation row with a
-- random token AND we send an SMS to that phone with a deep link containing
-- the token. When the recipient opens the link, they see a "Set your username
-- + password" screen, we verify the token (server action, service role), then
-- create the auth.users row with their phone + password and the profile row.
create table if not exists invitations (
  id                  uuid primary key default uuid_generate_v4(),
  learning_center_id  uuid references learning_centers(id) on delete cascade,
  phone_number        text not null,
  role                user_role not null,
  status              invite_status not null default 'pending',
  class_id            uuid references classes(id) on delete cascade,
  invited_by          uuid references profiles(id) on delete set null,
  token               text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at          timestamptz not null default (now() + interval '7 days'),
  accepted_at         timestamptz,
  created_at          timestamptz not null default now(),
  constraint invite_phone_e164_shape
    check (phone_number ~ '^\+[1-9][0-9]{7,14}$')
);

-- SMS OTP audit + rate-limit log.
-- Every send attempt (login OTP, password reset OTP, invite SMS) gets a row.
-- We enforce "max N sends per phone per hour" in a server action by counting
-- rows here with sent_at > now() - interval '1 hour'.
create table if not exists sms_otp_log (
  id            uuid primary key default uuid_generate_v4(),
  phone_number  text not null,
  purpose       text not null check (purpose in ('login', 'password_reset', 'invite', 'verify')),
  success       boolean not null default true,
  -- Optional: hashed OTP code so we can verify without storing plaintext.
  -- NULL for invite SMS (which use a token link, not an OTP).
  code_hash     text,
  ip_address    inet,
  user_agent    text,
  sent_at       timestamptz not null default now(),
  constraint otp_phone_e164_shape
    check (phone_number ~ '^\+[1-9][0-9]{7,14}$')
);

-- Indexes for hot paths
create index if not exists idx_profiles_lc              on profiles(learning_center_id);
create index if not exists idx_profiles_phone           on profiles(phone_number);
create index if not exists idx_profiles_username        on profiles(username);
create index if not exists idx_classes_lc               on classes(learning_center_id);
create index if not exists idx_class_teachers_teacher   on class_teachers(teacher_id);
create index if not exists idx_class_students_student   on class_students(student_id);
create index if not exists idx_assignments_class        on assignments(class_id);
create index if not exists idx_submissions_assignment   on submissions(assignment_id);
create index if not exists idx_submissions_student      on submissions(student_id);
create index if not exists idx_invitations_token        on invitations(token);
create index if not exists idx_invitations_phone        on invitations(phone_number);
-- Rate-limit query: "how many sends to this phone in the last hour?"
create index if not exists idx_sms_otp_log_phone_time   on sms_otp_log(phone_number, sent_at desc);

-- ---------------------------------------------------------------------
-- 3. Helper functions
-- ---------------------------------------------------------------------

-- Read current user's role from profiles (SECURITY DEFINER so RLS doesn't block it).
create or replace function public.current_role()
returns user_role
language sql stable security definer
as $$
  select role from profiles where id = auth.uid();
$$;

-- Read current user's LC.
create or replace function public.current_lc()
returns uuid
language sql stable security definer
as $$
  select learning_center_id from profiles where id = auth.uid();
$$;

-- Is the current user super admin?
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

-- Does the current user teach this class?
create or replace function public.teaches_class(cls uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from class_teachers
    where class_id = cls and teacher_id = auth.uid()
  );
$$;

-- Is the current user a student in this class?
create or replace function public.is_student_in_class(cls uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from class_students
    where class_id = cls and student_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- 4. Row-Level Security
--    TURN RLS ON FIRST, then add policies.
--    Default-deny means: forget a policy = zero rows returned (safe).
-- ---------------------------------------------------------------------

alter table learning_centers enable row level security;
alter table profiles          enable row level security;
alter table classes           enable row level security;
alter table class_teachers    enable row level security;
alter table class_students    enable row level security;
alter table assignments       enable row level security;
alter table submissions       enable row level security;
alter table invitations       enable row level security;
alter table sms_otp_log       enable row level security;

-- ------- learning_centers -------
-- Super admin: full access.
create policy "lc_super_admin_all" on learning_centers
  for all using (is_super_admin()) with check (is_super_admin());

-- LC admin: read their own LC only.
create policy "lc_self_read" on learning_centers
  for select using (id = current_lc());

-- ------- profiles -------
-- A user can always see their own profile.
create policy "profiles_self_read" on profiles
  for select using (id = auth.uid());

-- A user can update their own profile (name, locale).
create policy "profiles_self_update" on profiles
  for update using (id = auth.uid());

-- Super admin: read all profiles.
create policy "profiles_super_read" on profiles
  for select using (is_super_admin());

-- LC admin + teacher + student: read profiles in their LC.
create policy "profiles_lc_read" on profiles
  for select using (learning_center_id = current_lc());

-- Profiles are created at invite-accept time via a server action (service role),
-- so no INSERT policy for end users. Same for DELETE (soft-delete via LC status).

-- ------- classes -------
-- Super admin: read all classes.
create policy "classes_super_read" on classes
  for select using (is_super_admin());

-- Anyone in the same LC can read classes.
create policy "classes_lc_read" on classes
  for select using (learning_center_id = current_lc());

-- LC admin: write classes in their own LC.
create policy "classes_lc_admin_write" on classes
  for all using (
    current_role() = 'lc_admin' and learning_center_id = current_lc()
  ) with check (
    current_role() = 'lc_admin' and learning_center_id = current_lc()
  );

-- ------- class_teachers -------
create policy "ct_super_read" on class_teachers
  for select using (is_super_admin());

create policy "ct_lc_read" on class_teachers
  for select using (
    exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc())
  );

create policy "ct_lc_admin_write" on class_teachers
  for all using (
    current_role() = 'lc_admin'
    and exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc())
  ) with check (
    current_role() = 'lc_admin'
    and exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc())
  );

-- ------- class_students -------
create policy "cs_super_read" on class_students
  for select using (is_super_admin());

create policy "cs_lc_admin_teacher_read" on class_students
  for select using (
    (current_role() = 'lc_admin'
      and exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc()))
    or teaches_class(class_id)
  );

-- Student can see their own memberships only.
create policy "cs_student_self_read" on class_students
  for select using (student_id = auth.uid());

create policy "cs_lc_admin_write" on class_students
  for all using (
    current_role() = 'lc_admin'
    and exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc())
  ) with check (
    current_role() = 'lc_admin'
    and exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc())
  );

-- ------- assignments -------
create policy "assignments_super_read" on assignments
  for select using (is_super_admin());

-- Teacher: CRUD in classes they teach.
create policy "assignments_teacher_crud" on assignments
  for all using (teaches_class(class_id))
  with check (teaches_class(class_id));

-- Student: read assignments in classes they're in.
create policy "assignments_student_read" on assignments
  for select using (is_student_in_class(class_id));

-- LC admin: read all assignments in their LC (not write — teachers own this).
create policy "assignments_lc_admin_read" on assignments
  for select using (
    current_role() = 'lc_admin'
    and exists (select 1 from classes c where c.id = class_id and c.learning_center_id = current_lc())
  );

-- ------- submissions -------
create policy "submissions_super_read" on submissions
  for select using (is_super_admin());

-- Student: read own, insert own, update own UNTIL graded.
create policy "submissions_student_own" on submissions
  for select using (student_id = auth.uid());

create policy "submissions_student_insert" on submissions
  for insert with check (
    student_id = auth.uid()
    and exists (
      select 1 from assignments a
      where a.id = assignment_id and is_student_in_class(a.class_id)
    )
  );

create policy "submissions_student_update_ungraded" on submissions
  for update using (
    student_id = auth.uid() and grade is null
  ) with check (
    student_id = auth.uid() and grade is null
  );

-- Teacher: read + grade submissions in classes they teach.
create policy "submissions_teacher_rw" on submissions
  for all using (
    exists (
      select 1 from assignments a
      where a.id = assignment_id and teaches_class(a.class_id)
    )
  ) with check (
    exists (
      select 1 from assignments a
      where a.id = assignment_id and teaches_class(a.class_id)
    )
  );

-- LC admin: read submissions metadata (no grade/feedback contents restriction here;
-- at the application layer, hide text_answer/file_url/feedback from LC admin UI).
create policy "submissions_lc_admin_read" on submissions
  for select using (
    current_role() = 'lc_admin'
    and exists (
      select 1 from assignments a
      join classes c on c.id = a.class_id
      where a.id = assignment_id and c.learning_center_id = current_lc()
    )
  );

-- ------- invitations -------
create policy "invitations_super_all" on invitations
  for all using (is_super_admin()) with check (is_super_admin());

-- LC admin: read + create invitations scoped to their LC.
create policy "invitations_lc_admin_read" on invitations
  for select using (
    current_role() = 'lc_admin' and learning_center_id = current_lc()
  );

create policy "invitations_lc_admin_insert" on invitations
  for insert with check (
    current_role() = 'lc_admin' and learning_center_id = current_lc()
  );

-- Public read of invitations by token happens in a server action using the service role key,
-- so no end-user SELECT policy for anonymous lookups.

-- ------- sms_otp_log -------
-- Only the service role writes here (from server actions that send SMS).
-- Super admin can read for abuse investigation; everyone else is blocked.
create policy "otp_super_read" on sms_otp_log
  for select using (is_super_admin());
-- No end-user INSERT/SELECT/UPDATE/DELETE policies.
-- Writes happen via service role (bypasses RLS) in server actions.

-- ---------------------------------------------------------------------
-- 5. Block suspended / deleted LCs
-- ---------------------------------------------------------------------
-- Users whose LC is suspended or deleted should not be able to read anything.
-- Enforce at the profiles layer: their current_lc() still returns, but we gate
-- on LC status via a trigger on login, OR check in the app layer. For simplicity,
-- check LC status in the app layer on each login. Belt-and-suspenders later.

-- ---------------------------------------------------------------------
-- 6. Seed data — demo LC for the hackathon
-- ---------------------------------------------------------------------
-- This section creates a demo Learning Center with realistic Uzbek names
-- AFTER you have created the auth.users. Since Supabase manages auth.users,
-- you'll run a separate script (in Node or the Supabase CLI) to create the
-- auth users and then run this. For a pure SQL path, fake the user IDs:

-- NOTE: Replace the UUIDs below with real auth.users IDs after creating
-- corresponding accounts in Supabase Authentication → Users. The easiest
-- path is:
--   1. Create the users in Supabase Auth with phone + password (NOT email).
--      Use the admin API or the dashboard "Add user" → phone flow.
--      For hackathon demo mode, use these 5 magic phones that bypass the
--      SMS provider and accept OTP = 123456:
--        +998000000001 (admin)
--        +998000000002 (teacher1)
--        +998000000003 (teacher2)
--        +998000000004 (student1)
--        +998000000005 (student2)
--   2. Copy their UUIDs
--   3. Paste them into this block as the profiles.id
--   4. Run the rest of the seed

-- Sample block — UNCOMMENT AND EDIT after creating auth users:
-- insert into learning_centers (id, name, slug) values
--   ('11111111-1111-1111-1111-111111111111', 'Einstein Academy', 'einstein-academy');
--
-- insert into profiles (id, phone_number, username, full_name, role, learning_center_id, locale) values
--   ('<uuid-of-admin-user>',   '+998000000001', 'dilnoza',  'Dilnoza Karimova',  'lc_admin', '11111111-1111-1111-1111-111111111111', 'uz'),
--   ('<uuid-of-teacher1>',     '+998000000002', 'javohir',  'Javohir Tursunov',  'teacher',  '11111111-1111-1111-1111-111111111111', 'uz'),
--   ('<uuid-of-teacher2>',     '+998000000003', 'aziza',    'Aziza Yusupova',    'teacher',  '11111111-1111-1111-1111-111111111111', 'ru'),
--   ('<uuid-of-student1>',     '+998000000004', 'malika',   'Malika Rashidova',  'student',  '11111111-1111-1111-1111-111111111111', 'uz'),
--   ('<uuid-of-student2>',     '+998000000005', 'sherzod',  'Sherzod Bakirov',   'student',  '11111111-1111-1111-1111-111111111111', 'uz'),
--   ('<uuid-of-student3>',     '+998000000006', 'nigora',   'Nigora Alimova',    'student',  '11111111-1111-1111-1111-111111111111', 'ru');
--
-- insert into classes (id, learning_center_id, name, subject) values
--   ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'IELTS Intermediate', 'English'),
--   ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'SAT Math Prep',      'Math');
--
-- insert into class_teachers (class_id, teacher_id) values
--   ('22222222-2222-2222-2222-222222222221', '<uuid-of-teacher1>'),
--   ('22222222-2222-2222-2222-222222222222', '<uuid-of-teacher2>');
--
-- insert into class_students (class_id, student_id) values
--   ('22222222-2222-2222-2222-222222222221', '<uuid-of-student1>'),
--   ('22222222-2222-2222-2222-222222222221', '<uuid-of-student2>'),
--   ('22222222-2222-2222-2222-222222222222', '<uuid-of-student2>'),
--   ('22222222-2222-2222-2222-222222222222', '<uuid-of-student3>');
--
-- insert into assignments (id, class_id, teacher_id, title, description, due_at) values
--   ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', '<uuid-of-teacher1>',
--    'Essay: My favorite book', 'Write 250 words about a book that changed how you think.', now() + interval '5 days');
--
-- insert into submissions (assignment_id, student_id, text_answer) values
--   ('33333333-3333-3333-3333-333333333331', '<uuid-of-student1>', 'The book that changed me is...');

-- ---------------------------------------------------------------------
-- 7. Promote a user to super_admin (run after creating yourself in Auth)
-- ---------------------------------------------------------------------
-- update profiles set role = 'super_admin', learning_center_id = null
-- where phone_number = '+998901234567';
-- -- or by username:
-- update profiles set role = 'super_admin', learning_center_id = null
-- where username = 'xusan';

-- ---------------------------------------------------------------------
-- 8. Cross-tenant isolation test (run as a sanity check)
-- ---------------------------------------------------------------------
-- Create two LCs, two LC admins (in Auth + profiles), then as user B try to read user A's classes.
-- Run this with supabase-js from the client, not here. Expected: zero rows.
--
-- const { data } = await supabase.from('classes').select('*');
-- console.assert(data.every(c => c.learning_center_id === myLcId),
--                'CROSS-TENANT LEAK — RLS is broken');
--
-- If that assertion fails in your integration test, STOP and fix before shipping.

-- ---------------------------------------------------------------------
-- End of schema
-- ---------------------------------------------------------------------
