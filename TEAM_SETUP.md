# HACSA Sankofa Insights — Team Setup Guide

The app is already **live**: https://hacsa-sankofa-insights.vercel.app

You only need to run this locally if you're making changes to the code. If you just want to see it working, use the live URL and log in with the admin credentials below.

---

## 1. Requirements

- **Node.js v20 or higher** (v22 recommended — some packages warn on v20, but it works)
- npm (comes with Node)

Check your version:
```
node -v
```

---

## 2. Get the code

If cloning from GitHub:
```
git clone <repo-url>
cd hacsa-sankofa-insights
```

If you were handed this as a zip, just unzip it and `cd` into the folder.

---

## 3. Install dependencies

```
npm install
```

You'll likely see `EBADENGINE` warnings about Node version requirements — these are safe to ignore, the app runs fine on Node 20.

**If you get an error like `vite: not found` when you later try to run it:** it almost always means `npm install` didn't actually finish in this exact folder. Re-run it and watch for the full "added N packages" success line at the end, not just the last line printed.

---

## 4. Set up environment variables

Copy the example file:
```
cp .env.example .env.local
```

Then edit `.env.local` and fill in the real values (ask the team lead for these, or use the ones below if you already have them):

```
VITE_SUPABASE_URL=https://xbefyawkertjurgovvta.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZWZ5YXdrZXJ0anurjb3Z2dGEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4OTU3MDI3MiwiZXhwIjoyMTA1MTQ2MjcyfQ.Rqqr6EtcTwEd0HLO5Odjt22xmZ6-xy6lxKVq26ZU-HA
```

This key is safe to share within the team — it's a public-facing key by design, protected by database-level security rules, not by secrecy.

---

## 5. Run it locally

```
npm run dev
```

Open the printed `Local:` address, usually `http://localhost:5173`.

**To test on your phone too**, run instead:
```
npm run dev -- --host
```
and use the `Network:` address it prints — but only works if your phone is on the exact same wifi as your computer. If you're on WSL2 (Windows), this network address often won't be reachable from other devices at all — don't burn time debugging that, just test on your own computer's browser, or ask the team lead about the tunnel/deploy workaround.

---

## 6. Admin login

```
URL:      /admin/login  (locally or on the live URL)
Email:    staff@hacsa.org
Password: (ask the team lead)
```

Public sign-up is disabled on purpose — you cannot create your own account. If more staff logins are needed, the team lead has to add them directly in Supabase.

---

## 7. Project structure, quick orientation

```
src/
  pages/public/     — registration & feedback forms (no login needed)
  pages/admin/       — dashboard, event management, login
  components/ui/     — buttons, inputs, cards etc.
  lib/constants.ts   — the LOCKED dropdown lists (countries, industries, occupations)
  lib/types.ts        — TypeScript interfaces matching the database
  lib/supabase.ts     — the Supabase client
```

**Do not change the values in `lib/constants.ts`** without also updating the backend — the region-detection logic (`derive_region_type`) matches against these exact country strings on the server. Changing "United States" to "USA," for example, would silently break the diaspora/continental/local classification for anyone using the new label.

---

## 8. Building for production

```
npm run build
```
Output goes to `dist/`. To preview that build locally:
```
npm run preview
```

---

## 9. Deploying

Only the team lead should deploy to the live URL, to avoid overwriting each other's work. If you do need to:
```
npx vercel --prod
```
(You don't need `vercel` installed globally — `npx` downloads and runs it on demand.)

You'll need to be logged into the correct Vercel account/team (`awruhabenas-projects`) for this to work.

---

## 10. Known quirks (so you don't waste time rediscovering them)

- **`vercel.json`** exists specifically to fix client-side routing — without it, refreshing on any page other than the homepage shows a 404. Don't delete it.
- **`vite.config.ts`** has `allowedHosts: true` — needed for testing through tunnels during development. Harmless to leave in.
- The registration and feedback flows are **self-service and public** — anyone with the QR code or link can submit, no login required. This is intentional.
- **Arrival = registration.** There's no separate "check-in" step — filling the registration form *is* the attendance record. If you're looking for a check-in screen, it doesn't exist by design.
- The AI Insights feature (on individual event pages) calls a live Gemini API through a Supabase Edge Function — it needs the `GEMINI_API_KEY` secret to be set on the Supabase project (already done), and it's **free tier**, so don't hammer it with rapid repeated clicks during testing — you may hit rate limits.

---

## 11. Who to ask

For Supabase dashboard access, the admin password, or deployment access — ask the project owner (the person who set up the Supabase project and Vercel account).
