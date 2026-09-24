# LINKS by Basilpot

Small link-in-bio app: WorkOS AuthKit, profiles, unlimited free links, R2 image storage, custom domains, and anonymous analytics. Runs entirely on Cloudflare (vinext Next.js on Workers, D1 + Prisma, R2).

## Run locally

1. `pnpm install`
2. Copy `.env.example` to `.env`. Set `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, `APP_SIGNING_SECRET`, and `ANALYTICS_SECRET`. `DATABASE_URL` is only needed to re-run the Neon import.
3. `pnpm dev` (vinext dev on port 3000; binds local D1 + R2 from `wrangler.jsonc`).
4. In another terminal, `pnpm smoke -- --local` for a disposable public-page and analytics check. Complete hosted sign-in manually in browser.

Generate separate random values for `APP_SIGNING_SECRET`, `ANALYTICS_SECRET`, and `WORKOS_COOKIE_PASSWORD` (`openssl rand -hex 32`). Local `pnpm dev` reads Worker secrets from `.env` via the Cloudflare Vite plugin; a `.dev.vars` file also works.

## Database (D1)

Single `linkbio-db` D1 database, schema generated from `prisma/schema.prisma` (`prisma generate` for the client, DDL in `prisma/schema-d1.sql`). See [prisma docs](https://github.com/prisma/prisma/tree/main/packages/adapter-d1). Prisma code is unchanged from Postgres except the client adapter in `lib/db.ts`.

## Neon → D1 data import

Run once or anytime after that: `pnpm import` (writes SQL from the Postgres URL in `.env` and applies it to local + remote D1 with `wrangler d1 execute`). Wipes and re-inserts the five tables, so it is safe to re-run. Paddle columns were dropped in the migration.

## Avatar storage

Images are stored in the `linkbio-media` R2 bucket (region APAC) via the `linkbio_media` binding; database stores only object paths. Served by `app/api/media/[...path]/route.ts`. PNG, JPEG, and WebP up to 4 MB.

## WorkOS setup

Set `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, and `NEXT_PUBLIC_WORKOS_REDIRECT_URI`. Register `/auth/callback` as WorkOS redirect URI, `/login` as initiate login URI, and app root as default sign-out URI. WorkOS hosts email/password and social sign-in. Enable desired social providers under **Authentication** in WorkOS Dashboard; credentials and activation live there. Public profiles remain free of AuthKit client JavaScript.

An existing profile is linked on first WorkOS sign-in only when WorkOS verifies a matching email address; the legacy password hash is cleared at that point.

## Deploy

`pnpm build` then `pnpm preview` to test the local Worker, then `pnpm deploy`. Secrets go to production with `wrangler secret put <NAME>` (APP_SIGNING_SECRET, ANALYTICS_SECRET, WORKOS_CLIENT_ID, WORKOS_API_KEY, WORKOS_COOKIE_PASSWORD). Domain routing for `links.basilpot.com` lives in the Cloudflare dashboard zone `basilpot.com`.

## Custom domains

User enters domain in Settings. App requires TXT record `_linkbio.<domain>` with the verification value shown by the form (checked via DNS-over-HTTPS, Workers have no `node:dns`). Once verified, the worker serves the profile on that domain's root. Routed profiles bypass analytics normalization of the primary subdomain.

## Analytics

Public profile visits are written after response. Main-link redirects write clicks before redirect. Unique visitors are approximated using HMAC of request IP and User-Agent; raw values are never stored. Keep `ANALYTICS_SECRET` stable or historical unique counts change meaning.