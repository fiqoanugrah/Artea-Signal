# Artea Signal

Public product signal board for Artea AI.

Anyone can view incoming bug reports, audit findings, and feature requests. Login is required for submitting reports, commenting, approving, rejecting, assigning owners, and changing status.

Public signup is disabled. Admins invite new users from `/admin/users`.

## Stack

- Next.js
- React
- Tailwind CSS
- Vercel for deployment
- Supabase for auth, database, and image storage

## Local Development

```bash
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`.

## Access Model

- Public viewers can read reports and progress.
- Authenticated users can submit reports and comment.
- Reviewer/admin roles can approve, reject, assign, and update status.

## Supabase

The initial database policy sketch is in `supabase/schema.sql`.

## Auth Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Project Settings.
4. Fill `SUPABASE_SERVICE_ROLE_KEY` for admin-only user invites. Keep this server-side only.
5. Run `supabase/schema.sql` in the Supabase SQL editor.
6. Create the first admin manually in Supabase, then set that user's profile role to `admin`.
7. In Supabase Auth URL Configuration, add:
   - `http://localhost:3000/auth/callback`
   - your future Vercel callback URL, for example `https://artea-signal.vercel.app/auth/callback`
8. Restart the dev server.

Routes:

- `/login` signs in existing users.
- `/auth/callback` completes email confirmation.
- `/profile` shows the current user's profile.
- `/admin/users` lets admins invite users.
- Logout is available from the topbar after login.
