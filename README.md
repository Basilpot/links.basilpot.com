# linkbio

Small link-in-bio app: WorkOS AuthKit, profiles, 15 free links, analytics, and one Paddle Pro tier.

## Run locally

1. `pnpm install`
2. Copy `.env.example` to `.env`, set Postgres, WorkOS, analytics, and Paddle values.
3. `pnpm db:migrate` (or `pnpm db:dev` while changing schema).
4. `pnpm dev`
5. In another terminal, run `pnpm smoke` for a disposable public-page and analytics check. Complete hosted sign-in manually in browser.

Use Neon pooled `DATABASE_URL` for app queries and direct `DATABASE_URL_UNPOOLED` for Prisma migrations. Generate separate random values for `APP_SIGNING_SECRET`, `ANALYTICS_SECRET`, and `WORKOS_COOKIE_PASSWORD` (`openssl rand -hex 32`).

## WorkOS setup

Set `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, and `NEXT_PUBLIC_WORKOS_REDIRECT_URI`. Register `/auth/callback` as WorkOS redirect URI, `/login` as initiate login URI, and app root as default sign-out URI. WorkOS hosts email/password and social sign-in. Enable desired social providers (for example Google and GitHub) under **Authentication** in WorkOS Dashboard; their OAuth credentials and provider activation live there, outside this app. Public profiles remain free of AuthKit client JavaScript.

An existing local profile is linked on first WorkOS sign-in only when WorkOS verifies matching email. Its old password hash is cleared at that point. Legacy hashes remain unused until those users migrate.

Codex WorkOS MCP is registered globally with `codex mcp add workos --url https://mcp.workos.com/mcp`; run `codex mcp login workos` if OAuth expires, then restart Codex to expose its tools.

## Deploy to links.basilpot.com

Import this GitHub repository into Vercel as a Next.js project. Set `DATABASE_URL` to the existing Neon pooled URL and `DATABASE_URL_UNPOOLED` to its direct URL. Set `NEXT_PUBLIC_APP_URL=https://links.basilpot.com` and `NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://links.basilpot.com/auth/callback` before building. Copy the remaining server secrets from local `.env` into Vercel environment variables; never commit `.env`. Run `pnpm db:migrate` against Neon before deployment if new migrations were added.

The current WorkOS staging environment allows both localhost and `links.basilpot.com` callback/sign-out URLs. It preserves existing users in the shared Neon database. WorkOS staging is intended for testing; move to production WorkOS before serving a wider audience. Paddle variables may remain empty while subscriptions are unavailable. Without a Paddle client token and price ID, the app hides checkout controls and keeps the 15-link free limit.

## Paddle setup

Create one recurring Pro price in Paddle. Set its price ID as `NEXT_PUBLIC_PADDLE_PRICE_ID`, a Paddle.js client token as `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, and server API key as `PADDLE_API_KEY`. Configure notification destination at `/api/paddle/webhook` and set its secret as `PADDLE_NOTIFICATION_WEBHOOK_SECRET`. Subscribe to `subscription.created`, `subscription.activated`, `subscription.updated`, `subscription.trialing`, `subscription.past_due`, `subscription.paused`, `subscription.resumed`, and `subscription.canceled`. Webhooks, not checkout redirects, update Pro access. For local webhook testing, expose local server through a tunnel or use Paddle simulator against a deployed preview.

## Custom domains

Pro user enters domain in Settings. App requires TXT record `_linkbio.<domain>` with verification value shown by form. Once verified, route serves profile on domain root. Deployment host must also accept domain and provision TLS; configure that with hosting provider before use. Custom domain stays stored if subscription lapses but stops serving Pro profile until active again.

## Analytics

Public profile visits are written after response. Main-link redirects write clicks before redirect. Unique visitors are approximated using HMAC of request IP and User-Agent; raw values are never stored. Counts may merge visitors sharing both values or split visitors whose IP changes. Keep `ANALYTICS_SECRET` stable or historical unique counts change meaning.
