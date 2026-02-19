# Implementation Plan: Todo CLI App

**Branch**: `001-todo-cli-app` | **Date**: 2026-02-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-todo-cli-app/spec.md`

## Summary

Build a CLI-based Python Todo application with CRUD operations
(Add, Delete, Update, View, Mark Complete) using clean
architecture with three layers: Model (data structures), Services
(business logic), and CLI (user interface). All data is stored
in-memory using Python dictionaries. The app runs in a continuous
loop until the user types "exit". No external dependencies.

## Technical Context

**Language/Version**: Python >=3.14
**Primary Dependencies**: None (standard library only)
**Storage**: In-memory (Python dictionary)
**Testing**: Manual CLI testing (Phase 1)
**Target Platform**: Any platform with Python >=3.14
**Project Type**: Single project
**Performance Goals**: All operations complete within 1 second
**Constraints**: No external dependencies; in-memory only
**Scale/Scope**: Single user, single session, ephemeral data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Separation of Concerns | CLI layer separate from data logic; no print in data layer | PASS — 3-layer architecture (model/services/cli) enforces this |
| II. CLI-First Interface | stdin/stdout for interaction; stderr for errors | PASS — CLI is the only interface |
| III. Input Validation | All input validated before processing | PASS — validation at CLI boundary before calling services |
| IV. Type Safety & Documentation | Type hints + docstrings on all functions | PASS — enforced by design |
| V. Code Quality & Formatting | PEP 8, snake_case, organized imports | PASS — ruff configured for formatting |
| VI. In-Memory Data Storage | Lists or dictionaries, no external DB | PASS — dictionary storage, no persistence |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-cli-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
src/hackaton2/
├── __init__.py          # Package init (empty)
├── models/
│   ├── __init__.py
│   └── task.py          # Task dataclass
├── services/
│   ├── __init__.py
│   └── task_service.py  # Business logic (CRUD operations)
└── cli/
    ├── __init__.py
    └── app.py           # CLI menu loop and user interaction
```

**Structure Decision**: Single project using the `src/hackaton2/`
layout that already exists. Three sub-packages map directly to
the three architectural layers requested by the user: `models/`,
`services/`, `cli/`. This is the simplest structure that satisfies
Constitution Principle I (Separation of Concerns).

## Detailed Design

### Layer 1: Model (`src/hackaton2/models/task.py`)

A Python dataclass representing a single task:

```python
from dataclasses import dataclass, field

@dataclass
class Task:
    """Represents a single todo item.

    Attributes:
        id: Unique auto-incrementing identifier.
        title: Short name of the task.
        description: Detailed description of the task.
        status: Current state - 'pending' or 'completed'.
    """
    id: int
    title: str
    description: str
    status: str = field(default="pending")
```

**Fields** (per user request):
- `id: int` — Unique auto-incrementing integer, assigned by the service
- `title: str` — Short task name
- `description: str` — Detailed task description
- `status: str` — Either `"pending"` or `"completed"` (default: `"pending"`)

### Layer 2: Services (`src/hackaton2/services/task_service.py`)

Business logic layer. No print statements. Returns data or raises
exceptions. The service manages an internal dictionary and an
ID counter.

**Functions**:

| Function | Signature | Description |
|----------|-----------|-------------|
| `add_task` | `(title: str, description: str) -> Task` | Creates a new task with auto-incremented ID, stores it, returns the Task |
| `view_tasks` | `() -> list[Task]` | Returns all tasks as a list |
| `delete_task` | `(task_id: int) -> Task` | Removes task by ID, returns the deleted Task; raises `KeyError` if not found |
| `update_task` | `(task_id: int, title: str, description: str) -> Task` | Updates title and description; raises `KeyError` if not found |
| `complete_task` | `(task_id: int) -> Task` | Sets task status to "completed"; raises `KeyError` if not found; raises `ValueError` if already complete |

**Internal state**:
- `_tasks: dict[int, Task]` — Dictionary mapping task ID to Task
- `_next_id: int` — Counter starting at 1, never reused

### Layer 3: CLI (`src/hackaton2/cli/app.py`)

User-facing menu loop. All `input()` and `print()` calls live
here. Calls service functions and handles exceptions. This layer
is responsible for:

1. Displaying the menu
2. Reading and validating user input
3. Calling the appropriate service function
4. Displaying results or error messages
5. Looping until the user types "exit"

**Menu display**:
```
===== Todo App =====
1. Add Task
2. View Tasks
3. Update Task
4. Delete Task
5. Mark Complete
Type 'exit' to quit
====================
Choose an option:
```

**Input validation at CLI boundary**:
- Menu choice: case-insensitive match (number or word)
- Task ID: must parse to int; catch `ValueError`
- Title/Description: must not be empty/whitespace; `str.strip()`
- All validation happens before calling service functions

**Error handling**:
- `KeyError` from service → "Task with ID X not found"
- `ValueError` from service → "Task is already complete"
- Invalid input → descriptive message, re-show menu
- Never crash; always catch and display

### Entry Point

The `main()` function in `src/hackaton2/cli/app.py` (or
`src/hackaton2/__init__.py`) serves as the entry point,
matching the `pyproject.toml` script configuration
(`hackaton2 = "hackaton2:main"`).

## Data Flow

```
User Input → CLI (validate) → Service (process) → Return data → CLI (display)
                                    ↕
                              dict[int, Task]
                             (in-memory storage)
```

1. User types a menu option
2. CLI validates the input format
3. CLI calls the appropriate service function
4. Service operates on the in-memory dictionary
5. Service returns result (Task or list[Task]) or raises exception
6. CLI displays the result or catches the exception and shows error
7. Loop back to menu

## Complexity Tracking

No violations. The 3-layer architecture is the minimum needed
to satisfy Constitution Principle I.
