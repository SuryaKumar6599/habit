# Demon Slayer Habit

A Vite + React habit tracker with a Demon Slayer inspired RPG loop: breathing techniques, daily missions, ranks, streaks, focus encounters, sword durability, corruption, analytics, and Capacitor mobile shells.

## Tech Stack

- React 19 and Vite
- Zustand for client state
- Supabase Auth, tables, RLS policies, RPCs, and triggers
- Tailwind CSS v4
- Capacitor for Android and iOS

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local-only env file from the development template:

   ```bash
   cp .env.development.example .env.local
   ```

3. Fill in the values from your development Supabase project:

   ```bash
   VITE_APP_ENV=development
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_SUPABASE_PROJECT_REF=...
   ```

4. Run the SQL in `supabase_schema.sql` in the development Supabase SQL editor.

5. Start the app:

   ```bash
   npm run dev
   ```

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
```

For mobile builds, build the web app first, then sync Capacitor:

```bash
npm run build
npx cap sync
```

## Supabase Environments

Use separate Supabase projects for development and production. Do not reuse the production project URL or anon key in local development.

Local development:

```bash
cp .env.development.example .env.local
```

`.env.local` should point to the development Supabase project:

```bash
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://your-dev-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-anon-key
VITE_SUPABASE_PROJECT_REF=your-dev-project-ref
```

Production deployment:

Configure these in Vercel project settings, not in a committed file:

```bash
VITE_APP_ENV=production
VITE_SUPABASE_URL=https://your-prod-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
VITE_SUPABASE_PROJECT_REF=your-prod-project-ref
```

The app validates `VITE_SUPABASE_PROJECT_REF` against the host in `VITE_SUPABASE_URL` at startup. If the values do not match, it throws a clear configuration error instead of making auth requests against the wrong database.

## Current Product Notes

- Habit completions use the user's local calendar date on the client.
- Daily mission targets are capped so they remain achievable with one completion per form per day.
- Technique streak bonuses are recalculated from recent completion logs before awarding XP.
- Growth analytics account for weekly habits instead of treating every technique as daily.

## Important Schema Note

Run `supabase_migration_v2.sql` after `supabase_schema.sql` to enable primary writes to `habits` and `activity_logs`. The client still reads legacy tables (`breathing_techniques`, `slayer_logs`, `encounter_logs`) for backward compatibility with existing data.
