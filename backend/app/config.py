"""Application configuration loaded from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.environ["DATABASE_URL"]
JWT_SECRET: str = os.environ["JWT_SECRET"]
FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:3000")
