"""Task CRUD endpoints — all require Bearer token, all scoped by user_id."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_
from sqlmodel import or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.middleware.auth import get_current_user_id
from app.models.task import Task, TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# ---------- GET /api/tasks ----------

@router.get("/", response_model=list[TaskRead])
async def list_tasks(
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> list[Task]:
    """List all tasks for the current user.

    Optional query params:
    - status: filter by "pending" or "completed"
    - search: case-insensitive keyword search in title and description
    """
    statement = select(Task).where(Task.user_id == user_id)

    if status_filter is not None:
        if status_filter not in ("pending", "completed"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Status must be 'pending' or 'completed'",
            )
        statement = statement.where(Task.status == status_filter)

    if search is not None and search.strip():
        keyword = f"%{search.strip().lower()}%"
        statement = statement.where(
            or_(
                Task.title.ilike(keyword),
                Task.description.ilike(keyword),
            )
        )

    result = await session.exec(statement)
    return result.all()


# ---------- POST /api/tasks ----------

@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> Task:
    """Create a new task for the authenticated user."""
    task = Task(
        title=body.title,
        description=body.description,
        user_id=user_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


# ---------- PATCH /api/tasks/{id} ----------

@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> Task:
    """Update fields of an existing task. Enforces user_id scoping."""
    statement = select(Task).where(and_(Task.id == task_id, Task.user_id == user_id))
    result = await session.exec(statement)
    task = result.first()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    # Validate status transition
    if body.status is not None:
        if task.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=[{"field": "status", "message": "Can only transition from pending to completed"}],
            )
        task.status = body.status

    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description

    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


# ---------- DELETE /api/tasks/{id} ----------

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Permanently delete a task. Enforces user_id scoping."""
    statement = select(Task).where(and_(Task.id == task_id, Task.user_id == user_id))
    result = await session.exec(statement)
    task = result.first()

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    await session.delete(task)
    await session.commit()
