"""FastAPI application entry point with CORS and startup DB init."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.database import init_db

# Import models so SQLModel.metadata.create_all() picks up all tables
import app.models.conversation  # noqa: F401
import app.models.message  # noqa: F401

from app.routers import tasks
from app.routers import chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup; shut down MCP server on exit."""
    await init_db()
    yield
    # Gracefully shut down the MCP subprocess (if it was started)
    from app.agent.runner import shutdown_mcp_server
    await shutdown_mcp_server()


app = FastAPI(title="Todo Web App API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(tasks.router)
app.include_router(chat.router)


@app.get("/")
async def health_check():
    """Health check endpoint (no auth required)."""
    return {"status": "ok", "service": "todo-backend"}
