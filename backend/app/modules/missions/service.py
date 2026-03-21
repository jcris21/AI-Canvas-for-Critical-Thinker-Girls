import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mission import AssignedMission, MissionTemplate
from app.modules.missions.schemas import AssignMissionRequest, MissionTemplateCreate
from app.repositories.base import BaseRepository


class MissionService:
    def __init__(self, db: AsyncSession, tenant_id: uuid.UUID) -> None:
        self.db = db
        self.tenant_id = tenant_id
        self.template_repo = BaseRepository(MissionTemplate, db, tenant_id)
        self.assignment_repo = BaseRepository(AssignedMission, db, tenant_id)

    async def create_template(self, data: MissionTemplateCreate) -> MissionTemplate:
        return await self.template_repo.create(**data.model_dump())

    async def assign(self, template_id: uuid.UUID, data: AssignMissionRequest) -> AssignedMission:
        return await self.assignment_repo.create(
            template_id=template_id,
            student_clerk_id=data.student_clerk_id,
        )

    async def get_assigned(self, assignment_id: uuid.UUID) -> AssignedMission | None:
        return await self.assignment_repo.get(assignment_id)
