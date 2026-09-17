# HACSA Sankofa Insights

**HACSA@10 Hackathon — Operations & Events Track**
**Live app:** https://hacsa-sankofa-insights.vercel.app

A self-service registration, feedback, and live analytics system for HACSA Foundation events — built to answer three questions HACSA couldn't reliably answer before: **who actually attends our events, how did the event land with them, and what should we do differently next time.**

> This is the `frontend` branch — the deployable React application. The Supabase backend (schema, security policies, database functions, and the AI edge function) lives on the [`backend`](../../tree/backend) branch of this same repository, as version-controlled source exported directly from the live project.

---

## What this actually does

Attendees register themselves by scanning a QR code on arrival — no app, no account, under a minute on their own phone. A second QR code at the exit collects a rating and two short written answers. Everything lands in one live dashboard that HACSA staff watch update in real time, broken down by diaspora, continental Africa, and local Ghana. An AI layer turns the raw feedback into a plain-language summary and concrete recommendations.

**Core design decision — arrival = registration.** There's no pre-event sign-up and no separate day-of check-in screen. Registering *is* the attendance record. This removed an entire category of staff-operated screens under a two-day build, at the honest cost of not knowing headcount in advance.

## User journeys

**Attendee registration** — scan entrance QR → short form (name, email, country, heritage country, sector, occupation, consent) → submitted → confirmation. Registering twice for the same event returns a friendly "already registered" message rather than an error or a duplicate.

**Attendee feedback** — scan exit QR → email + 1–5 rating + two short optional questions → submitted. If the email matches a registration for that event, the feedback is linked and counts toward the region-comparison breakdown. If not, it's still recorded and counts toward the overall average, but is excluded from demographic breakdowns — the dashboard reports this matched/unmatched split honestly rather than hiding it.

**Staff — event setup** — log in → create an event → get two auto-generated, downloadable QR codes (registration and feedback), encoding the real live URLs.

**Staff — live monitoring** — open the dashboard, optionally filter to one event, watch four sections update live: headline stats, geography, audience composition, and feedback & sentiment. Generate an AI-powered summary and recommendations for any event on demand.

## Architecture

```
┌──────────────────┐         ┌────────────────────────────┐         ┌──────────────┐
│  React frontend   │ ──────▶ │   Supabase (Postgres)        │ ──────▶ │  Gemini API   │
│  (Vite + TS)       │ ◀────── │   RLS · RPCs · Realtime       │ ◀────── │  (free tier)  │
│  Deployed: Vercel   │         │   Edge Function                │         └──────────────┘
└──────────────────┘         └────────────────────────────┘
```

No custom API server. The frontend calls Supabase Postgres functions directly — two for writing data (`register_attendee`, `submit_feedback`), four for reading pre-aggregated, anonymised dashboard data. The dashboard subscribes to Postgres realtime changes on the core tables, so any new registration or feedback submission updates every open dashboard instantly, with no manual refresh.

## Data model

Five tables. `people` is the identity spine, keyed on email — every registration, everywhere, checks for an existing person before creating a new one, which is what makes cross-event tracking work. `region_type` (`local_ghana` / `continental_africa` / `diaspora`) is never asked directly; it's derived server-side from the attendee's country, so the classification is always consistent no matter who's filling in the form. `events`, `registrations`, and `feedback` round out the core loop; `ai_summaries` caches one AI-generated summary per event.

Full schema, with every column and constraint explained, is on the [`backend`](../../tree/backend) branch.

## Security model, briefly

The public can write to the database (register, give feedback) but can never read personal data back — enforced by Row Level Security, not by the frontend choosing not to display something. The only way data enters the system is through two `SECURITY DEFINER` database functions, which apply validation (consent required, valid email, no duplicates) that the raw tables alone can't enforce. Every dashboard-facing query returns aggregates only — no query anywhere ever selects a name or email for display. Full detail on the `backend` branch's README.

## AI Insights

On request, an edge function gathers the same aggregate data the dashboard shows — stats, geography, satisfaction by region, and every written comment — and sends it to Google Gemini with a dedicated system instruction (never invent a number or quote not in the data), a low temperature setting, and structured JSON output. Results are cached, never generated live while a page is loading, and the UI carries a visible disclaimer to review before presenting. Built on Gemini's free tier.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Recharts, qrcode.react |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| AI | Google Gemini (free tier) |
| Hosting | Vercel |

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the real Supabase URL/anon key
npm run dev
```

See `TEAM_SETUP.md` for the full walkthrough, including known quirks hit during development (Node version warnings, WSL2 networking, why there's no check-in step).

## Deploying

```bash
npm run build
npx vercel --prod
```

## What's deliberately not built yet (Phase 2)

An opt-in member directory across the Sankofa Network, exhibit-level QR engagement tracking, optional pre-event registration for advance headcount, and multi-event trend analysis in the AI layer. None of these require re-architecting — the data model was built to extend into all four without a rebuild.
