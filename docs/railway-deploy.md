# HireLink — Railway Deploy Guide (verified live)

Spring Boot 3.2 backend on PostgreSQL, deployed to Railway (Hobby plan). This reflects
the **actual first deploy** of `hirelink-production.up.railway.app` — including the
gotchas hit along the way. Frontend is a separate service (not yet deployed).

---

## 1. Postgres image — **Supabase Postgres** template

Chosen because we will later need **pgvector** (embeddings) and **PostGIS** (radius
search) per [ai-geo-foundation.md](ai-geo-foundation.md). Supabase Postgres ships both,
so we never have to migrate the DB image once production data exists.

- Provision: Railway → **+ New → Template → Supabase Postgres**.
- Confirm the extension binaries are **available** (we do NOT `CREATE EXTENSION` yet):
  ```sql
  SELECT name FROM pg_available_extensions WHERE name IN ('vector','postgis');  -- both present
  ```

---

## 2. Backend service

- Create from **GitHub repo `TalipotTech/HireLink`**, **Settings → Root Directory = `backend`**
  (so Railway builds `backend/Dockerfile`).
- Generate a public domain: **Settings → Networking → Generate Domain**.
- Deploys are triggered by **pushing to `main`** (Railway builds from GitHub, not local).

### Dockerfile
Multi-stage, Java 17 build + JRE, fat JAR, `java -jar app.jar`, non-root, `$PORT`-aware
(`server.port=${PORT:8080}`). **It also materializes `application.properties` from the
committed `.example` at build time** — see gotcha #2.

---

## 3. Environment variables (backend service)

### Database — reference the Postgres service (do NOT copy-paste creds)
```
PGHOST      = supabase-postgres.railway.internal      # NOT ${{Supabase Postgres.PGHOST}} (=0.0.0.0)
PGPORT      = ${{Supabase Postgres.PGPORT}}           # 5432
PGDATABASE  = ${{Supabase Postgres.PGDATABASE}}       # railway
PGUSER      = ${{Supabase Postgres.PGUSER}}           # postgres
PGPASSWORD  = ${{Supabase Postgres.PGPASSWORD}}
```
`application.properties` reads these and builds
`jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}`. We deliberately do **not** use
`DATABASE_URL`/`DATABASE_PRIVATE_URL` (their `postgresql://` scheme isn't a valid JDBC URL).

### Set by hand
| Variable | Required? | Notes |
|---|---|---|
| `JWT_SECRET` | ✅ | Base64, ≥256-bit (`openssl rand -base64 48`) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | ✅ | Gmail SMTP — OTP/email-verify auth path |
| `CORS_ORIGINS` | when frontend deploys | the deployed frontend origin |
| `FRONTEND_URL` / `BACKEND_URL` | recommended | used in email links |
| `RAZORPAY_KEY` / `RAZORPAY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` / `PLATFORM_FEE_PERCENT` | later (Prompt 8) | not referenced yet; app runs in mock-payment mode without them |

### Auto-provided by Railway (do not set)
`PORT`.

---

## 4. Gotchas hit during the first deploy (and fixes)

1. **`PGHOST=0.0.0.0`** — the Postgres service's own `PGHOST` is its bind address, not a
   connect host. Set the backend's `PGHOST` to the private domain
   `supabase-postgres.railway.internal`.
2. **`application.properties` is gitignored** (Prompt 0), so a clean Railway checkout
   shipped a JAR with no config → `Could not resolve placeholder 'jwt.access-token-expiration'`
   crash. Fix: the Dockerfile copies `application.properties.example` →
   `application.properties` before `mvn package`. Real values still come from env vars.
3. **`PGPASSWORD` unset** → app fell back to the local default `password` →
   `password authentication failed for user "postgres"`. Fix: set the `PGPASSWORD` reference
   (use the autocomplete picker; the service name has a space).
4. **`/actuator/health` 503** — the mail health indicator reports DOWN when SMTP is
   unconfigured, failing Railway's healthcheck. Fixed earlier via
   `management.health.mail.enabled=false`.
5. **Public DB proxy** — Supabase exposes `DATABASE_PUBLIC_URL` (`*.proxy.rlwy.net`), so the
   DB is reachable from the internet. Rotate the Postgres password and/or restrict the TCP
   proxy before real data matters (references auto-update on rotation).

---

## 5. Verification checklist — ✅ all passed (first deploy)

- [x] Service boots — `Started HireLinkApplication`
- [x] Hibernate `ddl-auto=update` creates all 13 tables in Railway Postgres
- [x] `/actuator/health` → `{"status":"UP"}`
- [x] `/swagger-ui.html` + `/api-docs` load
- [x] Register (phone + mock-SMS OTP) → JWT
- [x] Login (phone/email + password) → JWT
- [x] Authenticated read (`/api/bookings/my-bookings`) → 200
- [x] Seeded login (`priya.sharma@email.com` / `password123`) → returns her seeded bookings
- [x] Provider login (`ramesh.electrician@email.com`) → 200 (no StackOverflow)

### Auth round-trip notes
- `SmsService` is a **mock** — the OTP is printed to the Railway **logs**, not sent. Read it
  there to complete registration in test.
- OTP/email features need `MAIL_USERNAME`/`MAIL_PASSWORD` to actually deliver mail.

---

## 6. Seed (optional, done)

Loaded `database/seed_postgres.sql` into the Railway DB via the public proxy
(idempotent). Counts: 22 users / 15 addresses / 18 categories / 10 providers / 28 services
/ 11 bookings / 5 reviews. Demo password `password123`.

```bash
# via Railway CLI:
railway connect Postgres < database/seed_postgres.sql
# or via the public proxy with psql:
psql "<DATABASE_PUBLIC_URL>" -f database/seed_postgres.sql
```

---

## 7. Still open
- **Frontend service** not deployed. When it is: point its API base at
  `https://hirelink-production.up.railway.app` and add its origin to `CORS_ORIGINS`.
- **Prompt 0 security**: rotate exposed secrets + scrub git history (still outstanding).
- **Prompt 8 (payments)**: do after this is live (it is) — adds Razorpay Route + webhooks.
