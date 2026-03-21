from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user_id
from app.modules.tenants.schemas import AddMemberRequest, TenantCreate, TenantResponse
from app.modules.tenants.service import TenantService

router = APIRouter()


@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    body: TenantCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> TenantResponse:
    svc = TenantService(db)
    tenant = await svc.create(body, clerk_user_id)
    return TenantResponse.model_validate(tenant)


@router.post("/{tenant_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    tenant_id: str,
    body: AddMemberRequest,
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> dict:
    svc = TenantService(db)
    await svc.add_member(tenant_id, body)
    return {"detail": "Member added"}
