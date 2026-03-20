# DECISIONS.md — Architectural Decision Log

Decisions that are not obvious from the code or PLAN.md.
Format: context → decision → reason → trade-offs.

---

## STACK

### [DEC-001] Backend: Python + FastAPI over NestJS
- **Context:** PLAN.md originally listed NestJS + Prisma as primary backend.
- **Decision:** Switch to Python + FastAPI + SQLAlchemy 2.0.
- **Reason:** Team familiarity with Python; Gemini/Vertex AI SDK is first-class in Python; faster iteration for AI-heavy features.
- **Trade-offs:** Lose Prisma's type-safe query builder; gain native async with SQLAlchemy 2.0 + asyncpg.

### [DEC-002] DB driver: asyncpg over psycopg2
- **Decision:** Use `asyncpg` as the PostgreSQL driver.
- **Reason:** Native async — required for FastAPI's async endpoints. psycopg2 is synchronous and would block the event loop.
- **Trade-offs:** asyncpg doesn't support all psycopg2 features (e.g. COPY), but none are needed for MVP.

### [DEC-003] SQLite for local dev, PostgreSQL (Neon) for production
- **Decision:** `database_url` defaults to `sqlite+aiosqlite:///./dev.db` in config.
- **Reason:** Zero-setup local development — no need to run a local Postgres instance.
- **Trade-offs:** SQLite doesn't support JSONB (canvas objects) or some Postgres-specific features. Must test with Neon before shipping any JSONB-dependent feature.

### [DEC-004] Frontend: React + Vite (not Next.js)
- **Decision:** Stay with React + Vite SPA.
- **Reason:** Single-view app (canvas + chat) — no routing, SSR, or SEO needed. Deploy as static files to any CDN.
- **Trade-offs:** API keys were previously exposed on the client. Now all AI calls go through the backend, eliminating that risk.

### [DEC-005] Tailwind CSS via CDN (not installed as package)
- **Decision:** Load Tailwind from CDN in `index.html`.
- **Reason:** Avoids PostCSS + build config complexity for MVP. Acceptable at this scale.
- **Trade-offs:** No tree-shaking, slightly larger CSS bundle. Migrate to package if bundle size becomes a concern.

---

## ARCHITECTURE

### [DEC-006] Modular monolith over microservices
- **Decision:** Single deployable Python app with modules as internal boundaries.
- **Reason:** Team size (1-2 devs), MVP scope, cost target (<$50/month infra). Microservices add infra/ops overhead with no benefit at this scale.
- **Trade-offs:** Modules share DB and process. If one module has a bug, it can affect others. Acceptable for MVP; revisit at 10k+ users.

### [DEC-007] Module structure: router + service + schemas (not full 5-layer per module)
- **Decision:** Each module has `router.py`, `service.py`, `schemas.py`. Does NOT have its own `model.py` or `repository.py` by default.
- **Reason:**
  - Models live in `app/models/` centrally so Alembic detects all of them.
  - `BaseRepository` (generic) covers 80% of CRUD — per-module repos are only added when queries are complex (e.g. lessons with JOINs).
- **Trade-offs:** Less isolation per module. Accepted for MVP; add per-module repos when complexity justifies it.
- **Modules that DO have custom repo logic:** `lessons` (selectinload cards + assets), `session_materializer` (multi-table).

### [DEC-008] Tenant isolation via TenantScopedModel + BaseRepository
- **Decision:** All DB entities extend `TenantScopedModel` (adds `tenant_id`). `BaseRepository` always filters by `tenant_id` — it is structurally impossible to forget.
- **Reason:** Multi-tenancy is a security requirement. Enforcement must be structural, not a convention developers remember.
- **Trade-offs:** Every query carries a `WHERE tenant_id = ?` even for internal jobs. Acceptable cost.

### [DEC-009] Tenant resolved from X-Tenant-Id header + membership check
- **Decision:** Frontend sends `X-Tenant-Id` header. Backend verifies user belongs to that tenant via `UserTenant` table before setting tenant context.
- **Reason:** Avoids encoding tenantId into JWT (Clerk doesn't support that natively without custom claims). Clean separation between identity (Clerk) and authorization (our DB).
- **Trade-offs:** One extra DB query per request for tenant validation. Mitigate with caching if needed post-MVP.

### [DEC-010] session_materializer.py lives in app/services/, not in a module
- **Decision:** Session materialization (the Author→Assign→Materialize→Execute flow) is a cross-cutting service.
- **Reason:** It touches `missions`, `chat`, `canvas`, and `lessons` simultaneously. Placing it inside any single module would create hidden coupling.
- **Trade-offs:** `app/services/` is a shared layer — keep it small. If it grows, split into use-case files.

---

## AI

### [DEC-011] All Gemini calls go through backend — zero client-side AI calls
- **Decision:** Frontend never calls Gemini directly. All AI interactions go through `/api/v1/ai/chat` or `/api/v1/chat/sessions/:id/messages`.
- **Reason:** API key security (PLAN.md §14). Frontend bundles are public — any key there is compromised.
- **Trade-offs:** Adds latency hop. Acceptable given security requirement.

### [DEC-012] Gemini via google-genai SDK (not Vertex AI REST directly)
- **Decision:** Use `google-genai` Python SDK with `vertexai=True`.
- **Reason:** Same SDK used in the original frontend prototype; async support via `client.aio.models`; handles auth via ADC (Application Default Credentials).
- **Trade-offs:** Tied to Google's SDK versioning. Pin version in requirements.txt.

### [DEC-013] No image generation (Imagen) in MVP
- **Decision:** Imagen-4.0 removed from MVP scope.
- **Reason:** Cost control (PLAN.md §4 Non-Goals). Gemini text-only is sufficient for Socratic tutoring.
- **Trade-offs:** Less visual richness in AI responses. Teachers can still upload images as lesson assets.

---

## STORAGE

### [DEC-014] GCS signed URLs — backend generates, frontend uploads directly
- **Decision:** `POST /files/upload-url` returns a signed PUT URL. Frontend uploads the file directly to GCS, not through the backend.
- **Reason:** Avoids streaming large files through the API server (memory + bandwidth cost). Files go client → GCS directly.
- **Trade-offs:** Backend never sees the file content. Virus scanning or content validation requires a GCS trigger (post-MVP).

### [DEC-015] Canvas state stored as Fabric.js JSON snapshot (JSONB)
- **Decision:** `CanvasScene.snapshot` stores the full Fabric.js JSON. Individual `CanvasObject` rows store object-level metadata for server-side logic.
- **Reason:** Fast full restore via snapshot; per-object rows allow backend rules (draggable, deletable, locked) without parsing JSON.
- **Trade-offs:** Dual storage (snapshot + rows) can diverge. Snapshot is source of truth for rendering; rows are source of truth for rules.

---

## AUTH

### [DEC-016] Clerk owns identity — local DB stores only profile data
- **Decision:** `User` model has `clerk_user_id` (FK to Clerk) but does not store passwords, sessions, or tokens.
- **Reason:** Clerk handles auth complexity (MFA, OAuth, session management). We get webhook events for user lifecycle.
- **Trade-offs:** Dependency on Clerk availability. Mitigation: local `User` table is the fallback cache for display data.

### [DEC-017] Clerk JWT verified via JWKS (not shared secret)
- **Decision:** `security.py` fetches Clerk's JWKS endpoint and verifies RS256 tokens.
- **Reason:** Asymmetric verification — no shared secret to leak. Standard approach for Clerk + FastAPI.
- **Trade-offs:** JWKS fetched once and cached in memory. Restart required if Clerk rotates keys (rare).

---

## INFRA

### [DEC-018] Deploy target: Cloud Run (not always-on VM)
- **Decision:** Backend deploys as a container to Google Cloud Run.
- **Reason:** Autoscales to zero when idle (cost), scales up for 120 concurrent users (PLAN.md §13), no VM management.
- **Trade-offs:** Cold starts on first request after idle. Acceptable for MVP — use minimum instances=1 if cold starts are unacceptable.

### [DEC-019] Background workers (Celery) deferred to post-MVP
- **Decision:** `app/workers/` exists but tasks are stubs. No Redis/Celery running in MVP.
- **Reason:** All MVP operations are fast enough for synchronous handling. Adding Celery adds infra (Redis) and ops complexity.
- **Trade-offs:** If an AI call times out (>30s), the HTTP request fails. Acceptable for MVP; move to async tasks if needed.
