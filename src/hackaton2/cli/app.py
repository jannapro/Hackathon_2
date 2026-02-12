"""CLI interface for the Todo application.

This module handles all user interaction: displaying menus,
reading input, validating input, and calling service functions.
All print() and input() calls live here — the service layer
never prints.
"""

import sys

from hackaton2.services import task_service


def display_menu() -> None:
    """Print the main menu with all available options."""
    print("\n===== Todo App =====")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Update Task")
    print("4. Delete Task")
    print("5. Mark Complete")
    print("Type 'exit' to quit")
    print("====================")


def handle_add() -> None:
    """Prompt user for task title and description, then create the task.

    Validates that both title and description are non-empty after
    stripping whitespace. Prints error to stderr if input is invalid.
    """
    title = input("Enter task title: ").strip()
    if not title:
        print("Error: Title cannot be empty.", file=sys.stderr)
        return

    description = input("Enter task description: ").strip()
    if not description:
        print("Error: Description cannot be empty.", file=sys.stderr)
        return

    task = task_service.add_task(title, description)
    print(f"Task added successfully! (ID: {task.id})")


def handle_view() -> None:
    """Display all tasks with their ID, title, description, and status.

    Prints a friendly message if no tasks exist.
    """
    tasks = task_service.view_tasks()
    if not tasks:
        print("No tasks yet. Use 'Add' to create one.")
        return

    print(f"\n{'ID':<5} {'Title':<20} {'Description':<30} {'Status':<10}")
    print("-" * 65)
    for task in tasks:
        status_display = "Done" if task.status == "completed" else "Pending"
        print(
            f"{task.id:<5} {task.title:<20} "
            f"{task.description:<30} {status_display:<10}"
        )


def handle_delete() -> None:
    """Prompt user for a task ID and delete that task.

    Validates that the ID is a valid integer. Catches KeyError
    if the task does not exist. Shows a message if no tasks exist.
    """
    tasks = task_service.view_tasks()
    if not tasks:
        print("No tasks to delete.")
        return

    raw_id = input("Enter task ID to delete: ").strip()
    try:
        task_id = int(raw_id)
    except ValueError:
        print("Error: Please enter a valid number.", file=sys.stderr)
        return

    try:
        task = task_service.delete_task(task_id)
        print(f"Task '{task.title}' (ID: {task.id}) deleted successfully!")
    except KeyError:
        print(f"Error: Task with ID {task_id} not found.", file=sys.stderr)


def handle_complete() -> None:
    """Prompt user for a task ID and mark it as completed.

    Validates that the ID is a valid integer. Catches KeyError
    if the task does not exist and ValueError if it is already
    completed. Shows a message if no tasks exist.
    """
    tasks = task_service.view_tasks()
    if not tasks:
        print("No tasks to complete.")
        return

    raw_id = input("Enter task ID to mark complete: ").strip()
    try:
        task_id = int(raw_id)
    except ValueError:
        print("Error: Please enter a valid number.", file=sys.stderr)
        return

    try:
        task = task_service.complete_task(task_id)
        print(
            f"Task '{task.title}' (ID: {task.id}) "
            "marked as completed!"
        )
    except KeyError:
        print(f"Error: Task with ID {task_id} not found.", file=sys.stderr)
    except ValueError:
        print(
            f"Error: Task with ID {task_id} is already completed.",
            file=sys.stderr,
        )


def handle_update() -> None:
    """Prompt user for a task ID and new title/description, then update.

    Validates that the ID is a valid integer and that the new title
    and description are non-empty after stripping whitespace. Catches
    KeyError if the task does not exist. Shows a message if no tasks
    exist.
    """
    tasks = task_service.view_tasks()
    if not tasks:
        print("No tasks to update.")
        return

    raw_id = input("Enter task ID to update: ").strip()
    try:
        task_id = int(raw_id)
    except ValueError:
        print("Error: Please enter a valid number.", file=sys.stderr)
        return

    title = input("Enter new title: ").strip()
    if not title:
        print("Error: Title cannot be empty.", file=sys.stderr)
        return

    description = input("Enter new description: ").strip()
    if not description:
        print("Error: Description cannot be empty.", file=sys.stderr)
        return

    try:
        task = task_service.update_task(task_id, title, description)
        print(f"Task (ID: {task.id}) updated successfully!")
    except KeyError:
        print(f"Error: Task with ID {task_id} not found.", file=sys.stderr)


def main() -> None:
    """Run the main menu loop until the user types 'exit'.

    Reads user input, matches it case-insensitively to menu
    options (accepts both numbers and words), and calls the
    appropriate handler. Unrecognized input shows an error.
    """
    print("Welcome to the Todo App!")

    while True:
        display_menu()
        choice = input("Choose an option: ").strip().lower()

        if choice in ("exit", "quit"):
            print("Goodbye!")
            break
        elif choice in ("1", "add"):
            handle_add()
        elif choice in ("2", "view"):
            handle_view()
        elif choice in ("3", "update"):
            handle_update()
        elif choice in ("4", "delete"):
            handle_delete()
        elif choice in ("5", "complete", "mark complete"):
            handle_complete()
        else:
            print(
                f"Error: '{choice}' is not recognized. "
                "Please choose a valid option.",
                file=sys.stderr,
            )
