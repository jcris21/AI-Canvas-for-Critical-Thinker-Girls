"""Generic async repository with tenant isolation enforced by default."""
import uuid
from typing import Any, Generic, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import TenantScopedModel

ModelT = TypeVar("ModelT", bound=TenantScopedModel)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT], db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.model = model
        self.db = db
        self.tenant_id = tenant_id

    def _base_query(self):
        return select(self.model).where(self.model.tenant_id == self.tenant_id)

    async def get(self, id: uuid.UUID) -> ModelT | None:
        result = await self.db.execute(
            self._base_query().where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def list(self, **filters: Any) -> list[ModelT]:
        query = self._base_query()
        for field, value in filters.items():
            if not hasattr(self.model, field):
                raise ValueError(f"Invalid filter field '{field}' for model {self.model.__name__}")
            query = query.where(getattr(self.model, field) == value)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs: Any) -> ModelT:
        instance = self.model(tenant_id=self.tenant_id, **kwargs)
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def update(self, instance: ModelT, **kwargs: Any) -> ModelT:
        # SQLAlchemy tracks changes via instrumented attributes on ORM-managed objects.
        # Setting attributes directly on a mapped instance is the correct ORM mutation
        # pattern; SQLAlchemy will emit the appropriate UPDATE on flush().
        for field, value in kwargs.items():
            setattr(instance, field, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        await self.db.delete(instance)
        await self.db.flush()
