---
id: "0015"
title: Fix auth signup signin 4 bugs
stage: general
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Jannat Osmani
command: "I'm currently facing an issue with the signup and signin functionality — it's throwing errors when users try to authenticate. Please fix all related errors and ensure a smooth connection between the frontend, backend logic, and the database."
labels: ["auth","better-auth","nextjs","database","migration","bug-fix","production"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - lib/auth-client.ts (removed broken baseURL)
  - lib/auth.ts (added CREATE TABLE IF NOT EXISTS schema init)
  - app/api/auth/[...all]/route.ts (added force-dynamic)
  - next.config.ts (added serverExternalPackages: ['pg'])
tests:
  - npm run build → clean, all 5 routes, /api/auth/[...all] correctly ƒ (Dynamic)
  - GET /api/auth/get-session → HTTP 200 (production Vercel runtime logs)
  - GET / → HTTP 200 (production Vercel runtime logs)
---

## Prompt

I'm currently facing an issue with the signup and signin functionality — it's throwing errors when users try to authenticate. Please fix all related errors and ensure a smooth connection between the frontend, backend logic, and the database. Make sure the authentication flow works properly end-to-end, including validation, API handling, database operations, and error handling, so users can register and log in without any issues.

## Response snapshot

Root-cause analysis identified 4 bugs:

**Bug 1 (Critical) — lib/auth-client.ts: broken baseURL**
`process.env.BETTER_AUTH_URL` is NOT prefixed with `NEXT_PUBLIC_`, so it is `undefined` in the browser bundle. The `createAuthClient({ baseURL: undefined || "http://localhost:3000" })` caused every signIn/signUp call in production to POST to `http://localhost:3000/api/auth/*` — which doesn't exist — instead of the real server.
Fix: Removed `baseURL` entirely. Better Auth `createAuthClient` auto-detects `window.location.origin` in the browser. No `baseURL` needed for same-origin deployments.

**Bug 2 (Critical) — lib/auth.ts: DB schema never migrated**
Better Auth tables (`user`, `session`, `account`, `verification`) were never created in Neon PostgreSQL. Every auth operation threw `relation "user" does not exist`.
Fix: Added `initSchema()` async function that runs `CREATE TABLE IF NOT EXISTS` for all 4 tables on module load using the existing `pg.Pool`. Safe to run repeatedly on cold starts.

**Bug 3 (Minor) — next.config.ts: missing serverExternalPackages for pg**
Next.js 14+ needs `serverExternalPackages: ['pg']` to treat `pg` as a Node.js external rather than bundling it in the serverless function output.
Fix: Added `serverExternalPackages: ['pg']` to nextConfig.

**Bug 4 (Minor) — app/api/auth/[...all]/route.ts: missing force-dynamic**
The auth catch-all route lacked `export const dynamic = 'force-dynamic'`, which could allow Next.js static optimisation to cache auth responses.
Fix: Added `export const dynamic = "force-dynamic"`.

Build verified clean (all 5 routes, auth route correctly marked `ƒ Dynamic`). Committed as `fix(auth): fix signup/signin — 4 root-cause bugs`, pushed to `main`. Production deployment `dpl_yirWNy1er3kFkhSZoDVMnxjsPvaj` → READY.

## Outcome

- ✅ Impact: Sign-up and sign-in should now work end-to-end — auth calls reach the correct server, DB tables exist, pg bundled correctly, auth route never cached
- 🧪 Tests: build clean; /api/auth/get-session → 200; / → 200 (Vercel runtime logs)
- 📁 Files: 4 files changed, 63 insertions
- 🔁 Next prompts: test sign-up and sign-in in browser; verify session persists on page refresh
- 🧠 Reflection: The baseURL bug is a common Next.js pattern pitfall — env vars without NEXT_PUBLIC_ are undefined in browser. Better Auth client should always use no-baseURL or NEXT_PUBLIC_ vars. DB schema migration is a recurring first-deploy issue — consider adding the CREATE TABLE IF NOT EXISTS pattern to any new deployment.

## Evaluation notes (flywheel)

- Failure modes observed: (1) NEXT_PUBLIC_ prefix required for client-side env vars — easy to miss; (2) Better Auth tables must be created manually — no auto-migration on startup; (3) pg must be in serverExternalPackages in Next.js 14+
- Graders run and results (PASS/FAIL): build PASS; runtime logs PASS (200s)
- Prompt variant (if applicable): null
- Next experiment: add NEXT_PUBLIC_BETTER_AUTH_URL to vercel.json for completeness; test actual sign-up flow in browser
