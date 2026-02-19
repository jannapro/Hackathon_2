---
id: "0002"
title: AI Agent Interface Plan
stage: plan
date: 2026-02-17
surface: agent
model: claude-sonnet-4-6
feature: 003-ai-agent-interface
branch: 003-ai-agent-interface
user: Jannat Osmani
command: /sp.plan
labels: ["plan","ai-agent","mcp","openai-agents-sdk","fastapi","chat","stateless"]
links:
  spec: specs/003-ai-agent-interface/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-ai-agent-interface/plan.md
  - specs/003-ai-agent-interface/research.md
  - specs/003-ai-agent-interface/data-model.md
  - specs/003-ai-agent-interface/quickstart.md
  - specs/003-ai-agent-interface/contracts/rest-api.md
  - specs/003-ai-agent-interface/contracts/mcp-tools.md
tests:
  - n/a
---

## Prompt

Read the constitution and specs carefully and create a technical plan for integrated ai agent.

1. System Architecture:
- frontend openai chatkit components will in dashboard
- backend POST api/chat (stateless)
- receive message history, user_id from JWT token
- Action start openai agent with registered MCP tool and run in the loop
- Return agent return response and updated chat history
- MCP server running in local exposed with 5 tools
- conversation : id, user_id, created_at
- message : id, conversation_id, role(user/assistant,tool) content, created_at
- task table will be remain unchanged

MCP TOOL DEFINITION
- add_task(user_id, title, description, status)
- list_tasks(user_id, status)
- update_task(user_id, task_id, title)
- Delete_task(user_id, task_id)
- Complete_task(user_id, task_id)

Agent Logic
- define a system prompt according to spec and constitution

Flow:
- user_message->fetch_history->init agent->add new user message->run->save response

Implement:
step1: database upgrade (add conversation and message model)
step2: MCP SERVER (implement tool in backend)
step3: Agent Runner
step4: chat endpoint
step5: frontend UI (integrated Chatkit)

## Response snapshot

Full technical plan written covering 5 implementation steps. All constitution gates pass.
Architecture: browser ChatPanel → POST /api/chat → verify token → load history →
MCPServerStdio subprocess (FastMCP, 5 tools) → OpenAI Agents SDK Runner → save response → return.

Key decisions from research:
- openai-agents (pip) + mcp (pip) packages
- MCPServerStdio singleton subprocess (avoids async loop conflict with FastAPI)
- Fresh Agent instance per request (stateless)
- Custom ChatPanel.tsx (no confirmed openai-chatkit npm package)
- Tool role messages stored in DB for full context replay

Artifacts generated: plan.md, research.md, data-model.md, quickstart.md,
contracts/rest-api.md, contracts/mcp-tools.md. All constitution checks pass.

## Outcome

- ✅ Impact: Complete implementation plan for conversational AI agent layer, ready for /sp.tasks
- 🧪 Tests: Validation gates documented in each step; quickstart acceptance checklist in quickstart.md
- 📁 Files: 6 artifacts in specs/003-ai-agent-interface/
- 🔁 Next prompts: /sp.tasks, then /sp.implement
- 🧠 Reflection: Singleton MCP subprocess is the right call — per-request subprocess would be too
  expensive. Custom ChatPanel avoids dependency on unverified openai-chatkit package name.
  ADR suggestion: MCP subprocess vs in-process tool invocation is architecturally significant.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): all constitution gates pass ✅, no NEEDS CLARIFICATION ✅
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): validate openai-chatkit npm package name before /sp.implement
