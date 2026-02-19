# Tasks: Todo Web App

**Input**: Design documents from `/specs/002-todo-web-app/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/rest-api.md, research.md
**Tests**: Manual testing only (no automated tests requested)
**ID Range**: T200+ (Phase 1 CLI app was T001–T023)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths relative to repository root

---

## Phase 2: Backend Infrastructure & Database (T200–T210)

**Purpose**: Create monorepo structure, configure database, build
auth middleware, and implement all CRUD API endpoints. This phase
MUST be complete before any frontend work begins.

- [x] T200 Create monorepo directory structure — `backend/app/`, `backend/app/models/`, `backend/app/routers/`, `backend/app/middleware/`, `frontend/`, `.env.example` files, `backend/CLAUDE.md`, `frontend/CLAUDE.md`
- [x] T201 Initialize FastAPI backend project with uv — `backend/pyproject.toml` with dependencies: fastapi, uvicorn, sqlmodel, asyncpg, python-jose[cryptography], python-dotenv
- [x] T202 [P] Create backend config module loading DATABASE_URL, JWT_SECRET, FRONTEND_URL from .env in `backend/app/config.py`
- [x] T203 [P] Configure Neon PostgreSQL async connection, engine, and table creation in `backend/app/database.py`
- [x] T204 Define Task SQLModel (id UUID, title str max 200, description str max 1000, status str, user_id str, created_at, updated_at) with indexes in `backend/app/models/task.py`
- [x] T205 Implement JWT verification auth middleware — decode Bearer token, extract user_id, return 401 on invalid/missing token in `backend/app/middleware/auth.py`
- [x] T206 Create FastAPI app entry point with CORS configuration (allow FRONTEND_URL origin), mount task router, startup DB init in `backend/app/main.py`
- [x] T207 [P] Implement GET /api/tasks endpoint — list all tasks for user_id, optional `?status=` and `?search=` query params, per contract in `backend/app/routers/tasks.py`
- [x] T208 [P] Implement POST /api/tasks endpoint — create task with title+description validation, set user_id from JWT, return 201, per contract in `backend/app/routers/tasks.py`
- [x] T209 [P] Implement PATCH /api/tasks/{id} endpoint — partial update (title, description, status), enforce user_id scoping, 404 for wrong user, per contract in `backend/app/routers/tasks.py`
- [x] T210 [P] Implement DELETE /api/tasks/{id} endpoint — hard delete, enforce user_id scoping, return 204, per contract in `backend/app/routers/tasks.py`

**Checkpoint**: Backend API fully functional. Can test all 4 endpoints
with curl + manual JWT token. All return 401 without Bearer token.

---

## Phase 3: User Story 1 — User Registration & Login (Priority: P1)

**Goal**: Users can sign up, log in, log out. Unauthenticated users
are redirected to login page. Frontend sends Bearer token on every
API call.

**Independent Test**: Create account → log out → log back in →
verify session persists → access dashboard → verify redirect when
not logged in.

**Acceptance Scenarios**: spec.md US1 scenarios 1–6 (signup, login,
logout, validation errors, wrong credentials, route protection)

### Implementation for User Story 1

- [x] T211 [US1] Initialize Next.js 16+ app in `frontend/` with TypeScript and App Router — install better-auth, tailwindcss dependencies via npm
- [x] T212 [US1] Configure Better Auth client with email+password provider and JWT secret in `frontend/lib/auth.ts`
- [x] T213 [P] [US1] Create AuthProvider context wrapper that provides session state to all components in `frontend/components/providers/AuthProvider.tsx`
- [x] T214 [P] [US1] Create API client with fetch wrapper — automatically attach Bearer token from Better Auth session to every request in `frontend/lib/api.ts`
- [x] T215 [US1] Build AuthButton component (shows Login/Signup when logged out, Logout when logged in) in `frontend/components/auth/AuthButton.tsx`
- [x] T216 [US1] Build landing page with login and signup forms using Better Auth in `frontend/app/page.tsx`
- [x] T217 [US1] Create root layout with Navbar (Logo + AuthButton) and body wrapper in `frontend/app/layout.tsx`
- [x] T218 [US1] Add route protection on /dashboard — redirect unauthenticated users to / login page in `frontend/app/dashboard/page.tsx` (placeholder)

**Checkpoint**: User can sign up, log in, log out. Unauthenticated
users redirected to login. Bearer token attached to API requests.

---

## Phase 4: User Story 2 — Task CRUD Operations (Priority: P2)

**Goal**: Logged-in users can add, view, edit, delete, and mark
tasks as complete. All changes persist in Neon DB. Each user sees
only their own tasks.

**Independent Test**: Log in → add task → see it in list → edit
title → mark complete → delete → refresh page → verify persistence.

**Acceptance Scenarios**: spec.md US2 scenarios 1–8 (add, view,
edit, complete, delete, cross-device persistence, validation,
data isolation)

### Implementation for User Story 2

- [x] T219 [P] [US2] Build TaskForm component — form with title (max 200) and description (max 1000) inputs, client-side validation, calls POST /api/tasks via api client in `frontend/components/tasks/TaskForm.tsx`
- [x] T220 [P] [US2] Build TaskItem component — displays single task with title, description, status badge, Edit/Complete/Delete action buttons in `frontend/components/tasks/TaskItem.tsx`
- [x] T221 [US2] Build TaskList component — fetches tasks via GET /api/tasks, renders list of TaskItem components, handles empty state in `frontend/components/tasks/TaskList.tsx`
- [x] T222 [US2] Build full dashboard page — integrate TaskForm + TaskList, handle CRUD callbacks (add refreshes list, edit inline, complete via PATCH, delete via DELETE) in `frontend/app/dashboard/page.tsx`

**Checkpoint**: Full CRUD working end-to-end. User can add, view,
edit, complete, and delete tasks. Data persists across refreshes.

---

## Phase 5: User Story 3 — Task Filtering & Search (Priority: P3)

**Goal**: Users can filter tasks by status (All/Pending/Done) and
search by keyword. Filter and search can be combined. Results
update immediately.

**Independent Test**: Add several tasks with different statuses →
filter Pending (only pending shown) → filter Done (only completed
shown) → filter All → search keyword → verify "No matching tasks"
on empty result → clear search with filter still applied.

**Acceptance Scenarios**: spec.md US3 scenarios 1–6 (pending filter,
done filter, all filter, keyword search, no results message,
clear search)

### Implementation for User Story 3

- [x] T223 [P] [US3] Build SearchBar component — text input with debounce, emits search keyword on change in `frontend/components/ui/SearchBar.tsx`
- [x] T224 [P] [US3] Build FilterButton component — three tabs (All/Pending/Done), highlights active filter, emits status value on click in `frontend/components/ui/FilterButton.tsx`
- [x] T225 [US3] Integrate SearchBar and FilterButton into dashboard — pass status and search as query params to GET /api/tasks, update TaskList on filter/search change in `frontend/app/dashboard/page.tsx`

**Checkpoint**: Filtering and search working. Combined filter+search
returns correct results. "No matching tasks" shown when empty.

---

## Phase 6: Polish & Cross-Cutting Concerns (T226–T228)

**Purpose**: UI shell components, responsive layout, containerization

- [x] T226 [P] Build UI shell components — Logo in `frontend/components/ui/Logo.tsx`, Footer in `frontend/components/ui/Footer.tsx`, ThemeButton (dark/light toggle) in `frontend/components/ui/ThemeButton.tsx`, update Navbar in `frontend/components/ui/Navbar.tsx`
- [x] T227 Ensure responsive layout for mobile, tablet, and laptop across all pages and components using Tailwind breakpoints
- [x] T228 [P] Create docker-compose.yml at project root to orchestrate frontend (port 3000) and backend (port 8000) services

**Checkpoint**: App looks polished, works on all screen sizes,
can be started with a single `docker-compose up` command.

---

## Phase 7: End-to-End Verification (T229)

**Purpose**: Verify the complete user flow works end-to-end

- [x] T229 Manual end-to-end verification — start both servers, signup new user, login, create 3 tasks, edit one, complete one, delete one, filter by Pending, filter by Done, search by keyword, logout, login again and verify data persists

**Checkpoint**: All success criteria (SC-001 through SC-007) verified.
App is ready for demo.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 2 (Backend) ─── BLOCKS ──→ Phase 3 (US1: Auth)
Phase 3 (US1)     ─── BLOCKS ──→ Phase 4 (US2: CRUD)
Phase 4 (US2)     ─── BLOCKS ──→ Phase 5 (US3: Filter/Search)
Phase 5 (US3)     ─── BLOCKS ──→ Phase 6 (Polish)
Phase 6 (Polish)  ─── BLOCKS ──→ Phase 7 (Verification)
```

### Within Phase 2 (Backend)

```
T200 (dirs) → T201 (uv init) → T202 + T203 (parallel: config + db)
                              → T204 (Task model, needs db)
                              → T205 (auth middleware, needs config)
                              → T206 (main.py, needs config + middleware)
                              → T207 + T208 + T209 + T210 (parallel: all 4 endpoints, need model + auth)
```

### Within Phase 3 (US1: Auth)

```
T211 (nextjs init) → T212 (better auth config)
                   → T213 + T214 (parallel: AuthProvider + API client)
                   → T215 (AuthButton, needs AuthProvider)
                   → T216 (login page, needs AuthButton)
                   → T217 (layout, needs Navbar + AuthButton)
                   → T218 (route protection)
```

### Within Phase 4 (US2: CRUD)

```
T219 + T220 (parallel: TaskForm + TaskItem)
→ T221 (TaskList, needs TaskItem)
→ T222 (dashboard, needs TaskForm + TaskList + API client)
```

### Within Phase 5 (US3: Filter/Search)

```
T223 + T224 (parallel: SearchBar + FilterButton)
→ T225 (integrate into dashboard)
```

### Parallel Opportunities

```
# Phase 2 — parallel after T204 + T205:
T207, T208, T209, T210 (4 endpoints in same file, but independent logic)

# Phase 3 — parallel after T212:
T213 (AuthProvider), T214 (API client)

# Phase 4 — parallel:
T219 (TaskForm), T220 (TaskItem)

# Phase 5 — parallel:
T223 (SearchBar), T224 (FilterButton)
```

---

## Parallel Example: Phase 2 Backend Endpoints

```bash
# After T204 (model) and T205 (auth) are done, launch all endpoints:
Task: "Implement GET /api/tasks in backend/app/routers/tasks.py"
Task: "Implement POST /api/tasks in backend/app/routers/tasks.py"
Task: "Implement PATCH /api/tasks/{id} in backend/app/routers/tasks.py"
Task: "Implement DELETE /api/tasks/{id} in backend/app/routers/tasks.py"
```

## Parallel Example: Phase 4 Task Components

```bash
# After Phase 3 is done, launch form and item in parallel:
Task: "Build TaskForm component in frontend/components/tasks/TaskForm.tsx"
Task: "Build TaskItem component in frontend/components/tasks/TaskItem.tsx"
```

---

## Implementation Strategy

### MVP First (Phase 2 + Phase 3 + Phase 4)

1. Complete Phase 2: Backend API (all endpoints working with curl)
2. Complete Phase 3: US1 Auth (signup, login, logout, route protection)
3. Complete Phase 4: US2 CRUD (add, view, edit, delete, complete tasks)
4. **STOP and VALIDATE**: Test full CRUD flow end-to-end
5. This delivers a functional multi-user todo app

### Incremental Delivery

1. Phase 2 → Backend ready (test with curl)
2. + Phase 3 → Auth working (test signup/login)
3. + Phase 4 → CRUD working (test full task management) — **MVP!**
4. + Phase 5 → Filtering & search (UX enhancement)
5. + Phase 6 → Polished UI, responsive, Docker
6. + Phase 7 → End-to-end verification

---

## Task Summary

| Phase | Tasks | IDs | Description |
|-------|-------|-----|-------------|
| Phase 2 | 11 | T200–T210 | Backend Infrastructure & Database |
| Phase 3 (US1) | 8 | T211–T218 | User Registration & Login |
| Phase 4 (US2) | 4 | T219–T222 | Task CRUD Operations |
| Phase 5 (US3) | 3 | T223–T225 | Task Filtering & Search |
| Phase 6 | 3 | T226–T228 | Polish & Cross-Cutting |
| Phase 7 | 1 | T229 | End-to-End Verification |
| **Total** | **30** | **T200–T229** | |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- All backend endpoints share `backend/app/routers/tasks.py` but implement independent logic
- User table managed by Better Auth — NO backend User model needed
- All API endpoints use auth middleware and filter by user_id
- Manual testing only — no automated test tasks generated
- Commit after each task or logical group
