from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant, TenantRole, UserTenant
from app.modules.tenants.schemas import AddMemberRequest, TenantCreate


class TenantService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: TenantCreate, creator_clerk_id: str) -> Tenant:
        tenant = Tenant(name=data.name, slug=data.slug)
        self.db.add(tenant)
        await self.db.flush()

        # Creator becomes admin automatically
        membership = UserTenant(
            clerk_user_id=creator_clerk_id,
            tenant_id=tenant.id,
            role=TenantRole.ADMIN,
        )
        self.db.add(membership)
        await self.db.flush()
        await self.db.refresh(tenant)
        return tenant

    async def add_member(self, tenant_id, data: AddMemberRequest) -> UserTenant:
        from fastapi import HTTPException, status

        # Verify the tenant exists before adding a member.
        tenant_result = await self.db.execute(
            select(Tenant).where(Tenant.id == tenant_id)
        )
        if tenant_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant '{tenant_id}' not found",
            )

        # Prevent duplicate membership.
        existing_result = await self.db.execute(
            select(UserTenant).where(
                UserTenant.tenant_id == tenant_id,
                UserTenant.clerk_user_id == data.clerk_user_id,
            )
        )
        if existing_result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already a member of this tenant",
            )

        membership = UserTenant(
            clerk_user_id=data.clerk_user_id,
            tenant_id=tenant_id,
            role=data.role,
        )
        self.db.add(membership)
        await self.db.flush()
        return membership

    async def get_by_slug(self, slug: str) -> Tenant | None:
        result = await self.db.execute(select(Tenant).where(Tenant.slug == slug))
        return result.scalar_one_or_none()
