# Brio — human-written ebooks + personal library

A real, deployable web application: a public storefront plus an authenticated
**personal library** (dashboard, reading analytics, reader page, entitlements).

It is no longer a static brochure. The repo ships the static UI **and** a Node
server that serves it, issues sessions, stores entitlements, records reading
progress and rolls up the analytics shown on the dashboard.

---

## 1. Run it locally

```bash
git clone <your-repo-url> brio && cd brio
cp .env.example .env          # then set SESSION_SECRET
npm install
npm run build                 # catalog source → data/catalog.json
npm run seed                  # creates the test account
npm start                     # http://localhost:3000
```

Test account created by the seed (override with `DEMO_EMAIL` / `DEMO_PASSWORD`):

| | |
|---|---|
| Email | `demo@brio.app` |
| Password | `BrioDemo!2026` |
| Password (after you change it) | whatever you set in `.env` |
| Library | 6 ebooks across 6 categories, one finished, the rest part-read |
| Analytics | 14 days of seeded reading/listening events |

`/login` → `/library` → `/read/:id`. Set `SHOW_DEMO_CREDENTIALS=false` before
any public deployment.

## 2. Deploy

### Docker (any host)
```bash
docker build -t brio:1.0.0 .
docker run -d --name brio -p 8080:8080 \
  -e NODE_ENV=production \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -v brio-data:/app/data \
  brio:1.0.0
```

### Docker Compose
```bash
SESSION_SECRET="$(openssl rand -hex 32)" docker compose up --build -d
```

### Render (blueprint included)
Push the repo, then in Render: **New → Blueprint → pick the repo**.
`render.yaml` builds the Dockerfile, generates `SESSION_SECRET`, mounts a 1 GB
disk at `/app/data` and health-checks `/healthz`.

### Fly.io / Railway / VPS
Any Docker host works: the image listens on `$PORT` (default `8080`), keeps its
state under `$DB_FILE` (`/app/data/db.json`) and exposes `/healthz` for probes.
Mount a volume on `/app/data` or a redeploy wipes the accounts.

## 3. What the server gives you

| Route | Auth | Purpose |
|---|---|---|
| `GET /` | – | storefront (from `public/`) |
| `GET /login`, `POST /login` | – | sign in (HTML form, CSRF + throttle) |
| `GET /register`, `POST /register` | – | create an account |
| `GET /library` | ✔ | **personal library dashboard** |
| `GET /read/:id` | ✔ + entitlement | reader page, live session timer |
| `GET /healthz` | – | readiness probe (JSON) |
| `POST /api/auth/login` \| `/api/auth/register` \| `/api/auth/logout` | – | JSON auth |
| `GET /api/me` | – | current identity + CSRF token |
| `GET /api/catalog` | – | 15 categories, 60 ebooks |
| `GET /api/library` | ✔ | owned ebooks + totals |
| `POST /api/library/claim` | ✔ + CSRF | grant entitlements for the cart |
| `POST /api/progress` | ✔ + CSRF | record minutes / percent / finished |
| `GET /api/analytics?days=7` | ✔ | 7-day series + totals |

## 4. Security posture

* scrypt password hashing with a per-user salt (`node:crypto`).
* Sessions: `httpOnly` + `SameSite=Lax` signed cookie (HMAC-SHA256, 7 days).
* CSRF: double-submit token; every state-changing route is verified.
* Login throttling: 8 attempts per IP+email per 10 minutes.
* `SESSION_SECRET` shorter than 24 chars **aborts boot** in production.
* CSP `default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'`
  plus nosniff, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, HSTS.
* No inline handlers and no inline scripts — all behaviour is in external files
  under `/public/assets/js/`, so `script-src 'self'` holds.
* Payment: **not wired**. Checkout grants entitlements server-side and records a
  `purchases` row with `status: "placeholder"`. No card fields exist anywhere.
  Before selling, connect Stripe/Gumroad/Razorpay and write the entitlement row
  from a verified webhook (`USER_MANAGEMENT_TODO` in `server/index.js`).

## 5. Persistence

`server/db.js` is a dependency-free JSON store with atomic writes — correct for
one process and a demo, and it survives restarts. `db/schema.sql` is the
equivalent PostgreSQL schema (same entity and field names) for when you need
more than one instance; port `server/db.js` to it and set `DB_FILE`/a DB URL.

## 6. Tests

```bash
npm start &                                   # or: BASE=https://your-app
BASE=http://127.0.0.1:3000 bash tests/smoke.sh
```

14 checks: health, CSRF rejection, wrong-password rejection, anonymous redirect,
seeded login, dashboard render, entitlement claim, progress write, reader page,
analytics rollup, logout.

## 7. Project layout

```
server/          index.js (routes) · pages.js (SSR) · auth.js · db.js · stats.js · catalog.js
public/          index.html (storefront) + assets/{css,js,img}
scripts/         build-catalog.js · seed.js
db/schema.sql    PostgreSQL reference schema
tests/smoke.sh   end-to-end smoke test
Dockerfile · docker-compose.yml · render.yaml · .env.example
```
