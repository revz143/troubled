# Hinga Deployment Notes

## Local setup with host Node

1. Install dependencies with `pnpm install`.
2. Create a Supabase project.
3. Run `supabase/migrations/202608170001_initial_hinga_schema.sql` against the project.
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Run `pnpm dev`.

## Local setup with Docker

The app can run in a Docker container while Supabase local runs through the Supabase CLI, which also uses Docker.

1. Start Supabase local services:

```bash
supabase start
supabase db reset
```

If the Supabase CLI is not installed globally, use `pnpm dlx supabase start` and `pnpm dlx supabase db reset`.

2. Copy `.env.docker.example` to `.env.docker` and set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `supabase status`.

3. Start the Next.js dev container:

```bash
docker compose --env-file .env.docker up app
```

For UI-only work, you can omit Supabase values and the app will run with seeded demo data.

## Checks

Run these before deployment:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Vercel

Create a Vercel project from this repository and add the same Supabase environment variables. Do not add a service-role key to Vercel unless a future server-only administrative task requires it.

## Forecast limitations

Debt payoff dates are principal-only estimates in this milestone. APR is stored in the schema for future amortization work, but interest is not applied by the current forecast engine.
