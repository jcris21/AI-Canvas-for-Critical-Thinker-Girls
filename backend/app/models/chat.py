import uuid
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TenantScopedModel


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatSession(TenantScopedModel):
    __tablename__ = "chat_sessions"

    assigned_mission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assigned_missions.id", ondelete="CASCADE"), nullable=False
    )
    student_clerk_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at"
    )


class ChatMessage(TenantScopedModel):
    __tablename__ = "chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[MessageRole] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
