# Implementation Plan: Todo Web App

**Branch**: `002-todo-web-app` | **Date**: 2026-02-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-todo-web-app/spec.md`

## Summary

Build a multi-user web-based Todo application using a monorepo
architecture with Next.js 16+ frontend (Better Auth for
authentication), FastAPI backend (JWT verification, SQLModel ORM),
and Neon Serverless PostgreSQL for persistent storage. Users can
sign up, log in, and perform CRUD operations on their own tasks
with filtering and search capabilities. All API endpoints require
valid Bearer token authorization.

## Technical Context

**Language/Version**: Python (FastAPI backend), TypeScript (Next.js frontend)
**Primary Dependencies**: FastAPI, SQLModel, Better Auth, Next.js 16+
**Storage**: Neon Serverless PostgreSQL
**Testing**: Manual testing (Phase 1)
**Target Platform**: Web (responsive — phone, tablet, laptop)
**Project Type**: Web application (monorepo: frontend + backend)
**Performance Goals**: All operations < 1 second for 100 tasks
**Constraints**: All data in Neon PostgreSQL; no in-memory storage
**Scale/Scope**: Multi-user, single session per user, persistent data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Monorepo Architecture | frontend/ + backend/ separate, REST API only | PASS — monorepo with docker-compose |
| II. Technology Stack | Next.js 16+, FastAPI, SQLModel, Neon, Better Auth | PASS — all technologies match |
| III. Security & Data Isolation | Bearer token, JWT verify, user-scoped queries, .env | PASS — auth middleware + user_id filter on all queries |
| IV. Development Process | Specs updated before code (schema, endpoints, features, UI) | PASS — this plan creates all spec artifacts |

All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-todo-web-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── rest-api.md      # REST endpoint contracts
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── CLAUDE.md                # Backend-specific instructions
├── pyproject.toml           # Python project config (uv)
├── .env.example             # Environment variable template
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings from .env
│   ├── database.py          # Neon DB connection + engine
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py          # Task SQLModel
│   ├── routers/
│   │   ├── __init__.py
│   │   └── tasks.py         # Task CRUD endpoints
│   └── middleware/
│       ├── __init__.py
│       └── auth.py          # JWT verification middleware
└── tests/

frontend/
├── CLAUDE.md                # Frontend-specific instructions
├── package.json
├── next.config.ts
├── .env.example
├── app/
│   ├── layout.tsx           # Root layout (navbar, footer)
│   ├── page.tsx             # Landing/Login page
│   └── dashboard/
│       └── page.tsx         # Task Manager page
├── components/
│   ├── auth/
│   │   └── AuthButton.tsx   # Login/Signup/Logout button
│   ├── tasks/
│   │   ├── TaskForm.tsx     # Add/Edit task form
│   │   ├── TaskList.tsx     # List of all tasks
│   │   └── TaskItem.tsx     # Single task row/card
│   ├── ui/
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── Footer.tsx       # Footer
│   │   ├── Logo.tsx         # App logo
│   │   ├── ThemeButton.tsx  # Dark/light mode toggle
│   │   ├── SearchBar.tsx    # Search input
│   │   └── FilterButton.tsx # Status filter buttons
│   └── providers/
│       └── AuthProvider.tsx # Better Auth context
├── lib/
│   ├── auth.ts              # Better Auth client config
│   └── api.ts               # API client (fetch with Bearer)
└── public/

docker-compose.yml           # Orchestrates frontend + backend
```

**Structure Decision**: Web application monorepo (Option 2) per
Constitution Principle I. Frontend and backend are separate
directories with independent dependency management. Communication
via REST API only.

## Authentication Flow

```text
1. User opens app → frontend/ (Next.js)
2. User signs up or logs in → Better Auth (frontend)
3. Better Auth generates JWT token → stored in cookie/session
4. Frontend sends API requests with Authorization: Bearer <token>
5. Backend auth middleware → verifies JWT using shared secret
6. Backend extracts user_id from token
7. All database queries filter by user_id
8. Response returned to frontend
```

**Key details**:
- Better Auth manages user table (signup, login, sessions) on
  the frontend side
- Backend NEVER manages users directly — only verifies JWT tokens
- JWT shared secret stored in `.env` on both frontend and backend
- Backend auth middleware runs on every /api/tasks/* endpoint

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/tasks | Bearer | List all tasks for current user. Optional query params: `status` (pending/completed), `search` (keyword) |
| POST | /api/tasks | Bearer | Create a new task. Body: `{title, description}` |
| PATCH | /api/tasks/{id} | Bearer | Update task fields. Body: any of `{title, description, status}` |
| DELETE | /api/tasks/{id} | Bearer | Delete a task permanently |

**All endpoints**:
- Require valid Bearer token in Authorization header
- Extract user_id from JWT and filter queries by it
- Return 401 Unauthorized if token is missing/invalid
- Return 404 Not Found if task doesn't exist or belongs to
  another user (never reveal existence)

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing/Login | Login and signup forms via Better Auth |
| `/dashboard` | Task Manager | Protected page — task list, filters, search, CRUD |

## Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| AuthButton | `components/auth/AuthButton.tsx` | Login/Signup/Logout toggle |
| TaskForm | `components/tasks/TaskForm.tsx` | Add new task or edit existing |
| TaskList | `components/tasks/TaskList.tsx` | Renders list of TaskItem components |
| TaskItem | `components/tasks/TaskItem.tsx` | Single task with edit/delete/complete actions |
| Navbar | `components/ui/Navbar.tsx` | Top navigation with logo + auth button |
| Footer | `components/ui/Footer.tsx` | Page footer |
| Logo | `components/ui/Logo.tsx` | App branding |
| ThemeButton | `components/ui/ThemeButton.tsx` | Dark/light mode toggle |
| SearchBar | `components/ui/SearchBar.tsx` | Keyword search input |
| FilterButton | `components/ui/FilterButton.tsx` | All / Pending / Done filter tabs |

## Implementation Steps

Following the user's requested order:

### Step 1: Monorepo Setup
- Create `frontend/` and `backend/` directories
- Initialize Next.js app in `frontend/`
- Initialize FastAPI project with uv in `backend/`
- Install dependencies (Better Auth, SQLModel, etc.)
- Create `docker-compose.yml`
- Create `.env.example` files for both layers
- Create `CLAUDE.md` for both layers

### Step 2: Database and Models
- Configure Neon PostgreSQL connection in `backend/app/database.py`
- Define Task SQLModel in `backend/app/models/task.py`
- User table managed by Better Auth (no backend model needed)
- Run initial schema migration

### Step 3: Backend API + JWT
- Create auth middleware in `backend/app/middleware/auth.py`
  (verify JWT, extract user_id)
- Implement GET /api/tasks (list, filter by status, search)
- Implement POST /api/tasks (create)
- Implement PATCH /api/tasks/{id} (update/complete)
- Implement DELETE /api/tasks/{id} (remove)
- All endpoints enforce user_id scoping

### Step 4: Frontend Auth + API Client
- Configure Better Auth in `frontend/lib/auth.ts`
- Create AuthProvider context
- Build login/signup page at `/`
- Create API client in `frontend/lib/api.ts` (attach Bearer token)
- Add route protection (redirect to `/` if not authenticated)

### Step 5: UI Integration
- Build Navbar, Footer, Logo, ThemeButton
- Build TaskForm (connect to POST /api/tasks)
- Build TaskList + TaskItem (connect to GET /api/tasks)
- Add edit/delete/complete actions on TaskItem
- Build SearchBar and FilterButton
- Connect filter + search to GET /api/tasks query params
- Ensure responsive layout for mobile/tablet/laptop

## Complexity Tracking

No violations. The 2-layer monorepo is the standard approach
for Constitution Principle I.
