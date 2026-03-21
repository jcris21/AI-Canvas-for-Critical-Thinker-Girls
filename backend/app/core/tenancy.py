"""Tenant context resolution and enforcement."""
from contextvars import ContextVar
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user_id

_tenant_ctx: ContextVar[UUID | None] = ContextVar("tenant_id", default=None)


def get_tenant_id() -> UUID:
    tenant_id = _tenant_ctx.get()
    if tenant_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context not set")
    return tenant_id


async def resolve_tenant(
    x_tenant_id: str = Header(..., alias="X-Tenant-Id"),
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> UUID:
    """Validate that the requesting user belongs to the tenant in the header."""
    from app.models.user import User
    from app.models.tenant import UserTenant

    try:
        tenant_uuid = UUID(x_tenant_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tenant ID format: '{x_tenant_id}' is not a valid UUID",
        )

    token = _tenant_ctx.set(tenant_uuid)
    try:
        result = await db.execute(
            select(UserTenant).where(
                UserTenant.tenant_id == tenant_uuid,
                UserTenant.clerk_user_id == clerk_user_id,
            )
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not belong to this tenant")

        return tenant_uuid
    finally:
        _tenant_ctx.reset(token)
