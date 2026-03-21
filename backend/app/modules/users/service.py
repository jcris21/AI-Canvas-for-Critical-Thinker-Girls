import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.modules.users.schemas import UserCreate, UserUpdate
from app.repositories.base import BaseRepository


class UserService:
    def __init__(self, db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.repo = BaseRepository(User, db, tenant_id)

    async def get_or_create(self, data: UserCreate) -> User:
        existing = await self.repo.list(clerk_user_id=data.clerk_user_id)
        if existing:
            return existing[0]
        return await self.repo.create(**data.model_dump())

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.repo.get(user_id)

    async def update(self, user_id: uuid.UUID, data: UserUpdate) -> User | None:
        user = await self.repo.get(user_id)
        if not user:
            return None
        return await self.repo.update(user, **data.model_dump(exclude_none=True))
