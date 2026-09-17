# HACSA Sankofa Insights — Backend

This branch holds the Supabase backend as version-controlled source: schema, functions, Row Level Security, realtime configuration, and the AI edge function.

**Every file here was exported directly from the live, deployed Supabase project** (via `pg_get_functiondef()` and `pg_policies`) — not reconstructed from memory — so this is a true record of what's actually running, not an approximation of it.

## What's here

```
supabase/
  migrations/
    001_core_schema.sql       — tables, enum, indexes, updated_at trigger
    002_functions.sql          — register_attendee, submit_feedback, 4 dashboard functions
    003_row_level_security.sql — every RLS policy, exported from pg_policies
    004_realtime.sql           — realtime publication for live dashboard updates
  functions/
    generate-event-summary/    — the AI edge function (Gemini-backed)
```

## This backend already exists and is running live

This project is deployed on Supabase (project ref `xbefyawkertjurgovvta`). These files are for version control, disaster recovery, and onboarding — not something that needs to be applied to make the live system work, since it's already applied there.

## Applying this to a NEW Supabase project (e.g. a fresh environment)

1. Create a Supabase project.
2. Run the four migration files in `supabase/migrations/`, in numbered order, via the SQL Editor or the Supabase CLI (`supabase db push` if linked).
3. Deploy the edge function: `supabase functions deploy generate-event-summary`.
4. Set the `GEMINI_API_KEY` secret on the project (Project Settings → Edge Functions → Secrets). Get a free key at aistudio.google.com.
5. Create at least one staff user in Authentication → Users, with "Auto Confirm User" enabled.
6. Disable public sign-ups: Authentication → Providers → Email → turn off "Enable sign ups."

## Security model, in one paragraph

The `anon` role has zero read or write access to `people`, `registrations`, `feedback`, or `ai_summaries` — see `003_row_level_security.sql`. The only way data enters the system is through `register_attendee` and `submit_feedback`, both `SECURITY DEFINER` functions that run with elevated permissions regardless of who calls them, applying validation the raw tables can't enforce. Every dashboard-facing function is revoked from `anon` and granted only to `authenticated`, and none of them ever select a name or email — see `002_functions.sql` for the exact query shapes.

## The frontend this backend serves

See the `frontend` branch of this repository for the React/Vite application that calls these functions.
