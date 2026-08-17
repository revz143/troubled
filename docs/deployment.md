# Hinga Deployment Notes

## Local Database

Local development uses the Supabase CLI Docker stack for Postgres, Auth, Studio, and the REST API.
This project uses a custom `544xx` port block to avoid collisions with other local Supabase projects.

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:status
```

Useful local endpoints:

- App API URL: `http://127.0.0.1:54421`
- Direct Postgres URL: `postgresql://postgres:postgres@127.0.0.1:54422/postgres`
- Supabase Studio: `http://127.0.0.1:54423`
- Email inbox for magic links: `http://127.0.0.1:54424`

Copy `.env.example` to `.env.local`, then set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `pnpm supabase:status`.

## Local Setup With Host Node

1. Install dependencies with `pnpm install`.
2. Start the local database with the commands above.
3. Copy `.env.example` to `.env.local` and set the local publishable key.
4. Run `pnpm dev` and open `http://localhost:3001`.

## Local setup with Docker

The app can run in a Docker container while Supabase local runs through the Supabase CLI, which also uses Docker.

1. Start Supabase local services:

```bash
pnpm supabase:start
pnpm supabase:reset
```

2. Copy `.env.docker.example` to `.env.docker` and set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `pnpm supabase:status`.

3. Start the Next.js dev container:

```bash
docker compose --env-file .env.docker up app
```

The container maps host port `3001` to app port `3000`, so open `http://localhost:3001`. For UI-only work, you can omit Supabase values and the app will run with seeded demo data.

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
