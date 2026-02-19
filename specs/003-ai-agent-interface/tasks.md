# Tasks: 003 — Conversational AI Agent Interface

**Feature**: `003-ai-agent-interface` | **Branch**: `003-ai-agent-interface`
**Input**: specs/003-ai-agent-interface/{spec.md, plan.md, data-model.md, contracts/}
**Task IDs**: T-300 onwards (Phase 1–2 used T001–T023, Phase 2 web app used T200+)

---

## Format

- `- [x] T-3XX [P?] [USX?] Description with exact file path`
- **[P]**: Parallelisable — different files, no unresolved dependencies
- **[US1/US2/US3]**: User story the task belongs to (traceability)

---

## Phase 1: Database Infrastructure

**Purpose**: Add `conversation` and `message` tables to the existing schema so
history can be persisted. Also scaffold the MCP server and agent package
directories. **No user story work can begin until this phase is complete.**

### Database Migration

- [x] T-300 [P] Create `backend/app/models/conversation.py` — define `Conversation` SQLModel table with fields `id` (UUID PK), `user_id` (str, NOT NULL, indexed as `ix_conversation_user_id`), `created_at` (datetime, default utcnow)
- [x] T-301 [P] Create `backend/app/models/message.py` — define `Message` SQLModel table with fields `id` (UUID PK), `conversation_id` (UUID FK → conversation.id, NOT NULL), `role` (str, VARCHAR 20, NOT NULL — values: user/assistant/tool), `content` (str, TEXT, NOT NULL), `created_at` (datetime, default utcnow); add composite index `ix_message_conv_created` on `(conversation_id, created_at)`
- [x] T-302 Update `backend/app/database.py` — import `Conversation` and `Message` so `SQLModel.metadata.create_all()` in `init_db()` picks up the new tables on startup (additive migration, no existing columns changed)

### MCP Server Setup

- [x] T-303 [P] Create `backend/app/mcp_server/__init__.py` (empty) and create `backend/app/mcp_server/server.py` — initialise `FastMCP("task-manager")` from `mcp.server.fastmcp`, add `if __name__ == "__main__": mcp.run()` entrypoint (stdio transport)
- [x] T-304 [P] Create `backend/app/agent/__init__.py` (empty) — establishes the agent package namespace used in T-309 and T-310

**Checkpoint**: Run `uv run uvicorn app.main:app` — startup log should show no
import errors and both new tables must be created. Verify with
`SELECT * FROM conversation LIMIT 1;` — no error means table exists.

---

## Phase 2: MCP Tool Implementation

**Purpose**: Implement the five MCP tools that the agent will call to read and
write task data. All tools accept `user_id` as first argument and scope every
DB query to that user. All tools return a JSON-serialisable `dict`.

**⚠️ Security invariant**: `user_id` MUST be injected server-side from the
verified session token — it is never accepted from the chat message body.

### Install Dependencies

- [x] T-305 Install new backend packages: run `uv add openai-agents mcp` in `backend/` then `uv sync` — confirms packages resolve before any code references them

### Read Tools

- [x] T-306 [US1] Implement `list_tasks` tool in `backend/app/mcp_server/server.py` — decorated with `@mcp.tool()`, signature `async def list_tasks(user_id: str, status: str | None = None) -> dict`; open own DB session, `SELECT * FROM task WHERE user_id = :user_id` (and optional status filter); return `{"status": "ok", "tasks": [...], "count": N}` or `{"status": "ok", "tasks": [], "count": 0}`

### Write Tools

- [x] T-307 [US1] Implement `add_task` tool in `backend/app/mcp_server/server.py` — signature `async def add_task(user_id: str, title: str, description: str, status: str = "pending") -> dict`; insert new `Task` row scoped to `user_id`; return `{"status": "created", "task_id": "uuid", "title": "...", "description": "..."}` or error dict
- [x] T-308 [US1] Implement `update_task` tool in `backend/app/mcp_server/server.py` — signature `async def update_task(user_id: str, task_id: str, title: str, description: str | None = None) -> dict`; fetch task by `id AND user_id`, update fields, return `{"status": "updated", "task_id": "uuid", "title": "..."}` or `{"status": "error", "message": "Task not found"}`
- [x] T-309 [US1] Implement `delete_task` tool in `backend/app/mcp_server/server.py` — signature `async def delete_task(user_id: str, task_id: str) -> dict`; delete only where `id = task_id AND user_id = user_id`; return `{"status": "deleted", "task_id": "uuid"}` or error dict; do NOT reveal whether a task exists for a different user
- [x] T-310 [US1] Implement `complete_task` tool in `backend/app/mcp_server/server.py` — signature `async def complete_task(user_id: str, task_id: str) -> dict`; set `status = "completed"` where `id = task_id AND user_id = user_id`; return `{"status": "completed", "task_id": "uuid", "title": "..."}` or error dict

**Checkpoint**: Run `python -m app.mcp_server.server` from `backend/` — the
process must start without errors and wait on stdin (press Ctrl-C to exit).
This confirms the MCP scaffold and all 5 tools parse correctly.

---

## Phase 3: Agent Logic

**Purpose**: Build the agent runner, define the system prompt, and expose the
stateless `POST /api/chat` and `GET /api/chat/history` endpoints.

### Agent Service

- [x] T-311 Add `OPENAI_API_KEY: str` and `OPENAI_MODEL: str = "gpt-4o"` fields to `backend/app/config.py` `Settings` class — loaded from `backend/.env` via `pydantic-settings`; fail fast on startup if `OPENAI_API_KEY` is missing
- [x] T-312 [US1] Create `backend/app/agent/prompts.py` — define `SYSTEM_PROMPT` string constant that instructs the agent to: manage tasks via tools only, use conversation history to resolve pronouns/ordinals, ask for clarification when references are ambiguous, confirm every action in 1–3 sentences, and decline off-topic requests
- [x] T-313 [US1] Create `backend/app/agent/runner.py` — implement three functions:
  1. `get_mcp_server() -> MCPServerStdio` — singleton subprocess using `MCPServerStdio(params={"command": "python", "args": ["-m", "app.mcp_server.server"]}, cache_tools_list=True)`; call `await _mcp_server.__aenter__()` on first use
  2. `run_agent(user_id: str, history: list[dict], new_message: str) -> str` — create fresh `Agent(name="TaskFlowAssistant", model=settings.OPENAI_MODEL, instructions=SYSTEM_PROMPT, mcp_servers=[server])`; build `input_messages = history + [{"role": "user", "content": new_message}]`; `result = await Runner.run(agent, input=input_messages)`; return `result.final_output`
  3. `shutdown_mcp_server() -> None` — call `await _mcp_server.__aexit__(None, None, None)` for FastAPI lifespan cleanup

### Chat API Endpoint

- [x] T-314 [US2] Create `backend/app/routers/chat.py` — define Pydantic schemas: `ChatRequest(message: str = Field(min_length=1, max_length=2000))`, `ChatResponse(response: str, conversation_id: str)`, `MessageRead(id: str, role: str, content: str, created_at: datetime)`, `HistoryResponse(conversation_id: str, messages: list[MessageRead])`; implement helpers: `get_or_create_conversation(db, user_id)`, `load_messages(db, conversation_id)` (ordered by created_at, cap at 100 rows), `save_message(db, conversation_id, role, content)`
- [x] T-315 [US1] Implement `POST /api/chat` endpoint in `backend/app/routers/chat.py` — require `user_id: str = Depends(get_current_user_id)` and `db: AsyncSession = Depends(get_session)`; flow: (1) get/create conversation, (2) load history as `[{"role": m.role, "content": m.content}]`, (3) call `run_agent(user_id, history, body.message)`, (4) save user message, (5) save assistant response, (6) return `ChatResponse`; wrap agent call in try/except and return HTTP 500 `{"detail": "Agent error"}` on failure
- [x] T-316 [US2] Implement `GET /api/chat/history` endpoint in `backend/app/routers/chat.py` — require auth; load conversation, return only `user` and `assistant` role messages ordered by `created_at` ascending; return empty list if no conversation exists yet
- [x] T-317 Update `backend/app/main.py` — register `chat_router` with `app.include_router(chat_router)`; add FastAPI lifespan context manager that calls `await shutdown_mcp_server()` on application shutdown

**Checkpoint**: `curl -X POST http://localhost:8000/api/chat -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"message": "hello"}'` must return HTTP 200 with `{"response": "...", "conversation_id": "..."}`. Unauthenticated request must return 401.

---

## Phase 4: Interface

**Purpose**: Build the chat UI panel and integrate it into the existing dashboard
so both the form UI and chat interface coexist on the same page, sharing the
same live task state.

### Chat UI Components

- [x] T-318 [US3] Create `frontend/components/chat/ChatMessage.tsx` — single message bubble component; props: `role: "user" | "assistant"`, `content: string`, `createdAt?: string`; user messages: right-aligned, indigo background; assistant messages: left-aligned, slate/gray background with a bot icon from lucide-react
- [x] T-319 [US3] Create `frontend/components/chat/ChatInput.tsx` — textarea with send button; props: `onSend: (message: string) => void`, `disabled: boolean`; Enter key sends (Shift+Enter inserts newline); send button disabled and shows spinner when `disabled=true`; clears textarea after send
- [x] T-320 [US3] Create `frontend/components/chat/ChatPanel.tsx` — full chat panel; props: `onTaskMutated: () => void`; on mount: call `GET /api/chat/history` and populate message list; on submit: call `POST /api/chat`, show typing indicator while awaiting, append `ChatMessage` bubbles for both user and assistant turns, call `onTaskMutated()` after every successful response; keep input disabled while request is in-flight; scroll to bottom after each new message

### Chat Page Integration

- [x] T-321 [US3] Add chat API functions to `frontend/lib/api.ts`: `fetchChatHistory(): Promise<HistoryResponse>` calling `GET /api/chat/history` with auth header; `sendChatMessage(message: string): Promise<ChatResponse>` calling `POST /api/chat` with JSON body and auth header
- [x] T-322 [US3] Modify `frontend/app/dashboard/page.tsx` — wrap existing task grid and new ChatPanel in a responsive flex container: `<div className="flex gap-6 flex-col xl:flex-row">` with the task grid in `<div className="flex-1 min-w-0">` and `<div className="w-full xl:w-96 shrink-0"><ChatPanel onTaskMutated={fetchTasks} /></div>`

**Checkpoint (Acceptance)**:
1. Open http://localhost:3000, log in, chat panel visible on the right.
2. Type "add a task called hello world" → task appears in task grid without page reload.
3. Type "show me all my tasks" → agent lists them.
4. Type "delete it" → last added task is deleted and grid updates.
5. `POST /api/chat` without auth token returns 401.
6. Existing "Add Task" form still works with no regression.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (DB Infrastructure)**: No dependencies — start immediately
- **Phase 2 (MCP Tools)**: Depends on T-302 (models imported); T-305 must run before T-306–T-310
- **Phase 3 (Agent Logic)**: Depends on Phase 2 complete (MCP server must have all 5 tools); T-311 before T-313 (config needed in runner); T-312 before T-313; T-314 before T-315 and T-316; T-315 and T-316 before T-317
- **Phase 4 (Interface)**: Depends on Phase 3 complete (chat endpoints must exist); T-318 and T-319 before T-320; T-321 before T-320; T-321 and T-320 before T-322

### Within-Phase Parallel Opportunities

**Phase 1**: T-300 ∥ T-301 (different files), then T-302 (depends on both), T-303 ∥ T-304

**Phase 2**: T-306 through T-310 are all in the same file → implement sequentially

**Phase 3**: T-311 ∥ T-312 (config + install, different concerns); then T-313 depends on both;
T-314 can start in parallel with T-313; T-315 ∥ T-316 (same file, implement one then the other)

**Phase 4**: T-318 ∥ T-319 ∥ T-321 (different files); then T-320 (needs both components + api);
T-322 last (needs ChatPanel complete)

---

## Implementation Strategy

### MVP Scope (Recommended: Phase 1 + 2 + 3)

1. Complete Phase 1 — tables created, packages installed
2. Complete Phase 2 — all 5 MCP tools working; validate via manual subprocess test
3. Complete Phase 3 — agent runner + chat endpoints; validate via curl
4. **STOP and validate** `POST /api/chat` with curl before touching the frontend
5. Complete Phase 4 — add chat UI; validate acceptance checklist in quickstart.md

### Incremental Delivery

| After | Testable Outcome |
|-------|-----------------|
| Phase 1 + 2 | MCP server subprocess runs; all 5 tools execute DB queries correctly |
| + Phase 3 | `curl POST /api/chat` returns agent response; history endpoint works |
| + Phase 4 | Full browser-based chat alongside task grid |

---

## Notes

- All `user_id` values come exclusively from server-side verified session — never from message body (FR-016)
- MCP subprocess is a singleton: started on first request, shut down on app exit (T-313, T-317)
- Fresh `Agent` instance is created per request, discarded after response — stateless (FR-013/FR-014)
- History is capped at 100 messages to avoid context window overflow (T-314)
- Tool messages (role="tool") are stored in DB but filtered from the `GET /api/chat/history` response shown to the frontend
- See `specs/003-ai-agent-interface/quickstart.md` for the full acceptance checklist
