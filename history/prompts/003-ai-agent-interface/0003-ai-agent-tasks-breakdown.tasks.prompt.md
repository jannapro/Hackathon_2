---
id: "0003"
title: AI Agent Tasks Breakdown
stage: tasks
date: 2026-02-17
surface: agent
model: claude-sonnet-4-6
feature: 003-ai-agent-interface
branch: 003-ai-agent-interface
user: Jannat Osmani
command: /sp.tasks
labels: ["tasks","ai-agent","mcp","openai-agents-sdk","fastapi","chat","database","frontend"]
links:
  spec: specs/003-ai-agent-interface/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-ai-agent-interface/tasks.md
tests:
  - n/a
---

## Prompt

read the plan and the new rules constitution and break project in actionable tasks.

use task id starting with T-300 to separate them from phase 2

group the task into these logical steps

# database_infrastructure:
### database migration: update backend/models.py to include conversation and message models. create migration  script

### MCP Server setup:
initiaze the mcp server structure in backend

# tool implementation in MCP
### implement read tools all business logics as an MCP tool. it must request to DB and return JSON.

### implement write tools like add, delete, list etc as MCP tools and ensure the all required User_id for security

# Agent logics
### Agent Services create backend/agent.py implement the functions as:
- accept history and new message
- initialize the Openai agent with system prompt
- register the MCP tools
- run the tool loop ( agent decide -> mcp tool run-> result return -> agent answers)

### chat api endpoints
create post /api/chat. it must stateless

# verify JWT

- load conversation history from DB
- call the agent service
- save the new mwssage and response to DB
- return the response

# Interface
### chat UI components
install and configure OpenAI chatkit in frontend

### Chat page integration
add the caht to dashboard and connect it with POst /api/chat endpoint using api client

## Response snapshot

Generated specs/003-ai-agent-interface/tasks.md with 23 tasks (T-300 to T-322) across 4 phases:

**Phase 1 — Database Infrastructure** (T-300–T-304): Conversation model, Message model, database.py import update, MCP server scaffold, agent package init.

**Phase 2 — MCP Tool Implementation** (T-305–T-310): Install openai-agents + mcp packages; implement list_tasks (read), add_task/update_task/delete_task/complete_task (write). All tools accept user_id first param, scope all queries, return structured dict.

**Phase 3 — Agent Logic** (T-311–T-317): OPENAI_API_KEY in config.py; SYSTEM_PROMPT in agent/prompts.py; singleton MCPServerStdio + run_agent() + shutdown in agent/runner.py; Pydantic schemas + helpers in routers/chat.py; POST /api/chat (stateless, verify JWT → load history → run agent → save → return); GET /api/chat/history; register router + lifespan in main.py.

**Phase 4 — Interface** (T-318–T-322): ChatMessage.tsx, ChatInput.tsx, ChatPanel.tsx; api.ts chat helpers; dashboard/page.tsx integration with onTaskMutated → fetchTasks.

Note: Custom ChatPanel.tsx used instead of openai-chatkit (unverified npm package name) — consistent with research.md decision.

## Outcome

- ✅ Impact: 23 actionable tasks covering full AI agent feature implementation, ready for /sp.implement
- 🧪 Tests: Manual acceptance checkpoints at end of each phase; full acceptance checklist in quickstart.md
- 📁 Files: specs/003-ai-agent-interface/tasks.md
- 🔁 Next prompts: /sp.implement
- 🧠 Reflection: User grouping (DB infra → MCP tools → agent logic → interface) matches implementation dependency order exactly. Keeping MCP server as singleton subprocess and ChatPanel as custom component (not openai-chatkit) confirmed by research.md.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): all constitution gates pass ✅
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): verify OPENAI_API_KEY is available before starting /sp.implement
