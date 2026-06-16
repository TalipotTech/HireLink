# HireLink — Railway Deploy Guide (PostgreSQL backend)

Spring Boot 3.2 backend on PostgreSQL, deployed to Railway (Hobby plan) with a
managed PostgreSQL service.

---

## 1. Dockerfile

`backend/Dockerfile` is a multi-stage build and needs **no changes**. Verified by
building the image locally:

| Check | Result |
|---|---|
| Java 17 base | build `maven:3.9-eclipse-temurin-17`, runtime `eclipse-temurin:17-jre-alpine` (JRE 17) |
| Fat JAR | `mvn clean package` (spring-boot repackage) → single `app.jar` |
| Entrypoint | `java -jar app.jar` |
| Hardening | non-root `spring` user, `EXPOSE 8080` |
| Port | app reads `server.port=${PORT:8080}`, so it honors Railway's injected `$PORT` |

> The Dockerfile `HEALTHCHECK` hardcodes `8080`. Railway ignores Docker's
> `HEALTHCHECK` and uses its own (set **Healthcheck Path** = `/actuator/health` in
> service settings), so this only matters for plain `docker run` with `PORT != 8080`.

---

## 2. Environment variables (backend service)

**Provided automatically by Railway** (defined on the Postgres service — reference
them, see §3):

| Variable | Notes |
|---|---|
| `PGHOST` `PGPORT` `PGDATABASE` `PGUSER` `PGPASSWORD` | Railway Postgres plugin |
| `PORT` | Railway injects this into the backend service itself — do **not** set it |

**Set by hand** (use the values rotated during the security step):

| Variable | Required? | Notes |
|---|---|---|
| `JWT_SECRET` | yes | Base64, >=256-bit. Generate: `openssl rand -base64 48` |
| `MAIL_USERNAME` | for email | Gmail address |
| `MAIL_PASSWORD` | for email | Rotated Gmail app password |
| `RAZORPAY_KEY` | for payments | Rotated key id |
| `RAZORPAY_SECRET` | for payments | Rotated key secret |
| `CORS_ORIGINS` | prod | Frontend public URL, e.g. `https://hirelink-frontend.up.railway.app` |
| `FRONTEND_URL` | for email links | Used in verification/reset emails & redirects |
| `BACKEND_URL` | recommended | Public backend URL |
| `UPLOAD_DIR` | optional | See caveat below |

> **File-upload caveat:** the app writes uploads to `./uploads` (`file.upload-dir`).
> Railway containers have an **ephemeral filesystem** — uploads are lost on every
> redeploy/restart. For production attach a Railway **Volume** (mount it and point
> `UPLOAD_DIR` at it) or use object storage (S3 / Cloudinary).

---

## 3. Referencing the Postgres variables (no copy-paste)

In Railway → backend service → **Variables**, add (assuming the Postgres service is
named `Postgres`):

```
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGDATABASE=${{Postgres.PGDATABASE}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
```

`${{ServiceName.VARIABLE}}` links live to the Postgres service — credentials are
never hardcoded and auto-update if Railway rotates them. `PGHOST` resolves to the
private `*.railway.internal` host, so backend↔DB traffic stays on Railway's internal
network (no SSL/public proxy needed). The app's JDBC URL
`jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}` consumes them directly.

> Railway defaults are `PGUSER=postgres`, `PGDATABASE=railway` — that's fine.
> Hibernate (`ddl-auto=update`) creates the tables in whatever DB they resolve to;
> the `hirelink` / `hirelink_db` names were local-only conventions.

---

## 4. Post-deploy checklist

1. **App boots** — Railway → backend → Deploy Logs:
   `Started HireLinkApplication in N seconds` (and no `Asia/Calcutta` TimeZone FATAL).
2. **Tables created** — Postgres service → **Data** tab (or `railway connect Postgres`,
   then `\dt`). Expect 13 tables with `jsonb` columns and sequence-backed PKs.
3. **Swagger loads** — `https://<backend>.up.railway.app/swagger-ui.html`
   (API docs at `/api-docs`).
4. **Register + login round-trip:**
   ```bash
   BASE=https://<your-backend>.up.railway.app

   curl -sS -X POST $BASE/api/auth/register-email \
     -H 'Content-Type: application/json' \
     -d '{"name":"Deploy Test","email":"deploytest@example.com","password":"Test@12345","phone":"9990001111"}'

   curl -sS -X POST $BASE/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"priya.sharma@email.com","password":"password123"}'
   ```
   A successful login returns `ApiResponse.success` with a JWT in the `AuthResponse`.
5. **(Optional) Load demo data** — `railway connect Postgres < database/seed_postgres.sql`
   (idempotent), or paste it into the Data tab query editor.

> Set the service **Healthcheck Path** to `/actuator/health`
> (`management.endpoints.web.exposure.include=health,info,metrics`).
