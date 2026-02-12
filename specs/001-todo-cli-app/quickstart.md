# Quickstart: Todo CLI App

## Prerequisites

- Python >=3.14
- uv package manager installed

## Setup

```bash
# Clone the repository (if needed)
git clone <repo-url>
cd hackaton2

# Install with uv
uv sync
```

## Run the App

```bash
uv run hackaton2
```

## Usage

When the app starts, you will see a menu:

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

### Add a Task

1. Choose option `1` (or type `add`)
2. Enter a title when prompted
3. Enter a description when prompted
4. The app confirms the task was created with its assigned ID

### View All Tasks

1. Choose option `2` (or type `view`)
2. The app displays all tasks with ID, title, description, and status

### Update a Task

1. Choose option `3` (or type `update`)
2. Enter the task ID to update
3. Enter the new title
4. Enter the new description
5. The app confirms the update

### Delete a Task

1. Choose option `4` (or type `delete`)
2. Enter the task ID to delete
3. The app confirms the task was removed

### Mark a Task Complete

1. Choose option `5` (or type `complete`)
2. Enter the task ID to mark complete
3. The app confirms the task status changed to "completed"

### Exit

Type `exit` at the menu prompt to quit the application.

## Notes

- All data is stored in memory and lost when the app exits.
- Task IDs are auto-incrementing and never reused.
- Menu options are case-insensitive ("add", "Add", "ADD" all work).
- Invalid input shows a helpful error message; the app never crashes.
