import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.tenancy import resolve_tenant
from app.modules.canvas.schemas import CanvasSceneResponse, CanvasSceneUpdate
from app.modules.canvas.service import CanvasService

router = APIRouter()


@router.get("/scenes/{assigned_mission_id}", response_model=CanvasSceneResponse)
async def get_scene(
    assigned_mission_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
) -> CanvasSceneResponse:
    svc = CanvasService(db, tenant_id)
    scene = await svc.get_scene(assigned_mission_id)
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Canvas scene not found")
    return CanvasSceneResponse.model_validate(scene)


@router.patch("/scenes/{scene_id}", response_model=CanvasSceneResponse)
async def update_scene(
    scene_id: uuid.UUID,
    body: CanvasSceneUpdate,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
) -> CanvasSceneResponse:
    svc = CanvasService(db, tenant_id)
    scene = await svc.update_snapshot(scene_id, body.snapshot or {})
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scene not found")
    return CanvasSceneResponse.model_validate(scene)
