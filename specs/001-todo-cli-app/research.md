# Research: Todo CLI App

**Feature**: 001-todo-cli-app
**Date**: 2026-02-09

## Research Tasks

No NEEDS CLARIFICATION items exist in the Technical Context.
All technology choices are straightforward and fully specified
by the constitution and user input.

## Decisions

### 1. Data Structure for Task Storage

- **Decision**: Use `dict[int, Task]` (dictionary mapping int ID to Task)
- **Rationale**: O(1) lookup by ID for delete/update/complete operations.
  Lists would require O(n) search by ID. The spec requires referencing
  tasks by numeric ID, making dictionary the natural choice.
- **Alternatives considered**:
  - `list[Task]` — O(n) lookup by ID, requires linear scan; rejected
  - `OrderedDict` — unnecessary since insertion order is preserved
    in regular dicts since Python 3.7

### 2. Task Data Model

- **Decision**: Use `@dataclass` with 4 fields: `id`, `title`,
  `description`, `status`
- **Rationale**: User explicitly requested these 4 fields. Dataclass
  provides `__init__`, `__repr__`, and `__eq__` for free. No
  external dependencies needed.
- **Alternatives considered**:
  - Plain dict — loses type safety (Constitution Principle IV)
  - NamedTuple — immutable, would require creating new instances
    for status updates; rejected for update ergonomics
  - Pydantic BaseModel — external dependency; rejected per
    Constitution (no external dependencies in Phase 1)

### 3. Service Layer Pattern

- **Decision**: Module-level functions with module-level state
  (`_tasks` dict and `_next_id` counter)
- **Rationale**: Simplest approach for a single-user CLI app.
  A class-based service (e.g., `TaskService` instance) would add
  unnecessary complexity. Module state is sufficient since there
  is only one "instance" of the service in the process.
- **Alternatives considered**:
  - Class-based service — adds constructor, `self` parameter,
    instance management; unnecessary for single-user app
  - Repository pattern — over-engineering for in-memory storage

### 4. Menu Input Style

- **Decision**: Accept both numbers ("1") and words ("add"),
  case-insensitive
- **Rationale**: Spec assumption says menu is case-insensitive.
  Supporting both numbers and words improves usability with
  minimal extra code.
- **Alternatives considered**:
  - Numbers only — less user-friendly
  - Words only — requires typing full word each time

### 5. Error Signaling from Service to CLI

- **Decision**: Raise exceptions (`KeyError`, `ValueError`) from
  service layer; catch in CLI layer
- **Rationale**: Clean separation per Constitution Principle I.
  Service layer never prints. CLI layer catches exceptions and
  displays user-friendly messages. Standard Python pattern.
- **Alternatives considered**:
  - Return `None` or sentinel values — loses error context,
    makes calling code harder to read
  - Result type (Ok/Err) — over-engineering for this scope
