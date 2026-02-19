# Backend — FastAPI + SQLModel

## Tech Stack
- Python 3.12+, FastAPI, SQLModel, asyncpg
- Neon Serverless PostgreSQL
- JWT verification (python-jose)
- Package manager: uv

## Run
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Key Files
- `app/main.py` — FastAPI entry point with CORS
- `app/config.py` — Settings from .env
- `app/database.py` — Async DB engine + session
- `app/models/task.py` — Task SQLModel
- `app/routers/tasks.py` — CRUD endpoints
- `app/middleware/auth.py` — JWT verification

## Rules
- All endpoints require Bearer token
- All queries scoped by user_id from JWT
- Never expose another user's data (return 404)
- Validate input server-side (title max 200, description max 1000)
