import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user_id
from app.core.tenancy import resolve_tenant
from app.modules.users.schemas import UserResponse, UserUpdate
from app.modules.users.service import UserService

router = APIRouter()


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    svc = UserService(db, tenant_id)
    user = await svc.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    svc = UserService(db, tenant_id)
    user = await svc.update(user_id, body)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.model_validate(user)
