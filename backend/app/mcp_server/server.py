"""MCP server — exposes 5 task-management tools via stdio transport.

Run as subprocess by the agent runner:
    python -m app.mcp_server.server

Each tool accepts user_id as its first argument (injected server-side from the
verified session token — never from the chat message body).
"""

import ssl as ssl_module

from mcp.server.fastmcp import FastMCP
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import DATABASE_URL

# ---------- DB setup (subprocess owns its own engine) ----------

_clean_url = DATABASE_URL.split("?")[0]
_ssl_ctx = ssl_module.create_default_context()
_engine = create_async_engine(
    _clean_url,
    echo=False,
    connect_args={"ssl": _ssl_ctx},
    pool_pre_ping=True,   # test each connection before use (handles Neon idle timeouts)
    pool_recycle=300,     # recycle connections every 5 min
)

mcp = FastMCP("task-manager")


# ---------- Helpers ----------

async def _get_session() -> AsyncSession:
    return AsyncSession(_engine)


# ---------- Read tools ----------

@mcp.tool()
async def list_tasks(user_id: str, status: str | None = None) -> dict:
    """List all tasks for the user, optionally filtered by status."""
    async with AsyncSession(_engine) as session:
        try:
            if status:
                result = await session.execute(
                    text(
                        "SELECT id, title, description, status, created_at "
                        "FROM task WHERE user_id = :uid AND status = :status "
                        "ORDER BY created_at DESC"
                    ),
                    {"uid": user_id, "status": status},
                )
            else:
                result = await session.execute(
                    text(
                        "SELECT id, title, description, status, created_at "
                        "FROM task WHERE user_id = :uid ORDER BY created_at DESC"
                    ),
                    {"uid": user_id},
                )
            rows = result.fetchall()
            tasks = [
                {
                    "task_id": str(row.id),
                    "title": row.title,
                    "description": row.description,
                    "status": row.status,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                }
                for row in rows
            ]
            return {"status": "ok", "tasks": tasks, "count": len(tasks)}
        except Exception as e:
            return {"status": "error", "message": str(e)}


# ---------- Write tools ----------

@mcp.tool()
async def add_task(
    user_id: str,
    title: str,
    description: str = "",
    status: str = "pending",
) -> dict:
    """Create a new task for the authenticated user. Description is optional."""
    import uuid as _uuid
    from datetime import datetime

    if not title or not title.strip():
        return {"status": "error", "message": "Title is required"}
    # Use title as description fallback so the NOT NULL constraint is always met
    if not description or not description.strip():
        description = title

    task_id = str(_uuid.uuid4())
    now = datetime.utcnow()

    async with AsyncSession(_engine) as session:
        try:
            await session.execute(
                text(
                    "INSERT INTO task (id, title, description, status, user_id, "
                    "created_at, updated_at) "
                    "VALUES (:id, :title, :description, :status, :uid, :now, :now)"
                ),
                {
                    "id": task_id,
                    "title": title.strip(),
                    "description": description.strip(),
                    "status": status,
                    "uid": user_id,
                    "now": now,
                },
            )
            await session.commit()
            return {
                "status": "created",
                "task_id": task_id,
                "title": title.strip(),
                "description": description.strip(),
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}


@mcp.tool()
async def update_task(
    user_id: str,
    task_id: str,
    title: str,
    description: str | None = None,
) -> dict:
    """Update a task's title and optionally description."""
    from datetime import datetime

    if not title or not title.strip():
        return {"status": "error", "message": "Title is required"}

    async with AsyncSession(_engine) as session:
        try:
            # Verify ownership
            check = await session.execute(
                text("SELECT id FROM task WHERE id = :tid AND user_id = :uid"),
                {"tid": task_id, "uid": user_id},
            )
            if check.first() is None:
                return {"status": "error", "message": "Task not found"}

            if description is not None:
                await session.execute(
                    text(
                        "UPDATE task SET title = :title, description = :desc, "
                        "updated_at = :now WHERE id = :tid AND user_id = :uid"
                    ),
                    {
                        "title": title.strip(),
                        "desc": description.strip(),
                        "now": datetime.utcnow(),
                        "tid": task_id,
                        "uid": user_id,
                    },
                )
            else:
                await session.execute(
                    text(
                        "UPDATE task SET title = :title, updated_at = :now "
                        "WHERE id = :tid AND user_id = :uid"
                    ),
                    {
                        "title": title.strip(),
                        "now": datetime.utcnow(),
                        "tid": task_id,
                        "uid": user_id,
                    },
                )
            await session.commit()
            return {"status": "updated", "task_id": task_id, "title": title.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}


@mcp.tool()
async def delete_task(user_id: str, task_id: str) -> dict:
    """Permanently delete a task owned by the user."""
    async with AsyncSession(_engine) as session:
        try:
            result = await session.execute(
                text("DELETE FROM task WHERE id = :tid AND user_id = :uid"),
                {"tid": task_id, "uid": user_id},
            )
            await session.commit()
            if result.rowcount == 0:
                return {"status": "error", "message": "Task not found"}
            return {"status": "deleted", "task_id": task_id}
        except Exception as e:
            return {"status": "error", "message": str(e)}


@mcp.tool()
async def complete_task(user_id: str, task_id: str) -> dict:
    """Mark a task as completed."""
    from datetime import datetime

    async with AsyncSession(_engine) as session:
        try:
            # Verify ownership and fetch title
            check = await session.execute(
                text("SELECT title, status FROM task WHERE id = :tid AND user_id = :uid"),
                {"tid": task_id, "uid": user_id},
            )
            row = check.first()
            if row is None:
                return {"status": "error", "message": "Task not found"}

            await session.execute(
                text(
                    "UPDATE task SET status = 'completed', updated_at = :now "
                    "WHERE id = :tid AND user_id = :uid"
                ),
                {"now": datetime.utcnow(), "tid": task_id, "uid": user_id},
            )
            await session.commit()
            return {"status": "completed", "task_id": task_id, "title": row.title}
        except Exception as e:
            return {"status": "error", "message": str(e)}


@mcp.tool()
async def delete_all_tasks(user_id: str) -> dict:
    """Delete ALL tasks owned by the user. Use when the user asks to clear or delete all tasks."""
    async with AsyncSession(_engine) as session:
        try:
            result = await session.execute(
                text("DELETE FROM task WHERE user_id = :uid"),
                {"uid": user_id},
            )
            await session.commit()
            return {"status": "deleted_all", "count": result.rowcount}
        except Exception as e:
            return {"status": "error", "message": str(e)}


@mcp.tool()
async def complete_all_tasks(user_id: str) -> dict:
    """Mark ALL pending tasks as completed for the user."""
    from datetime import datetime

    async with AsyncSession(_engine) as session:
        try:
            result = await session.execute(
                text(
                    "UPDATE task SET status = 'completed', updated_at = :now "
                    "WHERE user_id = :uid AND status = 'pending'"
                ),
                {"now": datetime.utcnow(), "uid": user_id},
            )
            await session.commit()
            return {"status": "completed_all", "count": result.rowcount}
        except Exception as e:
            return {"status": "error", "message": str(e)}


# ---------- Entrypoint ----------

if __name__ == "__main__":
    mcp.run()  # starts stdio transport — used by MCPServerStdio
