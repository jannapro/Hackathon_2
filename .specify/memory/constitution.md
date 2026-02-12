<!--
  === Sync Impact Report ===
  Version change: 1.0.0 → 2.0.0 (MAJOR — full rewrite)
  Modified principles:
    - I. Separation of Concerns → I. Monorepo Architecture (redefined)
    - II. CLI-First Interface → REMOVED (replaced by web stack)
    - III. Input Validation → absorbed into III. Security & Data Isolation
    - IV. Type Safety and Documentation → absorbed into IV. Development Process
    - V. Code Quality and Formatting → absorbed into IV. Development Process
    - VI. In-Memory Data Storage → REMOVED (replaced by PostgreSQL)
  Added sections:
    - Principle I: Monorepo Architecture (new — full directory structure)
    - Principle II: Technology Stack (new — Next.js + FastAPI + SQLModel + Neon + Better Auth)
    - Principle III: Security and Data Isolation (new — JWT, bearer tokens, user scoping)
    - Principle IV: Development Process (new — spec-driven workflow)
    - Section: Project Structure (detailed directory tree)
    - Section: Governance (updated)
  Removed sections:
    - Principle II: CLI-First Interface
    - Principle VI: In-Memory Data Storage
    - Section: Technical Stack (merged into Principle II)
    - Section: Development Workflow (merged into Principle IV)
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ No structural changes needed (generic)
    - .specify/templates/spec-template.md ✅ No structural changes needed (generic)
    - .specify/templates/tasks-template.md ✅ Path conventions already support web app layout
  Follow-up TODOs: None
  ===========================
-->

# Hackathon Todo App Constitution

## Core Principles

### I. Monorepo Architecture

The project MUST follow a monorepo structure with clear separation
between frontend, backend, and specification artifacts. Each layer
MUST be independently deployable and MUST NOT import from the
other layer directly.

```text
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
```

**Rules**:
- Frontend and backend MUST communicate only via REST API.
- Each layer MUST have its own `CLAUDE.md` with layer-specific
  instructions.
- Shared contracts (API schemas, types) MUST be documented in
  `specs/api/` and kept in sync.
- `docker-compose.yml` MUST orchestrate all services for local
  development.

**Rationale**: Monorepo enables atomic commits across the stack
while maintaining clear boundaries between frontend, backend,
and specifications.

### II. Technology Stack

The following technologies are mandatory for this project:

| Layer | Technology | Version/Detail |
|-------|-----------|----------------|
| Frontend | Next.js (App Router) | 16+ |
| Backend | Python FastAPI | Latest |
| ORM | SQLModel | Latest |
| Database | Neon Serverless PostgreSQL | Managed cloud |
| Authentication | Better Auth | Latest |

**Rules**:
- Frontend MUST use Next.js 16+ with the App Router pattern.
- Backend MUST use Python FastAPI for all API endpoints.
- All database models MUST use SQLModel as the ORM.
- All data MUST be persisted in Neon Serverless PostgreSQL.
  In-memory storage is NOT permitted.
- Authentication MUST be handled by Better Auth.
- Backend Python code MUST use type hints on all function
  parameters and return values.
- Backend Python code MUST include docstrings on all functions.
- All code MUST follow language-appropriate formatting standards
  (PEP 8 for Python, Prettier/ESLint for TypeScript).

**Rationale**: This stack provides a modern, production-ready
foundation with serverless database scaling, type-safe ORM,
and a proven authentication library.

### III. Security and Data Isolation

All communication between frontend and backend MUST be
authenticated and scoped to the current user.

**Rules**:
- Backend MUST NEVER trust the frontend. Every API request
  MUST include a Bearer token in the Authorization header.
- Backend MUST verify the JWT token using shared secrets
  before processing any request.
- Users MUST only access and modify their own data. ALL
  database queries MUST filter by the authenticated user's ID.
- No endpoint MUST return data belonging to another user.
- All sensitive configuration (database URLs, JWT secrets,
  API keys) MUST be stored in `.env` files.
- `.env` files MUST be listed in `.gitignore` and MUST NEVER
  be committed to version control.
- All user input MUST be validated before processing — both
  on the frontend (UX) and backend (security).

**Rationale**: Zero-trust between layers prevents data leaks,
privilege escalation, and ensures multi-tenant data isolation.

### IV. Development Process

All development MUST follow a spec-driven workflow with
artifacts kept in sync.

**Rules**:
- Before implementing any feature, the following specs MUST
  be updated or created:
  1. Database schema (`specs/database/schema.md`)
  2. REST endpoints (`specs/api/rest-endpoints.md`)
  3. Feature spec (`specs/features/<feature>.md`)
  4. Frontend pages/components (`specs/ui/`)
  5. Backend CLAUDE.md (`backend/CLAUDE.md`)
  6. Frontend CLAUDE.md (`frontend/CLAUDE.md`)
- All changes MUST be small and testable.
- Code MUST be formatted before committing.
- Prefer the smallest viable diff; do not refactor unrelated
  code.
- Backend functions MUST use type hints and docstrings.
- Frontend components MUST use TypeScript with strict mode.

**Rationale**: Spec-first development ensures all layers stay
aligned and prevents implementation drift between frontend,
backend, and database.

## Governance

This constitution is the authoritative source for project
standards. All code contributions MUST comply with the four
pillars above.

**Amendment procedure**:
1. Propose change with rationale.
2. Document the change with version bump.
3. Update any dependent templates or artifacts if affected.
4. Record amendment in version history below.

**Versioning policy**: Semantic versioning (MAJOR.MINOR.PATCH).
- MAJOR: Principle removal or incompatible redefinition.
- MINOR: New principle or materially expanded guidance.
- PATCH: Clarifications, wording, or typo fixes.

**Compliance review**: All PRs and code reviews MUST verify
adherence to the principles listed in this constitution.

**Version**: 2.0.0 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-09
