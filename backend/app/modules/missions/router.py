import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.tenancy import resolve_tenant
from app.modules.missions.schemas import (
    AssignedMissionResponse,
    AssignMissionRequest,
    MissionTemplateCreate,
    MissionTemplateResponse,
)
from app.modules.missions.service import MissionService

router = APIRouter()


@router.post("", response_model=MissionTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_mission(
    body: MissionTemplateCreate,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
) -> MissionTemplateResponse:
    svc = MissionService(db, tenant_id)
    template = await svc.create_template(body)
    return MissionTemplateResponse.model_validate(template)


@router.post("/{template_id}/assign", response_model=AssignedMissionResponse, status_code=status.HTTP_201_CREATED)
async def assign_mission(
    template_id: uuid.UUID,
    body: AssignMissionRequest,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
) -> AssignedMissionResponse:
    svc = MissionService(db, tenant_id)
    assignment = await svc.assign(template_id, body)
    return AssignedMissionResponse.model_validate(assignment)
