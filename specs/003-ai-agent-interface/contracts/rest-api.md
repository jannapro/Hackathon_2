# REST API Contract: Chat Endpoint

**Feature**: 003-ai-agent-interface
**Base URL**: `http://localhost:8000`
**Auth**: Bearer token in `Authorization` header (same as existing task endpoints)

---

## POST /api/chat

Send a new user message. The backend fetches conversation history, runs the
agent, saves the response, and returns the agent's reply.

### Request

**Headers**
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

**Body**
```json
{
  "message": "Add a task to finish the report by Friday"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `message` | string | yes | 1–2000 chars, non-empty |

### Response — 200 OK

```json
{
  "response": "Done! I've added a task called 'Finish the report by Friday' for you.",
  "conversation_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | Agent's natural-language reply |
| `conversation_id` | string (UUID) | ID of the user's conversation |

### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"detail": "Invalid token"}` | Missing or invalid Bearer token |
| 422 | `{"detail": [...]}` | Validation error (empty message, too long) |
| 500 | `{"detail": "Agent error"}` | OpenAI API failure or MCP tool error |

---

## GET /api/chat/history

Load the user's conversation history to populate the chat panel on page load.

### Request

**Headers**
```
Authorization: Bearer <session-token>
```

### Response — 200 OK

```json
{
  "conversation_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "messages": [
    {
      "id": "a1b2c3d4-...",
      "role": "user",
      "content": "Add a task to finish the report",
      "created_at": "2026-02-17T14:00:00Z"
    },
    {
      "id": "b2c3d4e5-...",
      "role": "assistant",
      "content": "Done! I've added the task for you.",
      "created_at": "2026-02-17T14:00:02Z"
    }
  ]
}
```

**Notes**:
- Returns only `user` and `assistant` roles. `tool` messages are internal and
  not exposed to the frontend.
- Messages are ordered ascending by `created_at`.
- Returns empty `messages: []` if the user has no conversation yet.

### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"detail": "Invalid token"}` | Missing or invalid Bearer token |

---

## Existing Endpoints (unchanged)

All existing task endpoints remain unchanged:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks/` | List tasks (with optional status/search filter) |
| POST | `/api/tasks/` | Create task |
| PATCH | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
