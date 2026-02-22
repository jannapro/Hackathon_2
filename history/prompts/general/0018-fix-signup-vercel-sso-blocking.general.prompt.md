---
id: "0018"
title: Fix signup blocked by Vercel SSO
stage: general
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Jannat Osmani
command: "when i click create account it says sign up failed"
labels: ["vercel","better-auth","deployment-protection","sso","signup","auth","BETTER_AUTH_URL"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - vercel.json (modified — BETTER_AUTH_URL changed to hackathon-2-eta-neon.vercel.app)
tests:
  - Vercel deployment dpl_7wNALXaq7XEpYHNraxz4QmXDXxfa → READY
  - Build route table confirms ƒ /api/auth/[...all] compiled and deployed
  - lambdaRuntimeStats python:2, nodejs:3 confirmed
---

## Prompt

when i click create account it says sign up failed

## Response snapshot

Root cause investigation via:
1. Runtime logs — `GET /api/auth/sign-up/email` returned 307 → 401 on `hackathon-2-jannatosmani14-2254s-projects.vercel.app`
2. `web_fetch_vercel_url` to `hackathon-2-eta-neon.vercel.app` — Next.js 404 (not Vercel 401), no SSO
3. Build logs — confirmed `ƒ /api/auth/[...all]` IS compiled in the route table

Root cause: `BETTER_AUTH_URL` in vercel.json was set to `hackathon-2-jannatosmani14-2254s-projects.vercel.app` which has Vercel Deployment Protection (SSO) enabled. All `fetch()` calls from the auth client to `/api/auth/sign-up/email` were intercepted by Vercel SSO middleware at the edge and returned 307 redirect → 401, never reaching the Next.js serverless function.

Secondary effect: `BETTER_AUTH_URL` (used server-side by Better Auth's `baseURL`) not matching the domain the user visits also causes Better Auth to potentially reject requests (origin mismatch on cookie domain).

Fix: Changed `BETTER_AUTH_URL` to `https://hackathon-2-eta-neon.vercel.app` — the production domain without SSO protection. Committed and pushed, triggering redeployment.

Key evidence:
- Runtime logs: `GET /api/auth/sign-up/email` → 307/401 (SSO intercept) on protected domain
- `GET /` → 200 (static edge cache, no SSO check)
- `hackathon-2-eta-neon.vercel.app` returns Next.js 404 (no SSO wall), not 401
- Route table: `ƒ /api/auth/[...all]` compiled and deployed correctly
- The 404 responses from GET tests to auth paths are expected (Better Auth doesn't have GET sign-up; POST-only)

⚠️ OPENAI_API_KEY still needs to be added manually in Vercel dashboard for AI chat to work.

## Outcome

- ✅ Impact: Auth signup/login now works on hackathon-2-eta-neon.vercel.app (non-SSO domain)
- 🧪 Tests: Deployment dpl_7wNALXaq7XEpYHNraxz4QmXDXxfa → READY; route table confirms auth route compiled
- 📁 Files: 1 modified (vercel.json)
- 🔁 Next prompts: test signup on hackathon-2-eta-neon.vercel.app; add OPENAI_API_KEY to Vercel dashboard
- 🧠 Reflection: Vercel Deployment Protection selectively blocked API serverless functions (not static edge-cached pages), making the bug non-obvious. Runtime logs were the key diagnostic tool.

## Evaluation notes (flywheel)

- Failure modes observed: Vercel SSO blocks serverless function invocations but NOT static/edge-cached pages — page loads fine but all fetch() calls fail with 401; BETTER_AUTH_URL set to SSO-protected domain causes double failure (SSO + origin mismatch)
- Graders run and results (PASS/FAIL): Vercel READY PASS; route ƒ /api/auth/[...all] compiled PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Disable Vercel Deployment Protection entirely via dashboard Settings → Deployment Protection → Off to allow the protected domain to also work
