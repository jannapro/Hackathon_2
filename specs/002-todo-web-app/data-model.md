# Data Model: Todo Web App

**Feature**: 002-todo-web-app
**Date**: 2026-02-09

## Entities

### User (managed by Better Auth)

Better Auth creates and manages the user table automatically.
The backend does NOT define a User model. The backend only
receives `user_id` from the JWT token.

Better Auth user fields (auto-managed):
- `id` — Unique identifier (string/UUID)
- `email` — Unique email address
- `password` — Hashed password
- `created_at` — Account creation timestamp
- (Additional Better Auth session/token fields)

### Task (managed by backend)

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | auto-generated | Primary key | Unique identifier. UUID prevents enumeration. |
| `title` | str | (required) | Max 200 chars, non-empty | Short name of the task. |
| `description` | str | (required) | Max 1000 chars, non-empty | Detailed description. |
| `status` | str | `"pending"` | Must be "pending" or "completed" | Current state. |
| `user_id` | str | (from JWT) | NOT NULL, indexed | Owner of the task. References Better Auth user ID. |
| `created_at` | datetime | now() | NOT NULL | When the task was created. |
| `updated_at` | datetime | now() | NOT NULL, auto-update | When the task was last modified. |

### Validation Rules

- `title`: Non-empty after stripping whitespace. Max 200 chars.
- `description`: Non-empty after stripping whitespace. Max 1000
  chars.
- `status`: Must be one of `"pending"` or `"completed"`.
  Only transition: `"pending"` → `"completed"`.
- `user_id`: Set from JWT token — never from user input.
  Immutable after creation.

### State Transitions

```
 [created] → pending → completed
                ↓
           [deleted]
```

- Task created with status `"pending"`.
- Pending task can be marked `"completed"` via PATCH.
- Any task can be deleted via DELETE (hard delete).
- Title and description can be updated via PATCH in any status.

## Relationships

```
User (Better Auth) 1 ──── * Task (Backend)
     │                         │
     └── user.id ──────── task.user_id
```

- One User owns zero or more Tasks.
- Each Task belongs to exactly one User.
- Deleting a user should cascade-delete their tasks.

## Indexes

- `task.user_id` — Index for fast user-scoped queries
- `task.user_id + task.status` — Composite index for filtered
  queries (e.g., "show me all my pending tasks")
- `task.user_id + task.title` — Composite for search queries

## Storage

- **Database**: Neon Serverless PostgreSQL (cloud-managed)
- **ORM**: SQLModel (Python, built on SQLAlchemy)
- **Connection**: Async connection pool via database URL in `.env`
- **Persistence**: All data permanent; survives restarts
