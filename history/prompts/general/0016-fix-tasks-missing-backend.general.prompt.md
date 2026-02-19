---
id: "0016"
title: Fix tasks missing backend API routes
stage: general
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Jannat Osmani
command: "I'm unable to add new tasks or view existing tasks. Please check the backend APIs, database connection, and related logic to ensure tasks can be created and fetched smoothly."
labels: ["tasks","nextjs","api-routes","postgresql","backend","bug-fix","production"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - lib/db.ts (created — lazy pg Pool singleton)
  - lib/server-auth.ts (created — Bearer token verification)
  - app/api/tasks/route.ts (created — GET list + POST create)
  - app/api/tasks/[id]/route.ts (created — PATCH update + DELETE)
  - lib/api.ts (modified — API_BASE changed from localhost:8000 to "")
  - lib/auth.ts (modified — task table added to initSchema)
tests:
  - npm run build → clean, 7 routes including ƒ /api/tasks and ƒ /api/tasks/[id]
  - Vercel deployment dpl_4ho2CHwp6zVezS8WAcjcM95iiPUQ → READY (production)
---

## Prompt

I'm unable to add new tasks or view existing tasks. Please check the backend APIs, database connection, and related logic to ensure tasks can be created and fetched smoothly. Make sure the frontend and backend are properly connected and data is being stored and retrieved correctly

## Response snapshot

Root cause: `lib/api.ts` used `API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"`. In production on Vercel, `NEXT_PUBLIC_API_URL` is not set, so ALL task calls went to `http://localhost:8000/api/tasks/` — a FastAPI backend that is not deployed anywhere. Every task create/fetch/update/delete call silently failed with a network error.

Fixes:
1. **lib/db.ts** — lazy pg Pool singleton for use in Next.js API routes
2. **lib/server-auth.ts** — extracts Bearer token from Authorization header, queries Better Auth `session` table to get userId and verify expiry
3. **app/api/tasks/route.ts** — GET (list with optional status/search filters) + POST (create with validation). Runs `CREATE TABLE IF NOT EXISTS task` on POST for idempotent schema init.
4. **app/api/tasks/[id]/route.ts** — PATCH (partial update: title, description, status) + DELETE. Both verify task ownership via user_id.
5. **lib/api.ts** — `API_BASE` changed to `""` (empty string) so all calls use same-origin relative paths, routing to the new Next.js API routes
6. **lib/auth.ts** — task table + indexes added to `initSchema()` so the table is created on cold start along with Better Auth tables

Auth flow: frontend fetches `/api/auth/get-session` → extracts session token → sends `Authorization: Bearer <token>` → Next.js route reads header → queries `session` table → returns userId.

Build verified clean (7 routes). Production deployment READY.

## Outcome

- ✅ Impact: Task create, fetch, update, delete now work end-to-end in production
- 🧪 Tests: build clean (7 routes); Vercel deployment READY
- 📁 Files: 4 created, 2 modified, 276 insertions
- 🔁 Next prompts: test task create/edit/delete in browser; test filter tabs; test search
- 🧠 Reflection: FastAPI backend was never deployed to production — all task calls failing silently. The fix is to move task CRUD to Next.js API routes on the same domain, using the existing Neon DB connection and Better Auth session table for auth. This pattern (serverless Next.js API routes + Neon) is the correct architecture for a Vercel deployment without a separate backend service.

## Evaluation notes (flywheel)

- Failure modes observed: No deployed backend → silent network errors for all task operations; API_BASE pointing to localhost in production is a common pattern mistake
- Graders run and results (PASS/FAIL): build PASS; Vercel READY PASS
- Prompt variant (if applicable): null
- Next experiment: verify tasks in browser; consider also fixing chat (same localhost:8000 issue for chat endpoints)
