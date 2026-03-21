import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatMessage, ChatSession, MessageRole
from app.repositories.base import BaseRepository


class ChatService:
    def __init__(self, db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.session_repo = BaseRepository(ChatSession, db, tenant_id)

    async def get_or_create_session(
        self, assigned_mission_id: uuid.UUID, student_clerk_id: str
    ) -> ChatSession:
        existing = await self.session_repo.list(assigned_mission_id=assigned_mission_id)
        if existing:
            return existing[0]
        return await self.session_repo.create(
            assigned_mission_id=assigned_mission_id,
            student_clerk_id=student_clerk_id,
        )

    async def add_message(
        self, session_id: uuid.UUID, role: MessageRole, content: str
    ) -> ChatMessage:
        message = ChatMessage(
            tenant_id=self.tenant_id,
            session_id=session_id,
            role=role,
            content=content,
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_session_with_messages(self, session_id: uuid.UUID) -> ChatSession | None:
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.tenant_id == self.tenant_id)
            .options(selectinload(ChatSession.messages))
        )
        return result.scalar_one_or_none()
