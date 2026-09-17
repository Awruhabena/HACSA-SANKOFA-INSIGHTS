-- ============================================================
-- HACSA Sankofa Insights — Row Level Security
-- Exported directly from pg_policies against the live project.
-- ============================================================

alter table public.people        enable row level security;
alter table public.events        enable row level security;
alter table public.registrations enable row level security;
alter table public.feedback      enable row level security;
alter table public.ai_summaries  enable row level security;

-- people: no anon access at all. Writes only via the SECURITY DEFINER
-- register_attendee() function.
create policy people_admin_read on public.people
  for select to authenticated using (true);

-- events: public reads published events only; staff manage all.
create policy events_public_read on public.events
  for select to anon using (is_published = true);

create policy events_admin_all on public.events
  for all to authenticated using (true) with check (true);

-- registrations: authenticated (staff) read only.
create policy registrations_admin_read on public.registrations
  for select to authenticated using (true);

-- feedback: authenticated (staff) read only.
create policy feedback_admin_read on public.feedback
  for select to authenticated using (true);

-- ai_summaries: authenticated (staff) read only. Written only by the
-- generate-event-summary edge function via the service role key.
create policy ai_summaries_admin_read on public.ai_summaries
  for select to authenticated using (true);
