-- ============================================================
-- HACSA Sankofa Insights — Core Schema
-- Verified against the live Supabase project on export.
-- ============================================================

create extension if not exists "pgcrypto";

create type region_type_enum as enum (
  'local_ghana',
  'continental_africa',
  'diaspora'
);

create table public.people (
  id                 uuid primary key default gen_random_uuid(),
  full_name          text not null check (length(trim(full_name)) >= 2),
  email              text not null unique,
  current_country    text not null,
  region_type        region_type_enum not null,
  heritage_country   text,
  industry           text not null,
  occupation_status  text not null,
  organization       text,
  consent_data       boolean not null default false,
  consent_marketing  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint people_consent_required check (consent_data = true)
);

create index people_region_type_idx on public.people (region_type);
create index people_industry_idx    on public.people (industry);
create index people_created_at_idx  on public.people (created_at);

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (length(trim(title)) >= 2),
  slug          text not null unique,
  description   text,
  location      text not null,
  event_date    date not null,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create index events_slug_idx on public.events (slug) where is_published = true;

create table public.registrations (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  person_id      uuid not null references public.people(id) on delete cascade,
  registered_at  timestamptz not null default now(),
  unique (event_id, person_id)
);

create index registrations_event_idx  on public.registrations (event_id);
create index registrations_person_idx on public.registrations (person_id);

create table public.feedback (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  person_id        uuid references public.people(id) on delete set null,
  rating           int not null check (rating between 1 and 5),
  what_stood_out   text check (length(what_stood_out) <= 500),
  what_to_improve  text check (length(what_to_improve) <= 500),
  submitted_at     timestamptz not null default now()
);

-- Partial unique index: a matched person may only give feedback once per
-- event; unmatched (anonymous) feedback is never constrained this way.
create unique index feedback_one_per_person_event
  on public.feedback (event_id, person_id)
  where person_id is not null;

create index feedback_event_idx on public.feedback (event_id);

create table public.ai_summaries (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references public.events(id) on delete cascade,
  summary_text    text not null,
  key_themes      jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  comment_count   int not null default 0,
  generated_at    timestamptz not null default now(),
  unique (event_id)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger people_touch_updated_at
  before update on public.people
  for each row execute function public.touch_updated_at();
