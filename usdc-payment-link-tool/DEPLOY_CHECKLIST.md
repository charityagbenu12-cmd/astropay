# Deployment Checklist

## What I verified

- Required local/deploy scripts exist in `package.json`: `dev`, `build`, `start`, `typecheck`, `db:migrate`.
- API endpoints are implemented as Next.js App Router route handlers under `app/api/**/route.ts`.
- The migration script now loads `.env.local` and `.env` before reading `process.env`, so the documented local flow is internally consistent.

## Exact environment variables

### Required to boot the app and use merchant auth/invoice creation

- `DATABASE_URL`
- `SESSION_SECRET`
- `ASSET_CODE`
- `ASSET_ISSUER`
- `PLATFORM_TREASURY_PUBLIC_KEY`

### Required for correct local URLs and client-facing links

- `APP_URL`
- `NEXT_PUBLIC_APP_URL`

### Required to exercise Stellar checkout/build XDR flows cleanly

- `HORIZON_URL`
- `NETWORK_PASSPHRASE`
- `STELLAR_NETWORK`
- `NEXT_PUBLIC_STELLAR_NETWORK`

### Required for cron/webhook protection

- `CRON_SECRET`

### Required for settlement execution

- `PLATFORM_TREASURY_SECRET_KEY`

### Required when your Postgres host needs SSL

- `PGSSL`

### Required for fee/expiry behavior if you do not want defaults

- `PLATFORM_FEE_BPS`
- `INVOICE_EXPIRY_HOURS`

## Exact local setup steps

1. Change into the app directory:
   ```bash
   cd usdc-payment-link-tool
   ```
2. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
3. Edit `.env.local` and set, at minimum:
   ```dotenv
   APP_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/astropay
   PGSSL=disable
   SESSION_SECRET=replace-with-a-long-random-string
   CRON_SECRET=replace-with-another-random-string
   STELLAR_NETWORK=TESTNET
   NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
   HORIZON_URL=https://horizon-testnet.stellar.org
   NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   ASSET_CODE=USDC
   ASSET_ISSUER=GBBD47IF6A3JQRYKRQJ3235GHKJ4GQV4QJV6T4QNVWJ6K4H2L6LJ5B6Q
   PLATFORM_TREASURY_PUBLIC_KEY=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   PLATFORM_TREASURY_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   PLATFORM_FEE_BPS=100
   INVOICE_EXPIRY_HOURS=24
   ```
4. Start PostgreSQL and ensure the database in `DATABASE_URL` exists.
5. Install dependencies:
   ```bash
   npm install
   ```
6. Run migrations:
   ```bash
   npm run db:migrate
   ```
7. Start local development:
   ```bash
   npm run dev
   ```
8. Open:
   ```text
   http://localhost:3000
   ```

## Exact validation commands

### Local development

```bash
npm run dev
```

### Type validation

```bash
npm run typecheck
```

### Production build validation

```bash
npm run build
```

### Production start validation

```bash
npm run start
```

### Database migration

```bash
npm run db:migrate
```

## Route handler verification

These are App Router API handlers, not legacy `pages/api` routes:

- `app/api/auth/register/route.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/invoices/route.ts`
- `app/api/invoices/[id]/route.ts`
- `app/api/invoices/[id]/checkout/route.ts`
- `app/api/invoices/[id]/status/route.ts`
- `app/api/cron/reconcile/route.ts`
- `app/api/cron/settle/route.ts`
- `app/api/webhooks/stellar/route.ts`

## Likely deployment blockers

- `npm run lint` depends on a local ESLint config file. This repo now includes one, but you should still expect a deprecation warning from `next lint` on Next.js 15 and plan to move to direct ESLint CLI usage before Next.js 16.
- The runtime image still ships the full `node_modules` tree. That is acceptable for now but not lean.
- Settlement and cron flows depend on real Stellar and secret-bearing env configuration. A local page render is not the same thing as validating payment and settlement behavior.

## Recommended pre-deploy hardening

- Keep `package-lock.json` committed and use it as the source of truth for installs.
- Run `npm run typecheck` and `npm run build` locally after dependency install succeeds.
- Validate `npm run db:migrate` against a fresh local Postgres database.
- Migrate `npm run lint` from `next lint` to the ESLint CLI before upgrading to Next.js 16.
- Treat Vercel as acceptable for app hosting only if its cron behavior matches your reconciliation expectations; otherwise use Railway or a dedicated worker host.
