---
id: 006
title: Constitution Monorepo Rewrite
stage: constitution
date: 2026-02-09
surface: agent
model: claude-opus-4-6
feature: none
branch: 001-todo-cli-app
user: Jannat Osmani
command: /sp.constitution
labels: ["constitution", "monorepo", "fullstack", "rewrite"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

Rewire the constitution file we must follow monorepo architecture including next.js and fastapi. It should strictly cover 4 pillars
1. Monorepo arcitecture:
hackathon-todo/
├── .spec-kit/                    # Spec-Kit configuration
│   └── config.yaml
├── specs/                        # Spec-Kit managed specifications
│   ├── overview.md               # Project overview
│   ├── architecture.md           # System architecture
│   ├── features/                 # Feature specifications
│   │   ├── task-crud.md
│   │   ├── authentication.md
│   │   └── chatbot.md
│   ├── api/                      # API specifications
│   │   ├── rest-endpoints.md
│   │   └── mcp-tools.md
│   ├── database/                 # Database specifications
│   │   └── schema.md
│   └── ui/                       # UI specifications
│       ├── components.md
│       └── pages.md
├── CLAUDE.md                     # Root Claude Code instructions
├── frontend/
│   ├── CLAUDE.md
│   └── ... (Next.js app)
├── backend/
│   ├── CLAUDE.md
│   └── ... (FastAPI app)
├── docker-compose.yml
└── README.md

2. Technology Stack
Layer Technology
Frontend Next.js 16+ (App Router)
Backend Python FastAPI
ORM SQLModel
Database Neon Serverless PostgreSQL(no more in memory storage)
Authentication Better Auth

3. Security and data integration
Backend must never trust frontend every request must have a bearer token
Backend must verify the JWT Token using shared secrets
User can only access and modify all data all the queries must filter by the user id
All the sensitive data must store in .env
4. Develpment process
Update database schema, rest endpoints, features, frontend.md and backend.md

## Response snapshot

Rewrote constitution from v1.0.0 to v2.0.0 (MAJOR). Replaced 6 Phase-1 principles (CLI, in-memory, single-project) with 4 pillars: (I) Monorepo Architecture — frontend/backend/specs separation with docker-compose, (II) Technology Stack — Next.js 16+, FastAPI, SQLModel, Neon PostgreSQL, Better Auth, (III) Security & Data Isolation — JWT bearer tokens, user-scoped queries, .env for secrets, (IV) Development Process — spec-first workflow requiring 6 artifacts before implementation. All templates validated — no updates needed (already generic enough to support web app layout).

## Outcome

- Impact: Complete constitution rewrite — project pivots from CLI to full-stack web app
- Tests: none
- Files: .specify/memory/constitution.md (rewritten)
- Next prompts: /sp.specify to create new feature specs under the new architecture
- Reflection: Clean break from Phase 1; all 6 old principles either replaced or absorbed into 4 new pillars

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Validation — no unexplained brackets, dates ISO, principles declarative — PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
