# HACSA Sankofa Insights — Frontend

React + Vite + TypeScript frontend for HACSA's self-service event registration, feedback, and live analytics dashboard.

**Live app:** https://hacsa-sankofa-insights.vercel.app

This is the `frontend` branch — it contains only the deployable frontend application (this is what Vercel builds and serves). For the Supabase backend (schema, RLS, functions, the AI edge function), see the `backend` branch of this same repository.

## Quick start

```
npm install
cp .env.example .env.local   # then fill in the real Supabase URL/anon key
npm run dev
```

See `TEAM_SETUP.md` for the full walkthrough, including known quirks hit during development.

## Stack

React 18 · Vite · TypeScript · Tailwind CSS · Recharts · qrcode.react · Supabase JS client

## Deploying

```
npm run build
npx vercel --prod
```
