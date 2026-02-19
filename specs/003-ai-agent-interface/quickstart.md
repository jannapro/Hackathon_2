# Quickstart: Conversational AI Agent Interface

**Feature**: 003-ai-agent-interface
**Prerequisites**: Phase 2 (todo-web-app) running correctly

---

## 1. Add environment variables

**`backend/.env`** — add:
```
OPENAI_API_KEY=sk-...your-key...
```

**`frontend/.env`** — no new variables needed.

---

## 2. Install new backend dependencies

```bash
cd backend
uv add openai-agents mcp
uv sync
```

---

## 3. Start the backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

The MCP server subprocess is started automatically by the agent runner when the
first `/api/chat` request is received.

---

## 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 5. Verify the chat endpoint manually

```bash
# Get a session token first (login via browser, copy from DevTools → Application → Cookies)
TOKEN="your-session-token"

curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "add a task called test the chat endpoint"}'
```

Expected response:
```json
{
  "response": "Done! I've created a task called 'Test the chat endpoint' for you.",
  "conversation_id": "..."
}
```

---

## 6. Verify via the dashboard

1. Open http://localhost:3000
2. Log in
3. The chat panel appears in the right side of the dashboard
4. Type: `add a task called hello world`
5. Confirm the task card appears in the task grid without a page refresh
6. Type: `show me all my tasks` — confirm the agent lists them
7. Type: `delete it` — confirm the last added task is deleted

---

## Acceptance Validation Checklist

- [ ] `POST /api/chat` returns 401 for unauthenticated requests
- [ ] `POST /api/chat` with `"add a task called X"` creates a task (visible in `/api/tasks/`)
- [ ] `GET /api/chat/history` returns previous messages in order
- [ ] Second message referencing "it" correctly resolves to prior context
- [ ] `list_tasks` MCP tool only returns tasks for the requesting user
- [ ] Existing task form UI still works (no regression)
- [ ] Tasks created via chat appear in the task card grid without refresh
