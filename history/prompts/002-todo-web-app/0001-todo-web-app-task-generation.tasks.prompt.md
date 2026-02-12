---
id: 009
title: Todo Web App Task Generation
stage: tasks
date: 2026-02-09
surface: agent
model: claude-opus-4-6
feature: todo-web-app
branch: 002-todo-web-app
user: Jannat Osmani
command: /sp.tasks
labels: ["tasks", "todo-app", "web", "fullstack", "monorepo", "crud"]
links:
  spec: specs/002-todo-web-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-todo-web-app/tasks.md
tests:
  - none
---

## Prompt

## task

read the plan you generated understand the monorepo rules read spec and define them in actionable steps

in phase 2 tasks all the task starts with id T200 to separate with phase 1
Infrastructure and Database
- create monorepo folders frontend (nextjs) backend (fastapi) configure npm and uv, setup .env
-  database and model configure in neon db in db.py, define user and task model in models.py
- auth middleware : implement JWT verification in FASTAPI. it must decode token and return userid.
- api endpoints: implement all crud operation GET POST DELETE PATCH PUT UPDATE all endpoints must use auth middleware and filter userid
# Setup Interface :
- initialize nextjs and install better auth and dependencies
- api client: create a api file. implement functions call backend automatically attach the bearer and header from better auth
- task dashboard UI: build taskform and task list and connect them with api client
- verify user can signin signup create task and see

## Response snapshot

Generated 30 actionable tasks (T200–T229) organized across 6 phases, mapped to 3 user stories from spec.md. Phase 2 (T200–T210): 11 backend infrastructure tasks covering monorepo setup, uv init, config, Neon DB connection, Task SQLModel, JWT auth middleware, and all 4 CRUD endpoints (GET/POST/PATCH/DELETE /api/tasks). Phase 3 US1 (T211–T218): 8 frontend auth tasks covering Next.js init, Better Auth config, AuthProvider, API client with Bearer token, AuthButton, login page, layout, route protection. Phase 4 US2 (T219–T222): 4 task CRUD UI tasks for TaskForm, TaskItem, TaskList, and dashboard integration. Phase 5 US3 (T223–T225): 3 filtering/search tasks for SearchBar, FilterButton, and dashboard integration. Phase 6 (T226–T228): 3 polish tasks for UI shell, responsive layout, docker-compose. Phase 7 (T229): 1 end-to-end verification task. Dependency graph and parallel execution opportunities documented.

## Outcome

- Impact: 30 actionable tasks with dependency graph, parallel opportunities, and MVP strategy
- Tests: none (manual testing only)
- Files: specs/002-todo-web-app/tasks.md
- Next prompts: /sp.implement to execute all tasks
- Reflection: Tasks follow user's requested order (backend infra → frontend auth → CRUD UI → filter/search → polish → verify); T200+ IDs cleanly separate from Phase 1 CLI app tasks

## Evaluation notes (flywheel)

- Failure modes observed: PHR script required full feature name (002-todo-web-app not todo-web-app)
- Graders run and results (PASS/FAIL): Format validation — all 30 tasks follow checklist format PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
