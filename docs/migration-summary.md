# HireLink — MySQL → PostgreSQL Migration Summary (Prompts 0–6)

Migration of the Spring Boot 3.2 / Java 17 backend (`com.hirelink`) from MySQL 8.0 to
PostgreSQL, targeting Railway. Executed per `docs/migration-prompts.md`, sequence
`0 → (1→2→3) ∥ (4→5) → integration test → 6`.

---

## PROMPT 0 — Secret rotation & history scrub (security)

- Identified exposed secrets in a **public** repo: `rzp-key.csv` (Razorpay test key
  pair) and hardcoded fallbacks in `application.properties` (a 2nd Razorpay pair,
  Gmail app password, JWT signing secret).
- `git rm --cached` on `rzp-key.csv` and `application.properties`; added them (plus
  `*.csv`, `application-local.properties`) to `.gitignore`.
- Created `backend/src/main/resources/application.properties.example` (placeholders
  only) as the committed template.
- Provided exact `git filter-repo` / BFG commands + force-push to purge history, and
  recommended making the repo private until clean.
- **Commit:** `5db80bc`
- **Still owned by the user (cannot be automated):** rotate the Razorpay / Gmail / JWT
  secrets in their dashboards, and run the history scrub + force-push. Code changes do
  not substitute for rotation.

## PROMPT 1 — Dependency swap (`pom.xml`)

- Removed `com.mysql:mysql-connector-j`, added `org.postgresql:postgresql` (runtime),
  version managed by the Spring Boot parent BOM.
- Verified: `mvn dependency:resolve` BUILD SUCCESS; tree shows
  `org.postgresql:postgresql:42.6.0`, no MySQL.
- **Commit:** `2511b78` (with Prompt 2)

## PROMPT 2 — Config (URL, dialect, env vars)

- `application.properties` now builds the JDBC URL from Railway's `PG*` variables
  (`jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}`), driver
  `org.postgresql.Driver`, dialect `PostgreSQLDialect`; kept `ddl-auto=update`,
  `show-sql=false`.
- All secrets read from env vars with no real defaults; DB uses localhost defaults via
  `${VAR:default}` so local dev runs with zero config. Razorpay env vars renamed to
  `RAZORPAY_KEY` / `RAZORPAY_SECRET`.
- Synced the `.example` template.
- **Commit:** `2511b78`

## PROMPT 3 — Entity & query audit

- Removed MySQL-only `columnDefinition = "bigint unsigned"` (UserRole x2,
  ServiceProvider x1).
- Replaced MySQL `FUNCTION('DATE_FORMAT', …, '%Y-%m')` with
  `FUNCTION('TO_CHAR', …, 'YYYY-MM')` in the monthly-bookings report.
- **Option B (jsonb):** converted all 9 JSON `String` columns to `jsonb` via
  `@JdbcTypeCode(SqlTypes.JSON)` across Booking, AdminAuditLog, User, ServiceProvider,
  Service, Review — sets up later AI/JSON-query work.
- Verified OK without change: `@GeneratedValue(IDENTITY)`, all enums
  `EnumType.STRING`, `columnDefinition="TEXT"`, no native queries, standard-SQL
  search/aggregate queries.
- **Commit:** `40ffa32`

## PROMPT 4 — Local Postgres via docker-compose

- Replaced MySQL 8.0 with `postgres:16`: `pg_isready` healthcheck, `postgres_data`
  volume, backend wired to `PG*` vars; host port made configurable
  (`${POSTGRES_HOST_PORT:-5432}`) to avoid clashing with a locally-installed Postgres.
- **Timezone fix (real migration bug):** pinned `TimeZone.setDefault(UTC)` in
  `HireLinkApplication.main()` — pgjdbc sends the JVM default zone at connect, and
  PostgreSQL rejects the deprecated `Asia/Calcutta` with a FATAL (MySQL ignored it).
- **Verified against postgres:16:** backend booted, Hibernate created all 13 tables,
  9 `jsonb` columns, sequence-backed identity PKs.
- **Commit:** `2f1e5cd`

## PROMPT 5 — Demo data reseed (Postgres syntax)

- `database/seed_postgres.sql`: data-only (Hibernate owns schema), column names
  verified against the live generated schema, `ON CONFLICT DO NOTHING` for
  idempotency, explicit PKs + sequence realignment so app inserts continue past
  seeded ids. bcrypt `$2a$12$` hashes (`password123`) port directly to
  `BCryptPasswordEncoder(12)`.
- **Verified:** loads 22 users / 15 addresses / 18 categories / 10 providers /
  28 services / 11 bookings / 5 reviews; re-run idempotent; `jsonb` specializations
  queryable.
- **Commit:** `80e03b8`

## PROMPT 6 — Railway deploy verification

- Confirmed `backend/Dockerfile` by building the image: Java 17, fat JAR,
  `java -jar app.jar`, non-root, exposes 8080. No changes needed.
- Documented backend env vars (Railway-provided `PG*`/`PORT` vs manual secrets),
  Railway variable-reference syntax `${{Postgres.PGHOST}}`, and a post-deploy
  checklist. See `docs/railway-deploy.md`.
- Flagged: Railway's ephemeral filesystem breaks `./uploads` persistence (use a Volume
  or object storage).
- **No commit** (Dockerfile unchanged; deploy guide added as docs).

---

## Net state

- Backend runs on PostgreSQL end-to-end, verified locally (boot + DDL + seed + Docker
  image build). Ready to deploy to Railway following `docs/railway-deploy.md`.
- **Outstanding (user action):** rotate exposed secrets + scrub git history (Prompt 0).
- **Detached, not started:** Prompt 7 (pgvector / PostGIS groundwork for AI + geo).

### Local dev quickstart

**Option A — use a locally-installed PostgreSQL (e.g. PG 17 on 5432).** One-time
setup as the `postgres` superuser, then run the backend with its defaults (no env
overrides — defaults already target `localhost:5432`):
```sql
CREATE ROLE hirelink WITH LOGIN PASSWORD 'password';
CREATE DATABASE hirelink_db OWNER hirelink;
\connect hirelink_db
GRANT ALL ON SCHEMA public TO hirelink;
ALTER SCHEMA public OWNER TO hirelink;   -- so Hibernate can create tables (PG15+)
```
```bash
cd backend && mvn -DskipTests spring-boot:run                          # boots on UTC, hits localhost:5432
psql -U hirelink -h localhost -d hirelink_db -f database/seed_postgres.sql
```

**Option B — use Docker** (no local Postgres, or want parity with a clean PG 16).
Host port is configurable to avoid clashing with a local Postgres on 5432:
```bash
POSTGRES_HOST_PORT=5433 docker compose up -d postgres
cd backend && PGPORT=5433 mvn -DskipTests spring-boot:run
docker compose exec -T postgres psql -U hirelink -d hirelink_db < database/seed_postgres.sql
```
