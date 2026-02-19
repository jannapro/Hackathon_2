"""Conversation model — one thread per user (MVP)."""

import uuid
from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """One conversation per user for MVP. Exists to support multi-thread expansion later."""

    __tablename__ = "conversation"
    __table_args__ = (Index("ix_conversation_user_id", "user_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(nullable=False, index=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
