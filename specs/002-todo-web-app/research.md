# Research: Todo Web App

**Feature**: 002-todo-web-app
**Date**: 2026-02-09

## Research Tasks

No NEEDS CLARIFICATION items in Technical Context. All technology
choices specified by the constitution and user input.

## Decisions

### 1. Authentication Architecture

- **Decision**: Better Auth on frontend for signup/login/session
  management. Backend verifies JWT tokens only — never manages
  users directly.
- **Rationale**: Better Auth is a complete auth solution that
  handles user registration, login, session management, and JWT
  token generation. The backend only needs to verify the JWT
  token to extract user_id. This keeps auth logic centralized
  in one place.
- **Alternatives considered**:
  - Full backend auth (FastAPI + passlib) — would duplicate what
    Better Auth already provides; rejected per constitution
  - NextAuth/Auth.js — constitution specifies Better Auth

### 2. JWT Token Sharing

- **Decision**: Better Auth generates JWT tokens. Backend
  verifies using a shared secret stored in `.env` files on
  both frontend and backend.
- **Rationale**: Shared secret is the simplest JWT verification
  approach. The backend extracts user_id from the token payload
  without needing to call the frontend or a separate auth
  service.
- **Alternatives considered**:
  - JWKS/public key verification — more complex, unnecessary
    for a single-deployment app
  - Session cookies verified server-to-server — adds coupling
    between frontend and backend

### 3. Database Schema Ownership

- **Decision**: Better Auth manages the user table. The backend
  manages the task table with a user_id foreign key referencing
  the Better Auth user ID.
- **Rationale**: Better Auth creates and manages its own user
  table with signup/login. The Task model only needs a user_id
  column (string/UUID) that references the Better Auth user.
  No need to duplicate user management.
- **Alternatives considered**:
  - Separate user table in backend — redundant since Better
    Auth already manages users

### 4. Task SQLModel Design

- **Decision**: Single `Task` SQLModel with fields: id (UUID),
  title (str, max 200), description (str, max 1000), status
  (str: pending/completed), user_id (str), created_at
  (datetime), updated_at (datetime).
- **Rationale**: Maps directly to spec Key Entities. UUID for
  IDs prevents enumeration attacks. Timestamps enable sorting
  and auditing. Status as string for clarity.
- **Alternatives considered**:
  - Integer auto-increment IDs — sequential IDs allow
    enumeration; UUID preferred for security
  - Enum for status — string is simpler and sufficient for
    two values

### 5. API Client Pattern

- **Decision**: Custom fetch wrapper in `frontend/lib/api.ts`
  that automatically attaches the Bearer token from Better Auth
  session to every request.
- **Rationale**: Centralizes auth header injection. Every API
  call goes through this client so no endpoint can accidentally
  skip authentication.
- **Alternatives considered**:
  - axios — adds a dependency; native fetch is sufficient
  - tRPC — over-engineering for 4 REST endpoints

### 6. Filtering and Search

- **Decision**: Filtering and search handled server-side via
  query parameters on GET /api/tasks. `?status=pending`,
  `?search=keyword`, or both combined.
- **Rationale**: Server-side filtering is more secure (user
  can't see unfiltered data in network tab) and works correctly
  with user_id scoping. Simpler than client-side filtering.
- **Alternatives considered**:
  - Client-side filtering — loads all tasks then filters in
    browser; leaks data shape, less performant at scale
