"""Neon PostgreSQL async connection, engine, and table creation."""

import ssl as ssl_module

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config import DATABASE_URL

# asyncpg doesn't support sslmode query param — strip it and use ssl connect_args
clean_url = DATABASE_URL.split("?")[0]
ssl_context = ssl_module.create_default_context()

engine = create_async_engine(clean_url, echo=False, connect_args={"ssl": ssl_context})


async def init_db() -> None:
    """Create all tables defined by SQLModel metadata."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session():
    """Yield an async database session."""
    async with AsyncSession(engine) as session:
        yield session
