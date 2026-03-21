import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.models.lesson import Lesson, LessonCard
from app.modules.lessons.schemas import LessonCreate
from app.repositories.base import BaseRepository


class LessonService:
    def __init__(self, db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.repo = BaseRepository(Lesson, db, tenant_id)

    async def create(self, data: LessonCreate, creator_clerk_id: str) -> Lesson:
        lesson = await self.repo.create(
            title=data.title,
            description=data.description,
            created_by=creator_clerk_id,
        )
        for card_data in data.cards:
            card = LessonCard(
                tenant_id=self.tenant_id,
                lesson_id=lesson.id,
                **card_data.model_dump(),
            )
            self.db.add(card)
        await self.db.flush()
        await self.db.refresh(lesson)
        return lesson

    async def get_with_relations(self, lesson_id: uuid.UUID) -> Lesson | None:
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_id, Lesson.tenant_id == self.tenant_id)
            .options(selectinload(Lesson.cards), selectinload(Lesson.assets))
        )
        return result.scalar_one_or_none()
