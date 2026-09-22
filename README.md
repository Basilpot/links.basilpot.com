# linkbio

Small link-in-bio app: profiles, 15 free links, analytics, and one Paddle Pro tier.

## Run locally

1. `pnpm install`
2. Copy `.env.example` to `.env`, set Postgres, Auth, analytics, and Paddle values.
3. `pnpm db:migrate` (or `pnpm db:dev` while changing schema).
4. `pnpm dev`
5. In another terminal, run `pnpm smoke` for a disposable end-to-end check against local server and configured database.

Use Neon pooled `DATABASE_URL` for app queries and direct `DATABASE_URL_UNPOOLED` for Prisma migrations. Generate separate random values for `AUTH_SECRET` and `ANALYTICS_SECRET` (`openssl rand -hex 32`).

## Paddle setup

Create one recurring Pro price in Paddle. Set its price ID as `NEXT_PUBLIC_PADDLE_PRICE_ID`, a Paddle.js client token as `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, and server API key as `PADDLE_API_KEY`. Configure notification destination at `/api/paddle/webhook` and set its secret as `PADDLE_NOTIFICATION_WEBHOOK_SECRET`. Subscribe to `subscription.created`, `subscription.activated`, `subscription.updated`, `subscription.trialing`, `subscription.past_due`, `subscription.paused`, `subscription.resumed`, and `subscription.canceled`. Webhooks, not checkout redirects, update Pro access. For local webhook testing, expose local server through a tunnel or use Paddle simulator against a deployed preview.

## Custom domains

Pro user enters domain in Settings. App requires TXT record `_linkbio.<domain>` with verification value shown by form. Once verified, route serves profile on domain root. Deployment host must also accept domain and provision TLS; configure that with hosting provider before use. Custom domain stays stored if subscription lapses but stops serving Pro profile until active again.

## Analytics

Public profile visits are written after response. Main-link redirects write clicks before redirect. Unique visitors are approximated using HMAC of request IP and User-Agent; raw values are never stored. Counts may merge visitors sharing both values or split visitors whose IP changes. Keep `ANALYTICS_SECRET` stable or historical unique counts change meaning.
