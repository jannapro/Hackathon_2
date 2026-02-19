# Quickstart Guide: Todo Web App

**Feature**: 002-todo-web-app
**Date**: 2026-02-09

## Prerequisites

- Python 3.12+ with [uv](https://docs.astral.sh/uv/) installed
- Node.js 20+ with npm
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- Docker and Docker Compose (optional, for containerized setup)

## Environment Setup

### 1. Clone and navigate

```bash
cd hackaton2
git checkout 002-todo-web-app
```

### 2. Backend setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your values:
#   DATABASE_URL=postgresql+asyncpg://<user>:<pass>@<host>/<db>?sslmode=require
#   JWT_SECRET=<shared-secret-same-as-frontend>
#   FRONTEND_URL=http://localhost:3000

# Install dependencies
uv sync

# Run database migrations (creates tables)
uv run python -m app.database

# Start the backend server
uv run uvicorn app.main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`

### 3. Frontend setup

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env with your values:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   BETTER_AUTH_SECRET=<shared-secret-same-as-backend>
#   BETTER_AUTH_URL=http://localhost:3000

# Install dependencies
npm install

# Start the frontend dev server
npm run dev
```

Frontend runs at: `http://localhost:3000`

### 4. Docker Compose (alternative)

```bash
# From project root
cp .env.example .env  # Edit with your values
docker-compose up --build
```

This starts both frontend and backend together.

## Verify Setup

1. Open `http://localhost:3000` in your browser
2. Click "Sign Up" and create an account
3. You should be redirected to the dashboard
4. Try adding a task — it should appear in your list

## API Quick Test

After starting the backend, test with curl:

```bash
# Health check (no auth needed)
curl http://localhost:8000/

# All other endpoints require a Bearer token.
# After logging in via the frontend, grab the token from
# your browser's dev tools (Network tab → Authorization header).

# List tasks
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/tasks

# Create a task
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test task","description":"Testing the API"}' \
     http://localhost:8000/api/tasks
```

## Shared Environment Variables

| Variable | Backend | Frontend | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | Yes | No | Neon PostgreSQL connection string |
| `JWT_SECRET` / `BETTER_AUTH_SECRET` | Yes | Yes | Shared secret for JWT signing/verification (must match) |
| `FRONTEND_URL` | Yes | No | Frontend origin for CORS |
| `NEXT_PUBLIC_API_URL` | No | Yes | Backend URL for API calls |
| `BETTER_AUTH_URL` | No | Yes | Better Auth base URL |

## Project Structure

```
hackaton2/
├── backend/               # FastAPI + SQLModel
│   ├── app/
│   │   ├── main.py        # App entry point
│   │   ├── config.py      # Settings from .env
│   │   ├── database.py    # Neon DB connection
│   │   ├── models/        # SQLModel definitions
│   │   ├── routers/       # API route handlers
│   │   └── middleware/     # JWT auth middleware
│   └── pyproject.toml
├── frontend/              # Next.js 16+ + Better Auth
│   ├── app/               # Pages (App Router)
│   ├── components/        # React components
│   ├── lib/               # Auth + API client
│   └── package.json
└── docker-compose.yml     # Orchestration
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `DATABASE_URL` connection error | Verify Neon dashboard for correct connection string; ensure `?sslmode=require` |
| CORS errors in browser | Check `FRONTEND_URL` in backend `.env` matches your frontend origin |
| 401 on all API requests | Ensure `JWT_SECRET` matches `BETTER_AUTH_SECRET` exactly |
| Frontend can't reach backend | Check `NEXT_PUBLIC_API_URL` in frontend `.env` |
