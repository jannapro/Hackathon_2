# MCP Tool Contracts

**Feature**: 003-ai-agent-interface
**Server name**: `task-manager`
**Transport**: stdio (subprocess, `MCPServerStdio`)
**Module**: `backend/app/mcp_server/server.py`

All tools MUST:
- Accept `user_id: str` as the first parameter (injected by the agent runner
  from the server-side verified JWT — never from the chat message content).
- Return a JSON-serializable `dict`.
- Scope all DB queries to `user_id`.
- Return a structured error dict (never raise unhandled exceptions).

---

## Tool: `add_task`

Create a new task for the authenticated user.

**Signature**
```python
@mcp.tool()
async def add_task(
    user_id: str,
    title: str,
    description: str,
    status: str = "pending",
) -> dict:
```

**Arguments**

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `user_id` | str | yes | Injected server-side |
| `title` | str | yes | 1–200 chars |
| `description` | str | yes | 1–1000 chars |
| `status` | str | no | `"pending"` (default) |

**Returns — success**
```json
{
  "status": "created",
  "task_id": "uuid",
  "title": "Finish the report by Friday",
  "description": "Include the executive summary section"
}
```

**Returns — error**
```json
{ "status": "error", "message": "Title is required" }
```

---

## Tool: `list_tasks`

Return all tasks for the user, optionally filtered by status.

**Signature**
```python
@mcp.tool()
async def list_tasks(
    user_id: str,
    status: str | None = None,
) -> dict:
```

**Arguments**

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `user_id` | str | yes | Injected server-side |
| `status` | str or null | no | `"pending"` or `"completed"` |

**Returns — success**
```json
{
  "status": "ok",
  "tasks": [
    {
      "task_id": "uuid",
      "title": "Finish the report",
      "description": "Include executive summary",
      "status": "pending",
      "created_at": "2026-02-17T14:00:00Z"
    }
  ],
  "count": 1
}
```

**Returns — empty**
```json
{ "status": "ok", "tasks": [], "count": 0 }
```

---

## Tool: `update_task`

Update the title (and optionally description) of an existing task.

**Signature**
```python
@mcp.tool()
async def update_task(
    user_id: str,
    task_id: str,
    title: str,
    description: str | None = None,
) -> dict:
```

**Arguments**

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `user_id` | str | yes | Injected server-side |
| `task_id` | str | yes | Valid UUID of user-owned task |
| `title` | str | yes | 1–200 chars |
| `description` | str or null | no | 1–1000 chars if provided |

**Returns — success**
```json
{
  "status": "updated",
  "task_id": "uuid",
  "title": "Finish the report with executive summary"
}
```

**Returns — error**
```json
{ "status": "error", "message": "Task not found" }
```

---

## Tool: `delete_task`

Permanently delete a task owned by the user.

**Signature**
```python
@mcp.tool()
async def delete_task(
    user_id: str,
    task_id: str,
) -> dict:
```

**Arguments**

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `user_id` | str | yes | Injected server-side |
| `task_id` | str | yes | Valid UUID of user-owned task |

**Returns — success**
```json
{ "status": "deleted", "task_id": "uuid" }
```

**Returns — error**
```json
{ "status": "error", "message": "Task not found" }
```

---

## Tool: `complete_task`

Transition a task's status from `pending` to `completed`.

**Signature**
```python
@mcp.tool()
async def complete_task(
    user_id: str,
    task_id: str,
) -> dict:
```

**Arguments**

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `user_id` | str | yes | Injected server-side |
| `task_id` | str | yes | Valid UUID of user-owned task |

**Returns — success**
```json
{ "status": "completed", "task_id": "uuid", "title": "Finish the report" }
```

**Returns — error**
```json
{ "status": "error", "message": "Task not found or already completed" }
```

---

## Security Contract

The MCP server subprocess MUST:
1. Accept `user_id` as an explicit tool argument.
2. Never trust any other source for `user_id` (not env vars, not a global).
3. Filter ALL database queries with `WHERE user_id = :user_id`.
4. Return `{ "status": "error", "message": "Task not found" }` (not 404) when
   a task exists but belongs to a different user — do not reveal existence.
