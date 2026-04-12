# ASTROpay v2 — exact Codex prompts

Use these prompts in order. They are written to force Codex to behave like a senior full-stack engineer instead of a hallucinating intern.

## Prompt 1 — architecture and invariants

```text
You are upgrading a Next.js 15 App Router product called ASTROpay.

Context:
- ASTROpay is a hosted USDC payment-link and invoice product on Stellar.
- Stack: Next.js App Router, TypeScript, Node runtime, PostgreSQL, Stellar SDK, Freighter wallet.
- Product constraints:
  1. Merchants authenticate and manage invoices.
  2. Invoices must be persisted in Postgres.
  3. Payment reconciliation must not depend on an open browser tab.
  4. Platform fee capture must be real, not cosmetic.
  5. Deployment target is Vercel or Railway.

Non-negotiable architecture:
- Use platform-custody fee-split architecture.
- Customer pays invoice gross amount to platform treasury wallet.
- Merchant net amount is settled later from platform treasury to merchant settlement wallet.
- Store gross_amount_cents, platform_fee_cents, net_amount_cents.
- Invoice states: pending, paid, expired, settled, failed.
- Payout states: queued, submitted, settled, failed.
- Use cron-driven reconciliation against Stellar Horizon.
- Use a secure cron secret for internal cron/webhook endpoints.

Deliverables:
- A short architecture decision record.
- A database schema.
- A route map for App Router.
- A list of environment variables.
- A strict implementation plan ordered by dependency.

Do not write code yet. First produce the architecture and call out risks, tradeoffs, and any lie in the original MVP assumptions.
```

## Prompt 2 — database and auth

```text
Implement Postgres-backed merchant auth and invoice persistence for ASTROpay.

Requirements:
- Create SQL migrations, not hand-wavy pseudo schema.
- Tables: merchants, sessions, invoices, payment_events, payouts, schema_migrations.
- Use UUID primary keys.
- Merchant auth is email + password with strong password hashing using Node crypto.scrypt.
- Session must be httpOnly cookie backed by a sessions table and signed JWT cookie payload.
- Build these API routes:
  - POST /api/auth/register
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/invoices
  - POST /api/invoices
  - GET /api/invoices/[id]
- Build these pages:
  - /login
  - /register
  - /dashboard
  - /dashboard/invoices/new
  - /dashboard/invoices/[id]

Implementation rules:
- Use Next.js App Router route handlers.
- Use server-side redirects when the merchant is not authenticated.
- Validate all request bodies with zod.
- Return typed JSON responses.
- Keep the UI plain but production-clean.

Output code only, file by file.
```

## Prompt 3 — Stellar checkout and reconciliation

```text
Implement ASTROpay invoice checkout and reconciliation on Stellar.

Requirements:
- Public checkout route: /pay/[publicId]
- Build Freighter checkout component.
- Buyer flow:
  1. Open public invoice page.
  2. Connect Freighter.
  3. Request unsigned XDR from server.
  4. Sign with Freighter.
  5. Submit signed XDR to server.
- Reconciliation flow:
  - GET /api/invoices/[id]/status returns current invoice state.
  - GET /api/cron/reconcile scans pending invoices via Horizon.
  - Match by destination, asset, amount, and transaction memo.
  - Mark invoice paid and enqueue payout when payment is found.
  - Mark invoice expired when expired.
- Add optional POST /api/webhooks/stellar for future push-based confirmations.

Important:
- The payment destination must be the platform treasury wallet, not the merchant wallet.
- The memo must uniquely map payment to invoice.
- Do not trust client-submitted payment status.
- Do not introduce a database ORM unless there is a compelling reason.

Output code only, file by file.
```

## Prompt 4 — real fee split and settlement

```text
Implement the actual fee-split settlement layer for ASTROpay.

Requirements:
- Fee capture model:
  - invoice gross is what the payer sends
  - platform_fee_cents is retained by ASTROpay
  - net_amount_cents is paid out to the merchant
- Settlement flow:
  - GET /api/cron/settle processes queued payouts
  - load platform treasury account from secret key
  - build Stellar payment transaction for merchant net amount
  - submit transaction
  - mark payout settled and invoice settled
  - on failure mark payout failed with a reason
- Add clear comments explaining why this model is chosen over direct-to-merchant payment links.
- Add guards for missing settlement signing key.

Output code only, file by file.
```

## Prompt 5 — production deployment

```text
Prepare ASTROpay for production deployment on Vercel and Railway.

Requirements:
- Update Dockerfile for production.
- Add vercel.json with cron configuration.
- Add railway.json for deploy flow.
- Add .env.example with every required variable.
- Add a migration runner script callable from npm run db:migrate.
- Write a README that includes:
  - architecture
  - local setup
  - migration steps
  - cron security
  - Vercel deploy steps
  - Railway deploy steps
  - operational caveats

Be explicit about platform constraints such as Vercel cron behavior and secure internal cron endpoints. Output code and docs only.
```

## Prompt 6 — hardening pass

```text
Review the entire ASTROpay codebase as a principal engineer.

Tasks:
- Find broken imports, route mismatches, and type errors.
- Find any transactionality bugs in Postgres access.
- Find insecure auth or session handling.
- Find any place where invoice state can become inconsistent.
- Find any UI copy that still references the old product name.
- Propose and implement minimal changes only.

Output:
1. A punch-list of issues found.
2. Then the patch, file by file.
```
