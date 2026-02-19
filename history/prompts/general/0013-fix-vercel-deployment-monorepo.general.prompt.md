---
id: "0013"
title: Fix Vercel deployment monorepo config
stage: general
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 003-ai-agent-interface
user: Jannat Osmani
command: fix vercel deployment and push
labels: ["vercel","deployment","monorepo","nextjs","fix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - vercel.json (created)
  - frontend/ (deleted stale dir at root)
tests:
  - npm run build → clean (0 errors, all 5 routes)
  - git push exit code 0
---

## Prompt

i have to deploy it on vercel so make the build and of the project and push it to github and fix all the isssue currently when i select code present to next.js on vercel it's giving an error also when i select other it's showing 404 code not found fix the issue and push it

## Response snapshot

Root causes identified:
1. Stale `frontend/` directory at repo root (from before git mv) — had only `.next/dev` inside; Vercel was detecting this as the Next.js project instead of `src/frontend/`
2. No `vercel.json` — Vercel didn't know where to find or build the actual app

Fixes applied:
- Deleted stale `frontend/` at repo root
- Created `vercel.json` at repo root:
  ```json
  {
    "framework": "nextjs",
    "buildCommand": "npm --prefix src/frontend run build",
    "outputDirectory": "src/frontend/.next",
    "installCommand": "npm --prefix src/frontend install"
  }
  ```
- Verified clean build (all 5 routes: /, /_not-found, /api/auth/[...all], /dashboard, /tasks)
- Committed and pushed to GitHub

## Outcome

- ✅ Impact: Vercel will now correctly detect Next.js, install deps from src/frontend/, build to src/frontend/.next
- 🧪 Tests: npm run build → 0 errors, 5 routes generated
- 📁 Files: vercel.json created, stale frontend/ removed
- 🔁 Next prompts: set env vars in Vercel dashboard (NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL)
- 🧠 Reflection: Stale directories from git mv must be explicitly deleted — git tracks files not dirs, so empty/untracked dirs persist and confuse tooling

## Evaluation notes (flywheel)

- Failure modes observed: Vercel selecting wrong project root due to stale dir; no vercel.json for monorepo
- Graders run and results (PASS/FAIL): build PASS
- Prompt variant (if applicable): null
- Next experiment: test full Vercel deployment after env vars set
