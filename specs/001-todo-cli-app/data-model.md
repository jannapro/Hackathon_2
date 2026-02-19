# Data Model: Todo CLI App

**Feature**: 001-todo-cli-app
**Date**: 2026-02-09

## Entities

### Task

Represents a single to-do item managed by the application.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `int` | (assigned by service) | Unique auto-incrementing identifier starting at 1. Never reused after deletion. |
| `title` | `str` | (required) | Short name of the task. Must not be empty or whitespace-only. |
| `description` | `str` | (required) | Detailed description. Must not be empty or whitespace-only. |
| `status` | `str` | `"pending"` | Current state. Valid values: `"pending"`, `"completed"`. |

### Validation Rules

- `id`: Positive integer, auto-assigned, immutable after creation.
- `title`: Non-empty string after stripping whitespace.
- `description`: Non-empty string after stripping whitespace.
- `status`: Must be one of `"pending"` or `"completed"`. Only
  transitions from `"pending"` → `"completed"` are allowed.
  Marking an already-completed task as complete is an error.

### State Transitions

```
 [created] → pending → completed
                ↓
           [deleted]
```

- A task is created with status `"pending"`.
- A pending task can be marked `"completed"`.
- A task in any status can be deleted (removed from storage).
- A task's title and description can be updated in any status.
- There is no transition from `"completed"` back to `"pending"`.

## Storage Structure

```
_tasks: dict[int, Task]
```

- Key: `task.id` (int)
- Value: `Task` dataclass instance
- Capacity: limited only by available system memory
- Persistence: none (ephemeral, lost on process exit)

## ID Generation

```
_next_id: int = 1
```

- Starts at 1.
- Incremented by 1 after each task creation.
- Never decremented or reused, even after deletion.
- Guarantees unique IDs within a session.
