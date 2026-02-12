"""Task data model for the Todo CLI application."""

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
