---
id: 008
title: Todo Web App Implementation Plan
stage: plan
date: 2026-02-09
surface: agent
model: claude-opus-4-6
feature: todo-web-app
branch: 002-todo-web-app
user: Jannat Osmani
command: /sp.plan
labels: ["plan", "todo-app", "web", "fullstack", "architecture", "monorepo"]
links:
  spec: specs/002-todo-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-todo-web-app/plan.md
  - specs/002-todo-web-app/research.md
  - specs/002-todo-web-app/data-model.md
  - specs/002-todo-web-app/contracts/rest-api.md
  - specs/002-todo-web-app/quickstart.md
tests:
  - none
---

## Prompt

Read the constitution file and specs.md understand it and make the plan according to it

System Architecture:
Monorepo Setup
frontend/ — Next.js 16+ (App Router)
backend/ — FastAPI (Python)
Shared .env for JWT secret
docker-compose.yml for orchestration

Database Design
Neon Serverless PostgreSQL
User table (managed by Better Auth): id, email, password, created_at
Task table: id (UUID), title, description, status, user_id (FK → User), created_at, updated_at
Indexes: user_id, user_id + status composite

Authentication Flow
Better Auth (frontend) handles signup/login/session → generates JWT
Backend auth middleware: verifies JWT → extracts user_id
All /api/tasks/* endpoints require Bearer token
Shared JWT secret in .env on both sides

API Endpoints
GET /api/tasks — list tasks (optional: ?status=pending&search=keyword)
POST /api/tasks — create task {title, description}
PATCH /api/tasks/{id} — update task {title?, description?, status?}
DELETE /api/tasks/{id} — delete task

Frontend Pages
/ — Landing page with login/signup (Better Auth)
/dashboard — Protected task manager page

Frontend Components
TaskForm — Add/edit task form
TaskList — Renders all tasks
TaskItem — Single task with actions (edit, delete, complete)
AuthButton — Login/Signup/Logout toggle
Navbar — Top navigation with logo and auth
Footer — Page footer
Logo — App branding
ThemeButton — Dark/light mode toggle
SearchBar — Keyword search input
FilterButton — All/Pending/Done filter tabs

Implementation Steps (in this order)
1. Monorepo setup (directories, dependencies, docker-compose, .env files, CLAUDE.md files)
2. Database + Models (Neon connection, Task SQLModel, Better Auth user table)
3. Backend API + JWT (auth middleware, all 4 CRUD endpoints, user_id scoping)
4. Frontend Auth + API Client (Better Auth config, AuthProvider, login/signup page, API client with Bearer)
5. UI Integration (all components, CRUD wiring, filter + search, responsive layout)

## Response snapshot

Created comprehensive implementation plan for the Todo Web App feature. Produced 5 design artifacts: plan.md (full implementation plan with monorepo structure, auth flow, API endpoints, frontend components, and 5 implementation steps), research.md (6 design decisions covering auth architecture, JWT sharing, DB schema ownership, Task SQLModel design, API client pattern, and filtering approach), data-model.md (User and Task entities with validation rules, state transitions, relationships, and 3 database indexes), contracts/rest-api.md (4 REST endpoint contracts with request/response schemas, error formats, and CORS headers), and quickstart.md (setup guide for backend, frontend, Docker Compose, environment variables, and troubleshooting).

## Outcome

- Impact: Complete architecture plan with 5 design artifacts covering all implementation aspects
- Tests: none
- Files: specs/002-todo-web-app/plan.md, research.md, data-model.md, contracts/rest-api.md, quickstart.md
- Next prompts: /sp.tasks to generate actionable task breakdown
- Reflection: Plan aligns with constitution v2.0.0 (monorepo, tech stack, security, dev process); Better Auth on frontend with JWT-only verification on backend keeps auth centralized

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution check — all 4 gates PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
