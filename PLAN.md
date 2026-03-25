# PRD — MVP (AI Socratic Learning Platform)

## 1. Product Overview

An AI-powered learning platform for kids combining:
- Interactive **canvas-based learning**
- **Socratic AI tutoring (Gemini)**
- **Teacher/parent lesson creation**
- Multi-tenant structure (schools, academies)

Two main modes:
- **Kids Mode** → learning session (canvas + chat)
- **Socratic Mode (Teacher/Parent)** → lesson & mission creation

---

## 2. Goals (MVP)

### Primary Goals
- Enable teachers/parents to create structured learning experiences
- Deliver those experiences to kids as interactive canvas sessions
- Use AI (Gemini) to guide learning via Socratic method
- Keep infra cost minimal while supporting ~120 concurrent users

### Non-Goals (MVP)
- No real-time collaboration
- No billing/subscriptions
- No advanced analytics
- No image generation (Imagen removed)

---

## 3. Core User Roles

| Role | Capabilities |
|------|-------------|
| Student (Kid) | Consume lessons, interact with canvas + AI |
| Teacher | Create lessons, assign missions |
| Parent | Similar to teacher (limited scope) |
| Tenant Admin | Manage organization |

---

## 4. Core Features

## 4.1 Kids Mode (Learning Session)

### Components
- Canvas (interactive)
- Chat (AI tutor)
- Speech-to-text input

### Canvas Requirements
- Drag & drop objects (images, assets)
- Zoom in / zoom out
- Objects:
  - NOT erasable
  - Deletable via hover ❌ button
- Persisted per session

### Chat Requirements
- Text + speech input
- Messages persist
- AI responds using mission context

---

## 4.2 Socratic Mode (Teacher/Parent)

### Capabilities
- Create lessons
- Upload assets:
  - Images
  - PDFs
  - Camera capture
- Create lesson cards
- Define **mission prompt (AI instruction)**

---

## 4.3 Mission Flow (Critical Feature)

### Flow
1. Teacher creates lesson + assets + instruction
2. System creates:
   - Lesson
   - MissionTemplate
3. Teacher assigns mission to student(s)
4. When student starts session:
   - System generates ChatSession
   - System generates CanvasScene
   - Lesson assets injected as CanvasObjects

---

## 5. System Architecture

## 5.1 High-Level

Frontend:
- React + Vite
- Clerk (auth)
- Fabric.js (canvas)

Backend:
- NestJS (modular monolith)
- Prisma ORM

Database:
- Neon (serverless Postgres)

Storage:
- Google Cloud Storage

AI:
- Vertex AI (Gemini only)

---

## 5.2 Modular Monolith Structure

Backend modules:
- auth
- tenancy
- users
- lessons
- missions
- chat
- canvas
- ai
- files
- integrations

---

## 6. Data Model (Summary)

### Core Entities

- Tenant
- User (Clerk ID)
- UserTenant (role mapping)
- StudentProfile / TeacherProfile / ParentProfile
- Classroom

### Learning

- Lesson
- LessonCard
- LessonAsset

### Missions

- MissionTemplate
- AssignedMission

### Execution

- ChatSession
- ChatMessage
- CanvasScene
- CanvasObject

---

## 7. Key Flow — Session Materialization

### Trigger
Student starts session:


### Backend logic

1. Fetch AssignedMission
2. Fetch Lesson + Assets
3. Create ChatSession
4. Create CanvasScene
5. Convert assets → CanvasObjects

### Canvas Object Rules

| Property | Value |
|--------|------|
| draggable | true |
| erasable | false |
| deletable | true |
| locked | optional |

---

## 8. API (MVP)

### Auth
- Clerk handles authentication

---

### Lessons
- POST /lessons
- GET /lessons/:id

---

### Missions
- POST /missions
- POST /missions/:id/assign

---

### Sessions
- POST /sessions/start
- GET /sessions/:id

---

### Chat
- POST /chat/sessions/:id/messages

---

### Canvas
- GET /canvas/scenes/:id
- PATCH /canvas/scenes/:id

---

### Files
- POST /files/upload-url

---

### AI
- POST /ai/chat

---

## 9. Multi-Tenancy

### Strategy
- Shared DB
- `tenantId` on all entities

### Enforcement
- Always filter by tenantId in backend
- Never trust frontend

---

## 10. AI Integration

### Model
- Gemini (Vertex AI)

### Usage
- Chat responses
- Socratic questioning

### Rules
- No client-side API calls
- All requests via backend
- Track usage (AIInteraction table)

---

## 11. Speech-to-Text

### Approach
- Browser-native speech recognition (primary)
- Optional Google STT fallback

### Behavior
- Transcript appears in chat input
- Persisted as message

---

## 12. Storage Strategy

Use Google Cloud Storage for:
- lesson assets
- uploaded files
- images

Access:
- signed URLs

---

## 13. Performance Targets

- Support ~120 concurrent users
- Session load < 1s (excluding AI)
- AI response latency: acceptable up to 2–4s

---

## 14. Security Requirements

- No API keys in frontend
- Clerk JWT verification in backend
- Tenant isolation enforced server-side
- Signed URLs for file access
- Minimal PII storage

---

## 15. Cost Strategy

### Stack choices for cost efficiency

| Component | Choice | Reason |
|----------|-------|-------|
| DB | Neon | serverless, low cost |
| Compute | Cloud Run | autoscaling |
| Storage | GCS | cheap + scalable |
| AI | Gemini only | avoid image costs |
| Auth | Clerk | faster dev |

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Tenant data leakage | enforce tenantId in all queries |
| AI cost explosion | log + limit usage |
| Canvas complexity | use Fabric.js |
| DB connection limits | use Neon pooling |
| Cold starts | acceptable for MVP |

---

## 17. Roadmap (Post-MVP)

- Lesson versioning
- Realtime collaboration
- Analytics dashboard
- Parent progress tracking
- AI-generated lesson suggestions
- Billing system
- Role-based permissions refinement

---

## 18. Final Product Principle

The system is built around:

**Author → Assign → Materialize → Execute**

- Author → teacher creates content
- Assign → mission assigned to student
- Materialize → system generates session state
- Execute → student interacts with AI + canvas

---

## 19. Success Criteria (MVP)

- Teacher can create lesson + mission in < 5 min
- Student session loads with canvas pre-filled
- AI responds correctly with mission context
- No data leakage across tenants
- System runs under minimal cost (< $50/month infra excluding AI)


## 20. STACK

  1.Frontend Recomendación

    React

    Vite

    TypeScript

    Tailwind CSS

    TanStack Query

    Zustand

    Fabric.js para canvas

  2.Backend Recomendación principal

    Python

    FastAPI

    SQLAlchemy 2.0

    Alembic

    Pydantic

    Celery o Dramatiq más adelante para background jobs

    PostgreSQL (Neon ahora, migrable después)

  3. DB
  Neon Postgres