# ASTROpay Rust Backend

This service is the beginning of the backend migration out of Next.js route handlers.

What it currently owns:

- merchant registration, login, logout, and cookie-backed sessions
- invoice creation, listing, detail lookup, and status lookup
- Horizon-backed reconciliation for pending invoices
- webhook-driven payment marking (`/api/webhooks/stellar`)
- a Rust migration runner that reuses the existing SQL migrations

What is intentionally not faked yet:

- buyer XDR generation/submission for checkout
- merchant settlement cron

Those routes return `501 Not Implemented` in the Rust service until the Stellar transaction logic is ported properly.

## Login rate limiting (`POST /api/auth/login`)

Login attempts are throttled with **two independent in-memory sliding windows** (per process). They are tuned so a few wrong passwords do not brick an account: only **failed** logins count toward the email bucket, while the IP bucket limits overall volume from a single client. Successful login **clears** the failure streak for that normalized email. Set the corresponding `*_MAX` env var to **`0`** to disable either limiter.

| Variable | Default | Meaning |
| --- | --- | --- |
| `LOGIN_RATE_IP_WINDOW_SECS` | `600` | Window length for per-IP counting (seconds). |
| `LOGIN_RATE_IP_MAX` | `80` | Max login POSTs from one IP within the IP window (`0` = off). |
| `LOGIN_RATE_EMAIL_WINDOW_SECS` | `900` | Window for failed attempts per trimmed/lowercased email. |
| `LOGIN_RATE_EMAIL_FAIL_MAX` | `12` | Max **failed** credential checks per email in that window (`0` = off). |

When a limit is exceeded the API returns **429 Too Many Requests** with:

```json
{
  "error": {
    "code": "AUTH_RATE_LIMITED",
    "message": "Too many login attempts. Please wait before trying again.",
    "retryAfterSeconds": 42
  }
}
```

and a **`Retry-After`** header (seconds). The client IP comes from Axum `ConnectInfo` (the TCP peer). Behind a reverse proxy you may need to forward the real client IP or swap this for `X-Forwarded-For` in a later change. For multiple app instances, use a shared store (e.g. Redis) instead of this in-memory map.

**Verify:** `cargo test login_rate_limit` (unit tests for IP / email windows and disabled mode).

## Run locally

```bash
cd rust-backend
cargo run --bin migrate
cargo run
```

The service reads env vars from:

- `rust-backend/.env.local`
- `rust-backend/.env`
- `../usdc-payment-link-tool/.env.local`
- `../usdc-payment-link-tool/.env`
