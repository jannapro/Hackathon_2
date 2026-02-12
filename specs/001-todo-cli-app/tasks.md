# Tasks: Todo CLI App

**Input**: Design documents from `/specs/001-todo-cli-app/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Organization**: Tasks follow the user's requested order — Model first, then Services, then CLI, then integration — mapped to user stories for independent testability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create project directory structure and package init files

- [x] T001 Create models package directory and __init__.py at src/hackaton2/models/__init__.py
- [x] T002 [P] Create services package directory and __init__.py at src/hackaton2/services/__init__.py
- [x] T003 [P] Create cli package directory and __init__.py at src/hackaton2/cli/__init__.py

**Checkpoint**: All three package directories exist with __init__.py files. `from hackaton2.models import *` etc. should not error.

---

## Phase 2: Foundational — Data Model (Blocking Prerequisites)

**Purpose**: Define the Task dataclass that ALL user stories depend on

- [x] T004 Create Task dataclass with fields (id: int, title: str, description: str, status: str) using @dataclass decorator in src/hackaton2/models/task.py. Include type hints for all fields. Set status default to "pending". Add docstring describing each attribute per Constitution Principle IV.

**Checkpoint**: `from hackaton2.models.task import Task` works. `Task(id=1, title="test", description="desc")` creates an instance with status="pending".

---

## Phase 3: User Story 1 — Add and View Tasks (Priority: P1)

**Goal**: User can add new tasks and view all tasks — the MVP

**Independent Test**: Launch the app, add 2-3 tasks, view the list, verify all appear with IDs

### Services for User Story 1

- [x] T005 [US1] Create task_service module with module-level state (_tasks: dict[int, Task] and _next_id: int = 1) in src/hackaton2/services/task_service.py. Add type hints and docstring.
- [x] T006 [US1] Implement add_task(title: str, description: str) -> Task function in src/hackaton2/services/task_service.py. Must create Task with auto-incremented ID, store in _tasks dict, increment _next_id, and return the created Task. Add type hints and docstring.
- [x] T007 [US1] Implement view_tasks() -> list[Task] function in src/hackaton2/services/task_service.py. Must return all tasks from _tasks dict as a list. Return empty list if no tasks exist. Add type hints and docstring.

### CLI for User Story 1

- [x] T008 [US1] Create the display_menu() function in src/hackaton2/cli/app.py. Must print the menu with all 5 options (Add, View, Update, Delete, Mark Complete) and "exit" option. Add type hints and docstring.
- [x] T009 [US1] Implement handle_add() function in src/hackaton2/cli/app.py. Must prompt user for title and description using input(), validate both are non-empty after strip(), call task_service.add_task(), and print confirmation with assigned ID. Print error to stderr if input is empty. Add type hints and docstring.
- [x] T010 [US1] Implement handle_view() function in src/hackaton2/cli/app.py. Must call task_service.view_tasks(), display all tasks with ID, title, description, and status in a formatted list. Print "No tasks yet" message if list is empty. Add type hints and docstring.
- [x] T011 [US1] Implement main() function with menu loop in src/hackaton2/cli/app.py. Must display menu, read user choice via input(), match choice case-insensitively (accept both numbers "1"/"2" and words "add"/"view"), call appropriate handler, loop until user types "exit". Handle unrecognized input with error message. Add type hints and docstring.

### Entry Point for User Story 1

- [x] T012 [US1] Wire main() entry point in src/hackaton2/__init__.py. Import main from hackaton2.cli.app and expose it so that the pyproject.toml script entry (hackaton2 = "hackaton2:main") works correctly.

**Checkpoint**: Run `uv run hackaton2`. App starts, shows menu. Add 2 tasks, view them. Type "exit" to quit. Empty input shows error. Invalid menu option shows error.

---

## Phase 4: User Story 2 — Delete and Complete Tasks (Priority: P2)

**Goal**: User can delete tasks and mark them complete — full task lifecycle

**Independent Test**: Add tasks (US1), mark one complete, verify status changes. Delete a task, verify it disappears from view.

### Services for User Story 2

- [x] T013 [P] [US2] Implement delete_task(task_id: int) -> Task function in src/hackaton2/services/task_service.py. Must remove task from _tasks dict by ID and return the deleted Task. Raise KeyError if task_id not found. Add type hints and docstring.
- [x] T014 [P] [US2] Implement complete_task(task_id: int) -> Task function in src/hackaton2/services/task_service.py. Must set task status to "completed". Raise KeyError if task_id not found. Raise ValueError if task is already "completed". Return the updated Task. Add type hints and docstring.

### CLI for User Story 2

- [x] T015 [US2] Implement handle_delete() function in src/hackaton2/cli/app.py. Must prompt for task ID, validate it is a non-empty integer using int() with try/except ValueError, call task_service.delete_task(), print confirmation. Catch KeyError and print "Task not found" message. Handle empty task list case. Add type hints and docstring.
- [x] T016 [US2] Implement handle_complete() function in src/hackaton2/cli/app.py. Must prompt for task ID, validate it is a non-empty integer, call task_service.complete_task(), print confirmation. Catch KeyError ("not found") and ValueError ("already complete") with appropriate messages. Handle empty task list case. Add type hints and docstring.
- [x] T017 [US2] Update main() loop in src/hackaton2/cli/app.py to route menu options "4"/"delete" to handle_delete() and "5"/"complete" to handle_complete().

**Checkpoint**: Run app. Add tasks, mark one complete (verify status in view), delete another (verify gone from view). Try invalid ID, already-complete task — see error messages, no crashes.

---

## Phase 5: User Story 3 — Update Task Description (Priority: P3)

**Goal**: User can update a task's title and description to fix mistakes

**Independent Test**: Add a task (US1), update its title and description, view to confirm changes.

### Services for User Story 3

- [x] T018 [US3] Implement update_task(task_id: int, title: str, description: str) -> Task function in src/hackaton2/services/task_service.py. Must update the task's title and description fields. Raise KeyError if task_id not found. Return the updated Task. Add type hints and docstring.

### CLI for User Story 3

- [x] T019 [US3] Implement handle_update() function in src/hackaton2/cli/app.py. Must prompt for task ID (validate as integer), then prompt for new title and new description (validate both non-empty after strip). Call task_service.update_task(). Print confirmation. Catch KeyError and print "not found". Handle empty task list case. Add type hints and docstring.
- [x] T020 [US3] Update main() loop in src/hackaton2/cli/app.py to route menu option "3"/"update" to handle_update().

**Checkpoint**: Run app. Add a task, update its title and description, view to confirm changes. Try invalid ID — see error. Try empty title/description — see error, original preserved.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T021 Verify all functions in src/hackaton2/models/task.py, src/hackaton2/services/task_service.py, and src/hackaton2/cli/app.py have type hints on all parameters and return values per Constitution Principle IV
- [x] T022 [P] Verify all functions have docstrings describing purpose, parameters, return value, and exceptions per Constitution Principle IV
- [x] T023 [P] Run full end-to-end manual test: launch app, add 3 tasks, view all, update one, mark one complete, delete one, view again, try all edge cases (empty input, invalid ID, non-numeric ID, already complete, unrecognized menu option), exit. Verify SC-001 through SC-004 pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — Task model BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — BLOCKS US2 and US3 (they need add/view to create test data)
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs tasks to exist for delete/complete)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (needs tasks to exist for update)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Task model (Phase 2) — no other story dependencies
- **US2 (P2)**: Depends on US1 (needs add_task and view_tasks to exist)
- **US3 (P3)**: Depends on US1 (needs add_task and view_tasks to exist)
- **US2 and US3**: Can run in parallel after US1 is complete

### Within Each User Story

- Services before CLI handlers (CLI calls service functions)
- CLI handlers before main() loop routing
- All service functions for a story can be parallel if independent

### Parallel Opportunities

```text
Phase 1:  T001 ─┬─ T002 (parallel)
                 └─ T003 (parallel)

Phase 3:  T005 → T006 → T007 (sequential — T006/T007 need module state from T005)
          T008 ─┬─ T009 (parallel after T006)
                └─ T010 (parallel after T007)
          T011 → T012 (sequential)

Phase 4:  T013 ─┬─ T014 (parallel — different functions, same file but independent)
          T015 ─┬─ T016 (parallel — different handlers)
          T017 (after T015 + T016)

Phase 5:  T018 → T019 → T020 (sequential)

Phase 6:  T021 ─┬─ T022 (parallel)
                 └─ T023 (after T021 + T022)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Task Model (T004)
3. Complete Phase 3: Add + View + Menu Loop (T005-T012)
4. **STOP and VALIDATE**: Run app, add tasks, view tasks
5. MVP is usable as a basic task tracker

### Incremental Delivery

1. Setup + Model → Foundation ready
2. Add US1 (Add + View) → Test independently → **MVP!**
3. Add US2 (Delete + Complete) → Test independently → Full lifecycle
4. Add US3 (Update) → Test independently → All features complete
5. Polish → Validate all success criteria → Done

### Parallel Opportunity After MVP

Once US1 is complete, US2 and US3 can proceed in parallel:
- Developer A: US2 (Delete + Complete) — T013-T017
- Developer B: US3 (Update) — T018-T020

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- No tests requested in spec — manual testing via checkpoints
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 23 tasks across 6 phases
