# LC — Learning Center Platform

Multi-tenant learning-center platform. Four roles (`super_admin`, `lc_admin`, `teacher`, `student`) live behind URL prefixes `/admin`, `/lc`, `/teach`, `/learn`.

Built on Next.js 14 (App Router) + Supabase + Supabase Auth. Phone-OTP login for Uzbekistan via Eskiz.uz (with a mock provider for dev).

## Quick start

```bash
cd app
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# SMS_PROVIDER=mock keeps OTPs in the console + UI toast (no real SMS sent)
npm run dev
```

Open <http://localhost:3000>. You'll land on `/login`.

## Environment variables

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + cookie-scoped server client |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role client for invites, auth provisioning, OTP issuance |
| `SMS_PROVIDER` | `mock` (logs OTP) or `eskiz` (real) |
| `ESKIZ_EMAIL` / `ESKIZ_PASSWORD` / `ESKIZ_FROM` | Eskiz.uz credentials |
| `OTP_TTL_SECONDS` | Default 300 |
| `OTP_MAX_ATTEMPTS` / `OTP_LOCKOUT_MINUTES` | Brute-force gate |
| `INVITATION_TTL_DAYS` | Default 7 |
| `NEXT_PUBLIC_APP_URL` | Used to build invitation links |

## Database

Apply `../06-database-schema.sql` to your Supabase project — it creates all tables (`learning_centers`, `profiles`, `classes`, `class_teachers`, `class_students`, `assignments`, `submissions`, `invitations`, `sms_otp_log`) plus the RLS helper functions (`is_super_admin()`, `current_lc()`, `teaches_class()`, `is_student_in_class()`).

After schema is applied, create the first super admin manually in Supabase Auth, then insert a matching row in `public.profiles` with `role='super_admin'`.

## Architecture

- `app/` — App Router routes grouped by role prefix. Each role has `layout.tsx` that enforces role gating.
- `components/shell/` — `AppShell`, `Sidebar`, `TopBar`. Responsive; mobile drawer for sidebar.
- `components/ui/` — Design-system primitives (Button, Input, Modal, Drawer, Tabs, Card, Badge, etc.).
- `lib/supabase/` — Cookie-scoped and service-role clients; middleware session refresher.
- `lib/auth/` — OTP generation + hashing, synthetic-email mapping, session issuance via `admin.generateLink` + `verifyOtp`, server actions for login/reset/invite.
- `lib/sms/` — Pluggable SMS provider interface with `MockSmsProvider` and `EskizSmsProvider`.
- `lib/data/` — Server actions + read helpers for learning_centers, invitations, classes, people, assignments, submissions.

## Auth flow

Supabase Auth uses email + password internally, but the UI shows phone-OTP (Uzbekistan) and username/password. These are mapped to synthetic emails:

- Phone-only users: `p{digits}@lc.phone`
- Username users: `{username}@lc.internal`

OTP verification calls `admin.generateLink({type:'magiclink', email})` and immediately `cookieClient.verifyOtp({type:'magiclink', token_hash})` on the server — this sets the session cookies without ever exposing the magic link to the client.

## Role gating

Three layers:

1. `middleware.ts` — redirects unauthed users to `/login`, suspended users to sign-out, cross-role access to role home.
2. Per-role `layout.tsx` — double-checks the profile role and `redirect('/login')` on mismatch.
3. Server actions — every mutation checks `getCurrentProfile()` role and scopes to the user's `learning_center_id` or class membership via `class_teachers` / `class_students`.

## Notes on types

The Supabase clients are left untyped (no `<Database>` generic) because the manually-maintained Database shape doesn't match what the installed `@supabase/supabase-js` expects for nested `select(...)` inference. Row types (`Profile`, `Class`, `Assignment`, …) are still exported from `lib/supabase/types.ts` and used in components. Regenerate a full schema with `supabase gen types typescript` if you want end-to-end type safety.

## Scripts

| Script | What |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Next/ESLint |
| `npm run typecheck` | `tsc --noEmit` |
