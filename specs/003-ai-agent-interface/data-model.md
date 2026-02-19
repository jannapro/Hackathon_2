# Data Model: Conversational AI Agent Interface

**Feature**: 003-ai-agent-interface
**Date**: 2026-02-17

---

## New Tables

### `conversation`

One row per user (MVP: single thread per user). Exists to support multi-thread
expansion without a future schema migration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default uuid4 | Conversation identifier |
| `user_id` | VARCHAR | NOT NULL, INDEX | Owner (matches Better Auth user.id) |
| `created_at` | TIMESTAMP | NOT NULL, default utcnow | Creation time |

**Indexes**: `ix_conversation_user_id` on `user_id`

**SQLModel class**: `Conversation` in `backend/app/models/conversation.py`

---

### `message`

One row per turn (user, assistant, or tool). Stored in insertion order.
All roles are persisted to allow full reconstruction of the Agents SDK
`input` list, including tool call / tool result turns.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, default uuid4 | Message identifier |
| `conversation_id` | UUID | FK → conversation.id, NOT NULL | Parent conversation |
| `role` | VARCHAR(20) | NOT NULL | `user`, `assistant`, or `tool` |
| `content` | TEXT | NOT NULL | Message text or tool result JSON |
| `created_at` | TIMESTAMP | NOT NULL, default utcnow | Insertion time |

**Indexes**:
- `ix_message_conversation_id` on `conversation_id`
- `ix_message_conv_created` on `(conversation_id, created_at)` — supports ordered history fetch

**SQLModel class**: `Message` in `backend/app/models/message.py`

---

## Unchanged Tables

### `task`

No changes to the task table. All task mutations continue to go through the
existing REST endpoints (`/api/tasks/`) for the web UI, and through the 5 MCP
tools for the agent. Both paths write to the same `task` table, scoped by
`user_id`.

---

## Entity Relationships

```
user (Better Auth)
  └── conversation  (1 per user for MVP)
        └── message  (N per conversation, ordered by created_at)

user
  └── task  (N per user — unchanged)
```

---

## Validation Rules

**Conversation**:
- `user_id` MUST match an authenticated user — verified at the API layer.
- One conversation per user enforced at application layer (upsert-or-create
  pattern on first chat message).

**Message**:
- `role` MUST be one of `user`, `assistant`, `tool`.
- `content` MUST NOT be empty.
- `conversation_id` MUST reference a conversation owned by the requesting user.

---

## State Transitions

**Conversation lifecycle**:
```
[no conversation] --first chat message--> [conversation created]
                                               └── messages append indefinitely
```

**Message lifecycle**:
```
Request received
  → save user Message (role="user")
  → run agent (may generate tool messages internally)
  → save assistant Message (role="assistant")
  → [future] save tool turn Messages if needed for full context replay
```

---

## Migration Strategy

Uses SQLModel's `SQLModel.metadata.create_all()` called at FastAPI startup
(existing `init_db()` in `database.py`). New tables are additive — no existing
columns are modified. Safe to run against a live Neon database.
