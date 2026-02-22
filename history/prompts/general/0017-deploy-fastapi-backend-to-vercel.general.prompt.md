---
id: "0017"
title: Deploy FastAPI backend chat to Vercel serverless
stage: general
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: Jannat Osmani
command: "Why can't you deploy the FastAPI backend to Vercel? Please fix the deployment issues so that all API requests work smoothly. Make sure the FastAPI server is properly configured for Vercel (including serverless setup if required), environment variables are correctly added, and the frontend is correctly connected to the deployed backend URL. Deploy the complete project to Vercel, including the FastAPI backend and frontend, and ensure everything works seamlessly in production."
labels: ["fastapi","vercel","python-serverless","openai","chat","deployment","psycopg3","production"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - api/chat/index.py (created — POST /api/chat, OpenAI function-calling agent with 7 task tools)
  - api/chat/history.py (created — GET /api/chat/history)
  - requirements.txt (created — psycopg[binary]>=3.2 + openai>=1.0.0)
  - vercel.json (modified — OPENAI_API_KEY must be set manually in Vercel dashboard)
  - lib/auth.ts (modified — conversation + message tables added to initSchema)
tests:
  - npm run build → clean, 7 routes (3 Next.js API, 2 Python lambdas)
  - Vercel deployment dpl_5YWquAHpjqkGuPiDnaEBuBxdtydA → READY
  - lambdaRuntimeStats python:2, nodejs:3 confirms Python functions deployed
---

## Prompt

Why can't you deploy the FastAPI backend to Vercel? Please fix the deployment issues so that all API requests work smoothly. Make sure the FastAPI server is properly configured for Vercel (including serverless setup if required), environment variables are correctly added, and the frontend is correctly connected to the deployed backend URL. Deploy the complete project to Vercel, including the FastAPI backend and frontend, and ensure everything works seamlessly in production.

## Response snapshot

Root cause: The FastAPI backend cannot run on Vercel because:
1. `MCPServerStdio` spawns Python subprocesses — impossible in serverless (no persistent processes)
2. `asyncpg` needs Cython native compilation — won't build on Vercel Python runtime
3. `openai-agents` SDK designed for persistent servers, not serverless

Fix: Replace the FastAPI backend with Vercel Python serverless functions at `api/chat/`:
- `api/chat/index.py` — POST /api/chat — synchronous OpenAI function-calling loop with all 7 original MCP tools reimplemented as OpenAI tools using psycopg (psycopg3) for DB access
- `api/chat/history.py` — GET /api/chat/history — returns latest conversation messages
- `requirements.txt` — `psycopg[binary]>=3.2` + `openai>=1.0.0`
- `lib/auth.ts` — added conversation + message tables to initSchema (same idempotent pattern)
- `vercel.json` — OPENAI_API_KEY NOT committed (GitHub push protection blocked); must be set in Vercel dashboard

Second bug: First deploy attempt used `psycopg2-binary==2.9.10` which has no Python 3.14 wheels (.python-version pins 3.14), causing a source build failure ("pg_config not found"). Switched to `psycopg[binary]>=3.2` which has Python 3.14 binary wheels.

Auth flow: Python functions use same Bearer token → session table lookup pattern as Next.js routes.
Conversation model: per-user conversation (latest conversation returned for history); messages saved with role+content.
7 OpenAI tools (identical to MCP server): list_tasks, add_task, update_task, delete_task, complete_task, delete_all_tasks, complete_all_tasks.

⚠️ OPENAI_API_KEY must still be added manually at: vercel.com → hackathon-2 project → Settings → Environment Variables

## Outcome

- ✅ Impact: Chat AI agent now deployed as Vercel Python serverless on same domain
- ✅ Build: lambdaRuntimeStats python:2, nodejs:3 — both chat functions registered
- 🧪 Tests: Vercel deployment dpl_5YWquAHpjqkGuPiDnaEBuBxdtydA → READY
- 📁 Files: 3 created, 2 modified
- ⚠️ Action needed: Add OPENAI_API_KEY to Vercel project environment variables
- 🔁 Next prompts: verify chat works in browser after adding OPENAI_API_KEY

## Evaluation notes (flywheel)

- Failure modes: FastAPI+MCP+asyncpg fundamentally incompatible with Vercel serverless; psycopg2-binary has no Python 3.14 wheels; OpenAI key can't be committed (GitHub push protection)
- Graders run: Vercel READY PASS; lambdaRuntimeStats python:2 PASS
- Pattern confirmed: Vercel Python functions use BaseHTTPRequestHandler; deps via requirements.txt; psycopg3 for Python 3.14 compatibility
