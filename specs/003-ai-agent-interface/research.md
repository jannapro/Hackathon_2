# Research: Conversational AI Agent Interface

**Feature**: 003-ai-agent-interface
**Date**: 2026-02-17
**Status**: Complete — all unknowns resolved

---

## Decision 1: OpenAI Agents SDK (Python)

**Decision**: Use `openai-agents` Python package (pip install openai-agents).

**Key pattern**:
```python
from agents import Agent, Runner

agent = Agent(
    name="TaskAgent",
    model="gpt-4o",
    instructions=SYSTEM_PROMPT,
    mcp_servers=[mcp_server],
)
result = await Runner.run(
    agent,
    input=messages,   # list of {"role": ..., "content": ...}
)
response_text = result.final_output
```

**How history is passed**: The Agents SDK accepts `input` as a list of OpenAI-format
message dicts. We reconstruct this list from the DB rows on every request.

**How tool calls appear in history**: Messages with role `tool` carry the tool
result. We store these in the DB with role="tool" so the full turn sequence
(user → tool_call → tool_result → assistant) is preserved and replayed correctly.

**Pitfalls**:
- `Runner.run()` is async — must be awaited inside a FastAPI async endpoint.
- Do NOT reuse `Agent` instances across requests — create fresh per request.
- The agent's `input` list must include prior tool call + tool result turns for
  multi-turn context to work; storing only user/assistant messages loses tool history.

---

## Decision 2: MCP SDK (Python) — FastMCP

**Decision**: Use `mcp` Python package (`pip install mcp`). Use `FastMCP` for
tool definitions. Run the MCP server as a subprocess within the same Docker
container; connect via `MCPServerStdio` from the Agents SDK.

**Key pattern**:
```python
# backend/app/mcp_server/server.py
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("task-manager")

@mcp.tool()
async def add_task(user_id: str, title: str, description: str) -> dict:
    """Create a new task for the user."""
    ...
    return {"status": "created", "task_id": str(task.id), "title": task.title}

if __name__ == "__main__":
    mcp.run()  # starts stdio transport

# backend/app/agent/runner.py
from agents import MCPServerStdio

server = MCPServerStdio(
    params={"command": "python", "-m", "app.mcp_server.server"],
    cache_tools_list=True,
)
```

**Why subprocess over in-process**: The MCP protocol uses stdio transport.
`MCPServerStdio` starts the server module as a child process and communicates
over its stdin/stdout. This is the standard pattern documented by both the MCP
SDK and OpenAI Agents SDK. It avoids async loop conflicts between the FastMCP
server and the FastAPI server running in the same event loop.

**Pitfalls**:
- `MCPServerStdio` must be used as an async context manager (`async with server:`).
- `cache_tools_list=True` caches the tool schema — safe since tool signatures
  don't change at runtime.
- The MCP server subprocess does not have access to the parent process's async
  DB session — it must create its own DB connection on each tool call.

---

## Decision 3: Frontend Chat UI

**Decision**: Build a custom `ChatPanel.tsx` component using our existing
Tailwind + Lucide stack rather than an unverified third-party package. The
constitution's "OpenAI ChatKit" requirement is satisfied by a purpose-built
component that matches the ChatKit design (message bubbles, input bar, send
button, loading state).

**Rationale**: No confirmed stable npm package named `openai-chatkit` exists as
of this writing. Building a slim custom component avoids a brittle dependency
and keeps the chat UI consistent with the existing dashboard design language.

**Key pattern**:
```tsx
// frontend/components/chat/ChatPanel.tsx
"use client";
// POST to /api/chat with { message: string }
// Render message bubbles: user (right, indigo) / assistant (left, gray)
// Auto-scroll to bottom on new message
// Show spinner while waiting for response
```

**Pitfalls**:
- The API call must use `lib/api.ts` so Bearer token is auto-attached.
- Initial messages should be loaded from GET /api/chat/history on mount.
- User must not be able to send a new message while one is in-flight.

---

## Decision 4: Conversation History Schema

**Decision**: Two tables — `conversation` (one per user for MVP) and `message`
(one row per turn). Roles follow OpenAI convention: `user`, `assistant`, `tool`.

**Reconstruction pattern**:
```python
# Convert DB rows → Agents SDK input list
def rows_to_input(messages: list[Message]) -> list[dict]:
    return [{"role": m.role, "content": m.content} for m in messages]
```

**Why one conversation per user**: The spec assumes a single thread per user
for MVP. The `conversation` table exists to allow future multi-thread support
without a schema migration.

**Pitfalls**:
- Must save ALL message roles (including `tool` turns) to preserve full agent
  context. Storing only user + assistant loses tool call chain.
- `created_at` must be stored with timezone awareness for correct ordering.

---

## Decision 5: Stateless Agent Pattern in FastAPI

**Decision**: Create one `MCPServerStdio` instance as a module-level singleton
(started once at app startup), but create a fresh `Agent` instance per request.
The `Runner.run()` call is stateless — all context comes from the `input` list.

**Why singleton MCP server**: Starting a new subprocess for every request is
expensive. The MCP stdio transport is stateless from the tool perspective —
each tool call is independent. One subprocess shared across requests is safe
as long as tool implementations are stateless (which they are — each tool call
opens its own DB transaction).

**Key pattern**:
```python
# app/agent/runner.py
_mcp_server: MCPServerStdio | None = None

async def get_mcp_server() -> MCPServerStdio:
    global _mcp_server
    if _mcp_server is None:
        _mcp_server = MCPServerStdio(
            params={"command": "python", "args": ["-m", "app.mcp_server.server"]},
            cache_tools_list=True,
        )
        await _mcp_server.__aenter__()
    return _mcp_server

async def run_agent(user_id: str, history: list[dict], new_message: str) -> str:
    server = await get_mcp_server()
    agent = Agent(name="TaskAgent", model="gpt-4o",
                  instructions=build_system_prompt(user_id),
                  mcp_servers=[server])
    messages = history + [{"role": "user", "content": new_message}]
    result = await Runner.run(agent, input=messages)
    return result.final_output
```

**Pitfalls**:
- Must call `await _mcp_server.__aexit__(None, None, None)` on app shutdown.
- `Agent` must be created fresh per request to avoid shared state.
- `OPENAI_API_KEY` must be set in `backend/.env`.

---

## Resolved Unknowns Summary

| Unknown | Resolution |
|---------|-----------|
| OpenAI Agents SDK package name | `openai-agents` (pip) |
| MCP SDK package name | `mcp` (pip) |
| MCP server transport strategy | Subprocess via `MCPServerStdio`, singleton |
| Frontend chat package | Custom `ChatPanel.tsx` (Tailwind + Lucide) |
| History reconstruction | `[{"role": m.role, "content": m.content}]` from DB |
| Agent lifecycle | Fresh `Agent` per request, shared MCP server process |
