---
id: 007
title: Hybrid AI Agent Architecture Constitution
stage: constitution
date: 2026-02-17
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 002-todo-web-app
user: Jannat Osmani
command: /sp.constitution
labels: ["constitution","ai-agent","mcp","stateless","openai-agents-sdk","hybrid-architecture"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - n/a
---

## Prompt

Rewrite the constitution file and write this file will be strictly be following hybrid architecture web end and ai agent

ARCHETECTURE AI LAYER

Structure now we are building ai interface along side with existing web ui
Flow

1. Frontend where user will be sending the messages to the backend
2. Backend where users request will be received and backed  will fetch from chat history from database and will run agent
3. Agent will decide which mcp tool shoudl be called
4. Mcp server called by the agent will run , execute the tool and return the data
5. The agent eilll write natural language responcse

TECNICAL STACKS

Component
Technology
Frontend
OpenAI ChatKit
Backend
Python FastAPI
AI Framework
OpenAI Agents SDK
MCP Server
Official MCP SDK
ORM
SQLModel
Database
Neon Serverless PostgreSQL
Authentication
Better Auth

State less Principle
Server must remain state less

Life Cycle for every single chat request follow these points below
1. Fetch full conversation history form database
2.Update agent context
3. Process new message
4. Save the new response in to the database
5. Discard the memory ready for next message

MCP TOOLS
1. All taks operations like add delete list ….. must be expose as a mcp tool
2. Tool must take strictly take Typed arguments and return json dictionatris
3.Agent does not request the database directly it must use mcp tools

SECURITY
1.the agent act on behalf of logged in user
2. The user id form JWT token must be passed securely to every mcp tool execution to ensure agent can't access other users data

## Response snapshot

Constitution rewritten to v3.0.0 (MAJOR bump from 2.0.0). Added Principle V: AI Agent and MCP Layer
covering the stateless request lifecycle (Fetch → Hydrate → Process → Persist → Discard), MCP tool
contract rules (typed args, user_id scoping, JSON dict returns, tool naming convention), and agent
behavior rules. Updated Principle II tech stack table with ChatKit, Agents SDK, and MCP SDK.
Expanded Principle III security rules to enforce server-side user_id injection into every MCP tool
call. Updated directory tree in Principle I to include backend/agent/ and backend/mcp_server/.

## Outcome

- ✅ Impact: Constitution v3.0.0 written — hybrid web+AI architecture is now the authoritative standard
- 🧪 Tests: n/a (documentation change)
- 📁 Files: .specify/memory/constitution.md (overwritten)
- 🔁 Next prompts: /sp.specify 003-ai-agent-interface, then /sp.plan, /sp.tasks, /sp.implement
- 🧠 Reflection: MAJOR bump justified — new mandatory architectural layer (Principle V) plus three
  new mandatory stack components (ChatKit, Agents SDK, MCP SDK) represent backward-incompatible
  governance additions that all future PRs must comply with.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): no unresolved bracket tokens ✅, version matches report ✅, dates ISO ✅
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): add mcp-tools.md contract template to .specify/templates/
