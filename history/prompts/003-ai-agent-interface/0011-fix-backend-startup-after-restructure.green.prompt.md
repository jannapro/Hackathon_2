---
id: "0011"
title: Fix backend startup after src restructure
stage: green
date: 2026-02-19
surface: agent
model: claude-sonnet-4-6
feature: 003-ai-agent-interface
branch: 003-ai-agent-interface
user: Jannat Osmani
command: run it
labels: ["backend","uv","venv","debugging","startup"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/backend/.venv (deleted stale, rebuilt fresh)
tests:
  - curl http://localhost:8000/ → {"status":"ok","service":"todo-backend"}
  - curl http://localhost:3000/ → HTTP 200
---

## Prompt

run it

## Response snapshot

The backend failed to start after the `git mv backend src/backend` restructure. The `.venv` had stale shebang lines pointing to the old path `/Users/janna/Documents/project/hackaton2/backend/.venv/bin/python` which no longer existed.

Fix steps:
1. Ran `uv sync` — appeared to succeed but uvicorn still failed (stale binaries)
2. Ran `.venv/bin/uvicorn` directly — confirmed bad interpreter path in shebang
3. Deleted `.venv` entirely: `rm -rf .venv`
4. Ran `uv sync` fresh — rebuilt all 58 packages with correct `src/backend/.venv/bin/python` paths
5. Started backend: `uv run uvicorn app.main:app --reload --port 8000` — **SUCCESS**

Both services confirmed running:
- Backend: `http://localhost:8000` → `{"status":"ok","service":"todo-backend"}`
- Frontend: `http://localhost:3000` → HTTP 200

## Outcome

- ✅ Impact: Both backend (port 8000) and frontend (port 3000) running successfully
- 🧪 Tests: curl verified both endpoints return expected responses
- 📁 Files: .venv rebuilt at src/backend/.venv with correct absolute paths
- 🔁 Next prompts: test full auth+task flow end-to-end, deploy
- 🧠 Reflection: After `git mv`, always delete and rebuild .venv — uv sync alone doesn't fix stale shebang paths in existing binaries

## Evaluation notes (flywheel)

- Failure modes observed: `uv sync` on existing stale venv doesn't update binary shebang lines — must delete .venv first
- Graders run and results (PASS/FAIL): manual curl tests PASS
- Prompt variant (if applicable): null
- Next experiment: add .venv to .gitignore check to prevent committing venv accidentally
