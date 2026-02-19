<!--
  === Sync Impact Report ===
  Version change: 2.0.0 → 3.0.0 (MAJOR — new AI agent layer principle + tech stack expansion)

  Modified principles:
    - II. Technology Stack → II. Technology Stack (expanded: ChatKit, Agents SDK, MCP SDK added)
    - III. Security and Data Isolation → III. Security and Data Isolation
      (expanded: JWT user_id propagation to every MCP tool call added)
    - I. Monorepo Architecture → I. Monorepo Architecture
      (updated directory tree: agent/, mcp-server/ added)

  Added sections:
    - Principle V: AI Agent and MCP Layer (new — stateless request lifecycle,
      MCP tool contract rules, typed args, JSON returns, agent-via-tools-only rule)

  Removed sections:
    None

  Templates requiring updates:
    - .specify/templates/plan-template.md  ✅ Generic — no structural change needed
    - .specify/templates/spec-template.md  ✅ Generic — no structural change needed
    - .specify/templates/tasks-template.md ✅ Path conventions already cover backend/frontend;
        new ai-feature tasks should use backend/agent/ and backend/mcp_server/ paths

  Follow-up TODOs:
    - TODO(OPENAI_API_KEY): Add OPENAI_API_KEY to .env docs and .env.example files
    - TODO(CHATKIT_VERSION): Confirm exact OpenAI ChatKit npm package name/version
  ===========================
-->

# Hackathon Todo App Constitution

## Core Principles

### I. Monorepo Architecture

The project MUST follow a monorepo structure with clear separation between
frontend, backend (including AI agent and MCP server), and specification
artifacts. Each layer MUST be independently deployable and MUST NOT import
directly from another layer.

```text
hackathon-todo/
├── .specify/                     # SDD templates and scripts
├── specs/                        # Feature specifications
│   ├── 001-todo-cli-app/
│   ├── 002-todo-web-app/
│   └── 003-ai-agent-interface/   # AI feature specs
├── CLAUDE.md                     # Root agent instructions
├── frontend/                     # Next.js app (web UI + chat UI)
│   ├── CLAUDE.md
│   ├── app/
│   ├── components/
│   │   ├── dashboard/            # Web UI components
│   │   └── chat/                 # Chat UI components (ChatKit)
│   └── lib/
├── backend/                      # FastAPI + agent + MCP server
│   ├── CLAUDE.md
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/              # REST API endpoints
│   │   ├── models/               # SQLModel ORM models
│   │   ├── middleware/           # Auth, CORS
│   │   ├── agent/                # OpenAI Agents SDK runner
│   │   └── mcp_server/           # Official MCP SDK tools
│   └── pyproject.toml
├── docker-compose.yml
└── README.md
```

**Rules**:
- Frontend and backend MUST communicate only via documented REST API contracts.
- Each layer MUST have its own `CLAUDE.md` with layer-specific instructions.
- The AI agent and MCP server MUST reside inside the backend layer — they are
  NOT separate services.
- Shared contracts (API schemas, MCP tool signatures) MUST be documented in
  `specs/<feature>/contracts/` and kept in sync.
- `docker-compose.yml` MUST orchestrate all services for local development.

**Rationale**: Monorepo enables atomic commits across the full stack while
maintaining clear boundaries between frontend, backend, and specifications.
Colocating the agent and MCP server in the backend simplifies auth context
propagation and avoids cross-service network hops.

### II. Technology Stack

The following technologies are mandatory for this project:

| Layer | Technology | Detail |
|-------|-----------|--------|
| Frontend (Web UI) | Next.js App Router | 16+ |
| Frontend (Chat UI) | OpenAI ChatKit | Official npm package |
| Backend | Python FastAPI | Latest stable |
| AI Framework | OpenAI Agents SDK | Python SDK |
| MCP Server | Official MCP SDK | Python SDK |
| ORM | SQLModel | Latest stable |
| Database | Neon Serverless PostgreSQL | Managed cloud |
| Authentication | Better Auth | Latest stable |

**Rules**:
- Frontend MUST use Next.js 16+ (App Router) for all web UI pages.
- The AI chat interface MUST use the OpenAI ChatKit component — custom chat UI
  from scratch is NOT permitted.
- Backend MUST use Python FastAPI for all HTTP endpoints including the
  `/api/chat` endpoint.
- The agent runner MUST use the OpenAI Agents SDK — direct OpenAI API calls
  from the chat endpoint are NOT permitted.
- All MCP tools MUST be registered using the Official MCP SDK — ad-hoc Python
  functions called directly by the agent are NOT permitted.
- All database models MUST use SQLModel as the ORM.
- All data MUST be persisted in Neon Serverless PostgreSQL. In-memory storage
  is NOT permitted for production data.
- Authentication MUST be handled by Better Auth.
- Backend Python code MUST use type hints on all function parameters and
  return values.
- All code MUST follow language-appropriate formatting standards (PEP 8 for
  Python, Prettier/ESLint for TypeScript).

**Rationale**: A fixed stack prevents architectural drift and ensures every
team member works from the same baseline. Mandating the official SDKs (Agents
SDK, MCP SDK, ChatKit) reduces integration risk and keeps the codebase aligned
with upstream tooling improvements.

### III. Security and Data Isolation

All communication between layers MUST be authenticated and scoped to the
authenticated user. The agent MUST NEVER operate outside the identity of the
logged-in user.

**Rules**:
- Backend MUST NEVER trust the frontend. Every API request MUST include a
  Bearer token in the `Authorization` header.
- Backend MUST verify the Bearer / session token before processing any request,
  including `/api/chat`.
- The authenticated `user_id` derived from the verified JWT/session token MUST
  be extracted at the HTTP layer and passed explicitly as a parameter into every
  MCP tool execution. The agent MUST NOT receive raw credentials.
- MCP tools MUST use the supplied `user_id` to scope ALL database queries.
  A tool MUST NOT query or modify rows belonging to a different user.
- No endpoint MUST return data belonging to another user under any circumstance.
- The agent acts strictly on behalf of the authenticated user. It MUST NOT
  accept a `user_id` from the chat message body — only from the server-side
  token verification result.
- All sensitive configuration (database URLs, JWT secrets, OpenAI API keys)
  MUST be stored in `.env` files, listed in `.gitignore`, and MUST NEVER be
  committed to version control.
- All user input (chat messages and form fields) MUST be validated on the
  backend before processing.

**Rationale**: Zero-trust between layers prevents data leaks and privilege
escalation. Injecting `user_id` server-side into every MCP tool call ensures
the agent can never be tricked (via prompt injection or malicious input) into
accessing another user's data.

### IV. Development Process

All development MUST follow a spec-driven workflow. Artifacts in `specs/`
are the authoritative source of truth before any code is written.

**Rules**:
- Before implementing any feature, the following MUST exist or be updated:
  1. Feature spec — `specs/<feature>/spec.md`
  2. Implementation plan — `specs/<feature>/plan.md`
  3. Task list — `specs/<feature>/tasks.md`
  4. API contracts — `specs/<feature>/contracts/`
  5. For AI features: MCP tool signatures — `specs/<feature>/contracts/mcp-tools.md`
- All changes MUST be small, testable, and reference exact file paths.
- Code MUST be formatted before committing.
- Prefer the smallest viable diff — do not refactor unrelated code.
- Backend functions MUST use type hints and docstrings.
- Frontend components MUST use TypeScript with strict mode.
- Each task MUST be independently verifiable before moving to the next.

**Rationale**: Spec-first development ensures all layers stay aligned and
prevents implementation drift between frontend, backend, agent, and MCP tools.

### V. AI Agent and MCP Layer

The AI layer MUST follow a stateless, tool-mediated architecture. The agent
MUST NOT hold persistent in-memory state between requests.

#### Request Lifecycle

Every single chat request MUST follow this exact lifecycle — no exceptions:

1. **Fetch** — Load the full conversation history for the authenticated user
   from the database.
2. **Hydrate** — Populate the agent's context with the conversation history
   and the current `user_id`.
3. **Process** — Run the agent against the new user message. The agent decides
   which MCP tools to call and invokes them.
4. **Persist** — Save the new user message and the agent's response to the
   database conversation history.
5. **Discard** — Release all in-memory agent state. The agent instance MUST
   NOT be retained across requests.

#### Stateless Server Principle

- The backend MUST remain completely stateless between requests.
- No conversation context, agent instance, or partial result MUST be held in
  server memory after a response is sent.
- Horizontal scaling MUST be possible without session affinity.

#### MCP Tool Contract Rules

- ALL task operations (create, list, update, complete, delete) and any other
  data operations MUST be exposed as MCP tools registered via the Official
  MCP SDK.
- The agent MUST NOT query or write to the database directly. Every data
  operation MUST go through an MCP tool.
- Every MCP tool MUST:
  - Accept strictly typed arguments (Python type hints required on all params).
  - Accept `user_id: str` as a mandatory parameter for all operations that
    touch user-owned data.
  - Return a JSON-serializable `dict` as its result.
  - Validate all input arguments before executing any database operation.
  - Return a structured error dict (not raise unhandled exceptions) on failure.
- Tool naming MUST follow the convention: `<resource>_<verb>`
  (e.g., `task_create`, `task_list`, `task_delete`).

#### Agent Behavior Rules

- The agent MUST be initialized fresh per request using conversation history
  fetched from the database.
- The agent MUST receive `user_id` as part of its context — not via the chat
  message content.
- The agent MUST produce a natural-language response that is saved to the
  database and returned to the frontend.
- The agent MUST NOT make direct external HTTP calls outside of MCP tools.

**Rationale**: Statelessness guarantees horizontal scalability and eliminates
race conditions. Routing all data access through MCP tools creates a single,
auditable, access-controlled boundary. Typed tool arguments catch schema
errors early and make the tool surface inspectable and testable.

## Governance

This constitution is the authoritative source for project standards.
All code contributions MUST comply with the five principles above.

**Amendment procedure**:
1. Propose the change with explicit rationale.
2. Determine the version bump type (MAJOR / MINOR / PATCH).
3. Update the constitution with the new version and `LAST_AMENDED_DATE`.
4. Update any dependent templates or spec artifacts if affected.
5. Record the amendment in the Sync Impact Report comment block.

**Versioning policy**: Semantic versioning (MAJOR.MINOR.PATCH).
- MAJOR: Principle removal, incompatible redefinition, or new mandatory
  architectural layer.
- MINOR: New principle/section added or materially expanded guidance.
- PATCH: Clarifications, wording, or typo fixes.

**Compliance review**: All PRs and code reviews MUST verify adherence to the
five principles. AI agent features MUST additionally verify the stateless
lifecycle and MCP tool contract rules before merge.

**Version**: 3.0.0 | **Ratified**: 2026-02-09 | **Last Amended**: 2026-02-17
