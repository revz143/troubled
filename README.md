# Troubled / Hinga Finance

Troubled is the Next.js rebuild of Hinga, a private, mobile-first personal finance app for calmly understanding debts, bills, income, due dates, and future breathing room.

The product voice is intentionally non-shaming: warm paper surfaces, dark green structure, coral accents, Philippine peso formatting, privacy mode, and clear forecasts that call out assumptions.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS, and SSR cookies
- SQL migrations in `supabase/migrations`
- Zod validation at server mutation boundaries
- Vitest for pure business logic
- Playwright smoke tests
- Docker support for local app development

## Local Ports

This project avoids common defaults because other local apps may already use them.

| Service | URL |
| --- | --- |
| Next.js app | `http://localhost:3001` |
| Supabase API | `http://127.0.0.1:54421` |
| Supabase Postgres | `postgresql://postgres:postgres@127.0.0.1:54422/postgres` |
| Supabase Studio | `http://127.0.0.1:54423` |
| Magic-link email inbox | `http://127.0.0.1:54424` |

## Quick Start

Install dependencies:

```bash
pnpm install
```

Start the local Supabase database stack:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:status
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` using the value from `pnpm supabase:status`, then start the app:

```bash
pnpm dev
```

Open `http://localhost:3001`.

Without Supabase environment variables, the app still opens in seeded demo mode for UI work.

### Local magic-link login

Use the same hostname from login through callback. The recommended local URL is `http://localhost:3001`.

1. Open `http://localhost:3001/login`.
2. Enter any email address.
3. Open the local inbox at `http://127.0.0.1:54424`.
4. Click the magic link.

If you start from `localhost`, make sure the magic link also returns to `localhost`. Browser cookies are host-specific, so a session created on `127.0.0.1` will not appear on `localhost`, and vice versa.

After editing `supabase/config.toml` redirect URLs, restart the local Supabase stack:

```bash
pnpm supabase:stop
pnpm supabase:start
```

## Docker App Development

The app can run in Docker while Supabase local runs through the Supabase CLI Docker stack.

Start Supabase first:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:status
```

Create Docker env vars:

```bash
cp .env.docker.example .env.docker
```

Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.docker`, then run:

```bash
docker compose --env-file .env.docker up app
```

The host app URL is still `http://localhost:3001`.

## Database

The local database is managed by Supabase CLI:

```bash
pnpm supabase:start
pnpm supabase:status
pnpm supabase:reset
pnpm supabase:stop
```

`pnpm supabase:reset` recreates the local database, applies migrations, and runs `supabase/seed.sql`.

User-owned finance rows are protected by RLS. Demo data lives in application code until a local user signs in because persisted rows need an Auth user id.

### Local data persistence

Yes, local data persists while the Supabase Docker volumes are kept.

- `pnpm supabase:start` starts the local stack and reuses the existing local database volume.
- `pnpm supabase:stop` stops containers but keeps the local database volume, so your rows are still there next time.
- `pnpm supabase:reset` is destructive for local data: it recreates the database, reapplies migrations, and runs the seed file.
- `pnpm supabase:stop -- --no-backup` or manually deleting Supabase Docker volumes can also remove local data.

For day-to-day local development, use `start` and `stop`. Use `reset` only when you want a clean database.

## Payment and carryover behavior

Payments are recorded as debit transactions linked to a selected obligation. The app derives each obligation’s status from the ledger:

- fully covered due occurrences are shown as paid;
- payments below the due amount are shown as partial;
- unpaid or partially paid balances carry into the next billing;
- the forecast adds that carryover to the next occurrence once, then returns to the normal scheduled amount.

## Checks

Run these before committing or deploying:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Forecast Notes

The forecast engine is pure TypeScript and independent from React/Supabase. It uses integer centavos for calculations, includes expected current-month income only once, respects obligation end dates, caps final debt payments at remaining principal, and surfaces breathing-room milestones.

Debt payoff dates are principal-only estimates in this milestone. APR is stored in the schema for future amortization work, but interest is not yet applied.

## Deployment

See `docs/deployment.md` for Vercel readiness notes, environment variables, local Supabase details, and the full verification checklist.

Do not put a Supabase service-role key in browser-visible environment variables.
