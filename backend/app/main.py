"""FastAPI application entry point with CORS and startup DB init."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.database import init_db
from app.routers import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    await init_db()
    yield


app = FastAPI(title="Todo Web App API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(tasks.router)


@app.get("/")
async def health_check():
    """Health check endpoint (no auth required)."""
    return {"status": "ok", "service": "todo-backend"}
