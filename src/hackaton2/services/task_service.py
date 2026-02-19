"""Business logic for managing todo tasks.

This module provides functions for creating, viewing, updating,
deleting, and completing tasks. All data is stored in-memory
using a module-level dictionary. No print statements — errors
are signaled via exceptions.
"""

from hackaton2.models.task import Task

_tasks: dict[int, Task] = {}
_next_id: int = 1


def add_task(title: str, description: str) -> Task:
    """Create a new task and store it in memory.

    Args:
        title: Short name of the task.
        description: Detailed description of the task.

    Returns:
        The newly created Task with an auto-assigned ID.
    """
    global _next_id
    task = Task(id=_next_id, title=title, description=description)
    _tasks[_next_id] = task
    _next_id += 1
    return task


def view_tasks() -> list[Task]:
    """Return all tasks as a list.

    Returns:
        A list of all Task objects. Empty list if no tasks exist.
    """
    return list(_tasks.values())


def delete_task(task_id: int) -> Task:
    """Remove a task from storage by its ID.

    Args:
        task_id: The unique identifier of the task to delete.

    Returns:
        The deleted Task object.

    Raises:
        KeyError: If no task with the given ID exists.
    """
    if task_id not in _tasks:
        raise KeyError(f"Task with ID {task_id} not found")
    return _tasks.pop(task_id)


def complete_task(task_id: int) -> Task:
    """Mark a task as completed.

    Args:
        task_id: The unique identifier of the task to complete.

    Returns:
        The updated Task object with status set to 'completed'.

    Raises:
        KeyError: If no task with the given ID exists.
        ValueError: If the task is already completed.
    """
    if task_id not in _tasks:
        raise KeyError(f"Task with ID {task_id} not found")
    task = _tasks[task_id]
    if task.status == "completed":
        raise ValueError(f"Task with ID {task_id} is already completed")
    task.status = "completed"
    return task


def update_task(task_id: int, title: str, description: str) -> Task:
    """Update the title and description of an existing task.

    Args:
        task_id: The unique identifier of the task to update.
        title: The new title for the task.
        description: The new description for the task.

    Returns:
        The updated Task object.

    Raises:
        KeyError: If no task with the given ID exists.
    """
    if task_id not in _tasks:
        raise KeyError(f"Task with ID {task_id} not found")
    task = _tasks[task_id]
    task.title = title
    task.description = description
    return task
