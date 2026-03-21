import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.canvas import CanvasScene
from app.repositories.base import BaseRepository


class CanvasService:
    def __init__(self, db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.repo = BaseRepository(CanvasScene, db, tenant_id)

    async def get_scene(self, assigned_mission_id: uuid.UUID) -> CanvasScene | None:
        result = await self.db.execute(
            select(CanvasScene)
            .where(
                CanvasScene.assigned_mission_id == assigned_mission_id,
                CanvasScene.tenant_id == self.tenant_id,
            )
            .options(selectinload(CanvasScene.objects))
        )
        return result.scalar_one_or_none()

    async def update_snapshot(self, scene_id: uuid.UUID, snapshot: dict[str, Any]) -> CanvasScene | None:
        scene = await self.repo.get(scene_id)
        if not scene:
            return None
        return await self.repo.update(scene, snapshot=snapshot)
