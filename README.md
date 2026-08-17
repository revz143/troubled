# Troubled / Hinga Finance

A private, mobile-first personal finance app for calmly understanding debts, bills, income, due dates, and future breathing room.

This implementation uses Next.js App Router, Supabase Auth/Postgres, RLS migrations, Tailwind CSS, Vitest, and Playwright.

## Quick Start

```bash
pnpm install
pnpm dev
```

Without Supabase environment variables the app opens in demo mode with seeded data. To persist data, copy `.env.example` to `.env.local`, fill in the Supabase values, and run the SQL migration in `supabase/migrations`.

Docker is supported for local development:

```bash
docker compose up app
```

For local Supabase, run Supabase CLI services with Docker, copy `.env.docker.example` to `.env.docker`, set the local publishable key from `supabase status`, then run `docker compose --env-file .env.docker up app`.

See `docs/deployment.md` for setup, checks, known forecast limitations, and Vercel readiness notes.
