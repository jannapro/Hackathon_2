"""Chat endpoints — POST /api/chat (stateless) and GET /api/chat/history."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.agent.runner import run_agent
from app.database import get_session
from app.middleware.auth import get_current_user_id
from app.models.conversation import Conversation
from app.models.message import Message

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ---------- Pydantic schemas ----------

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    response: str
    conversation_id: str


class MessageRead(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    conversation_id: str
    messages: list[MessageRead]


# ---------- Helpers ----------

async def get_or_create_conversation(db: AsyncSession, user_id: str) -> Conversation:
    """Fetch the user's conversation or create one if it doesn't exist yet."""
    result = await db.execute(
        text("SELECT id, user_id, created_at FROM conversation WHERE user_id = :uid LIMIT 1"),
        {"uid": user_id},
    )
    row = result.first()
    if row:
        conv = Conversation(id=row.id, user_id=row.user_id, created_at=row.created_at)
        return conv

    # Create a new conversation
    conv_id = uuid.uuid4()
    now = datetime.utcnow()
    await db.execute(
        text(
            "INSERT INTO conversation (id, user_id, created_at) "
            "VALUES (:id, :uid, :now)"
        ),
        {"id": str(conv_id), "uid": user_id, "now": now},
    )
    await db.commit()
    return Conversation(id=conv_id, user_id=user_id, created_at=now)


async def load_messages(db: AsyncSession, conversation_id: uuid.UUID) -> list[Message]:
    """Load all messages for a conversation ordered by created_at, capped at 100."""
    result = await db.execute(
        text(
            "SELECT id, conversation_id, role, content, created_at "
            "FROM message "
            "WHERE conversation_id = :cid "
            "ORDER BY created_at ASC "
            "LIMIT 100"
        ),
        {"cid": str(conversation_id)},
    )
    rows = result.fetchall()
    return [
        Message(
            id=row.id,
            conversation_id=row.conversation_id,
            role=row.role,
            content=row.content,
            created_at=row.created_at,
        )
        for row in rows
    ]


async def save_message(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    role: str,
    content: str,
) -> None:
    """Persist a single message to the database."""
    msg_id = uuid.uuid4()
    now = datetime.utcnow()
    await db.execute(
        text(
            "INSERT INTO message (id, conversation_id, role, content, created_at) "
            "VALUES (:id, :cid, :role, :content, :now)"
        ),
        {
            "id": str(msg_id),
            "cid": str(conversation_id),
            "role": role,
            "content": content,
            "now": now,
        },
    )
    await db.commit()


# ---------- Endpoints ----------

@router.post("/", response_model=ChatResponse)
async def post_chat(
    body: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """
    Stateless chat endpoint.

    Flow:
    1. Verify JWT → extract user_id
    2. Fetch or create conversation
    3. Load message history (user + assistant messages)
    4. Run agent with history + new message
    5. Save user message and assistant response to DB
    6. Return response (agent state discarded)
    """
    # 1. Fetch or create conversation
    conversation = await get_or_create_conversation(db, user_id)

    # 2. Load history — only user and assistant roles for agent input
    messages = await load_messages(db, conversation.id)
    history = [
        {"role": m.role, "content": m.content}
        for m in messages
        if m.role in ("user", "assistant")
    ]

    # 3. Run agent
    try:
        response_text = await run_agent(user_id, history, body.message)
    except Exception as e:
        print(f"[CHAT] Agent error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Agent error",
        )

    # 4. Persist user message and assistant response
    await save_message(db, conversation.id, "user", body.message)
    await save_message(db, conversation.id, "assistant", response_text)

    return ChatResponse(
        response=response_text,
        conversation_id=str(conversation.id),
    )


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_session),
):
    """
    Return the user's conversation history (user + assistant messages only).
    Returns empty list if no conversation exists yet.
    """
    conversation = await get_or_create_conversation(db, user_id)
    messages = await load_messages(db, conversation.id)

    # Filter to user-visible roles only
    visible = [m for m in messages if m.role in ("user", "assistant")]

    return HistoryResponse(
        conversation_id=str(conversation.id),
        messages=[
            MessageRead(
                id=str(m.id),
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in visible
        ],
    )
