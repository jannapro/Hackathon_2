"""Message model — one row per chat turn (user, assistant, or tool)."""

import uuid
from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class Message(SQLModel, table=True):
    """Single message in a conversation. Stores all roles for full context replay."""

    __tablename__ = "message"
    __table_args__ = (
        Index("ix_message_conversation_id", "conversation_id"),
        Index("ix_message_conv_created", "conversation_id", "created_at"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(
        foreign_key="conversation.id",
        nullable=False,
        index=False,
    )
    role: str = Field(nullable=False, max_length=20)  # user | assistant | tool
    content: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
