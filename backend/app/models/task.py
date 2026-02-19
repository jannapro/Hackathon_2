"""Task SQLModel — the core entity managed by the backend."""

import uuid
from datetime import datetime, timezone

from pydantic import field_validator
from sqlalchemy import Column, Index, String
from sqlmodel import Field, SQLModel


class TaskBase(SQLModel):
    """Shared fields for create/update validation."""

    title: str = Field(max_length=200)
    description: str = Field(max_length=1000)

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Title is required")
        return v.strip()

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Description is required")
        return v.strip()


class TaskCreate(TaskBase):
    """Request body for POST /api/tasks."""

    pass


class TaskUpdate(SQLModel):
    """Request body for PATCH /api/tasks/{id}. All fields optional."""

    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    status: str | None = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Title is required")
        return v.strip() if v else v

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Description is required")
        return v.strip() if v else v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str | None) -> str | None:
        if v is not None and v != "completed":
            raise ValueError("Can only transition from pending to completed")
        return v


class Task(TaskBase, table=True):
    """Task database table."""

    __tablename__ = "task"
    __table_args__ = (
        Index("ix_task_user_id", "user_id"),
        Index("ix_task_user_status", "user_id", "status"),
        Index("ix_task_user_title", "user_id", "title"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    status: str = Field(default="pending", sa_column=Column(String, nullable=False, server_default="pending"))
    user_id: str = Field(nullable=False, index=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TaskRead(TaskBase):
    """Response schema — excludes user_id."""

    id: uuid.UUID
    status: str
    created_at: datetime
    updated_at: datetime
