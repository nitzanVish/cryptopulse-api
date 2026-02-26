# Architecture & Technical Decisions — CryptoPulse Backend

This document covers the key architectural decisions made during development, with a focus on resource management, system stability, and third-party API constraints.

---

## 1. Asynchronous Processing & Rate Limiting (BullMQ + Redis)

**Challenge:** Gemini 2.5 Flash (free tier) limits requests to ~15 per minute (and as low as 4–5 per minute for certain models). Sending dozens of coin analysis requests concurrently would trigger `429 Too Many Requests` errors and cause job failures.

**Solution:** A BullMQ-backed asynchronous job queue stored in Redis. The worker is configured with strict rate limiting:

```typescript
concurrency: 1,   // One job at a time — respects API limits
limiter: {
  max: 4,         // Max 4 jobs
  duration: 60000 // Per 60 seconds
}
```

This allows the scheduler to enqueue all coins at once, while the worker drains the queue gradually — without ever hitting the AI rate limit.

---

## 2. API Quotas & Scheduled Jobs (Cron + Enrichment Layer)

**Challenge:** News and financial data APIs impose strict daily/monthly request quotas on free tiers. Letting the frontend trigger live fetches on every page load would exhaust the quota almost immediately.

**Solution:** The backend operates as an independent **Enrichment Layer**, fully decoupled from end-user traffic:

- A Cron Job runs every **2 hours**, fetches news, runs AI analysis, and persists the enriched result to MongoDB.
- The React frontend only queries our own database — never the external APIs directly.
- This means **the API can scale to any number of concurrent users** with zero impact on third-party quota consumption.

---

## 3. Smart Cache Invalidation (Skip AI When No New Content)

**Challenge:** The Cron Job runs every 2 hours, but news cycles don't always produce new articles between runs. Blindly calling the Gemini API on every tick wastes quota and money.

**Solution:** Before invoking the AI, the system compares the **publication date of the newest fetched article** against the `lastArticleDate` stored from the previous analysis:

1. Check Redis cache for `lastArticleDate`.
2. If no newer article exists → update only `analyzedAt` timestamp, skip AI entirely.
3. If the cache is cold → check MongoDB for the same.
4. Only if a genuinely new article is found → call Gemini.

This makes the AI calls **content-driven**, not time-driven.

---

## 4. High Availability & Fallback Strategy (News Sources)

**Challenge:** Relying on a single news API creates a Single Point of Failure. Any outage, rate limit, or key expiry would leave the system with no data.

**Solution:** A two-tier fallback chain is implemented in `NewsService`:

| Priority | Source | Reason |
|----------|--------|--------|
| Primary | **CryptoCompare** | Crypto-specific, real-time (~11k req/month free) |
| Fallback | **NewsAPI** | General news; free tier has a built-in **24-hour publication delay** |

Because of the 24-hour delay on NewsAPI's free tier, the fallback requests a **48-hour window** and sorts by `publishedAt` descending — so the "freshest stale" news surfaces first. This ensures **Graceful Degradation**: the system always returns something meaningful, even if the primary source is unavailable.

---

## 5. Distributed Lock & Cycle ID — Preventing Cron Duplication

**Challenge:** In a horizontally scaled environment (e.g., Kubernetes with multiple Node.js replicas), the Cron Job would fire simultaneously on every instance — leading to duplicate jobs in the queue and wasted AI quota.

**Solution:** A **Redis Distributed Lock** using the atomic `SET NX EX` command and a simple, deterministic Cycle ID stored only in BullMQ jobs:

```
SET scheduler:lock:sentiment_dispatch "LOCKED_BY_<hostname|pid>" EX <ttl> NX
```

- **Cycle ID Calculation (Jobs Only):**  
  - On each Cron tick, the scheduler computes a `cycleId` by rounding the current time down to the start of the current hour (UTC):  
    `const now = new Date(); now.setMinutes(0, 0, 0); const cycleId = now.toISOString();`  
  - Example result: `2026-02-26T12:00:00.000Z`.

- **Single Redis Lock:**  
  - The scheduler uses a single lock key `scheduler:lock:sentiment_dispatch` with a TTL of **60 minutes**.
  - Only the first instance to acquire the lock dispatches jobs.
  - All other instances detect the lock and skip silently.
  - The lock **expires automatically via TTL** — no manual release needed, which prevents deadlocks if a server crashes while holding the lock.

- **Job De-duplication in BullMQ (Per Cycle):**  
  - Each sentiment analysis job uses a `jobId` composed of the job name, the symbol, and the `cycleId` (e.g. `analyze-sentiment-BTC-2026-02-26T12:00:00.000Z`).
  - If multiple servers try to enqueue the same symbol for the same cycle, BullMQ treats them as the same job and avoids duplicates.

---

## 5b. Admin API — Queue Status & Token Protection

**Purpose:** Allow operators to inspect the sentiment queue (waiting, active, completed, failed jobs) and see per-job cycleId, symbol, and status without exposing the API publicly.

**Endpoint:** `GET /api/v1/admin/sentiment/status`  

**Protection:** When `ADMIN_SENTIMENT_STATUS_TOKEN` is set, the request must include that token via `Authorization: Bearer <token>` or `X-Admin-Token: <token>`. When the token is not set: the endpoint is open in development; in production it returns `503 Service Unavailable` with a message that admin is not configured.

**Response:** JSON with `stats` (counts waiting/active/completed/failed) and `jobs`: an array of `{ jobId, symbol, cycleId, status, finishedAt, failedReason }` so you can see which cycle each job belongs to and whether it completed or failed.

---

## 6. Security & Input Validation

**Challenge:** Node.js is single-threaded. Without protection, a burst of malformed or malicious requests can overwhelm the Event Loop even without authentication in place.

**Solution — two layers:**

**Rate Limiting (`express-rate-limit`):**  
A global middleware limits each IP to 100 requests per 15-minute window. The `/health` endpoint is explicitly excluded so infrastructure monitoring tools are never blocked.

**Schema Validation & Sanitization (Zod):**  
Instead of ad-hoc sanitization libraries, all incoming data is validated through strict Zod schemas at the DTO layer. Beyond type checking, the schemas enforce:
- `.trim()` to strip whitespace
- `.toUpperCase()` for symbol normalization  
- Strict Regex (`/^[a-zA-Z0-9]+$/`) to reject HTML tags, SQL fragments, or any non-alphanumeric input

This means malformed input never reaches the service layer.
