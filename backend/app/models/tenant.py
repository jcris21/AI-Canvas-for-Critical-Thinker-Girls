import uuid
from enum import Enum

from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TimestampMixin
from app.core.db import Base


class TenantRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    PARENT = "parent"
    STUDENT = "student"


class Tenant(BaseModel):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    users: Mapped[list["UserTenant"]] = relationship(back_populates="tenant")


class UserTenant(TimestampMixin, Base):
    """Many-to-many: User ↔ Tenant with role."""
    __tablename__ = "user_tenants"

    clerk_user_id: Mapped[str] = mapped_column(String(255), primary_key=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[TenantRole] = mapped_column(String(50), nullable=False, default=TenantRole.STUDENT)

    tenant: Mapped["Tenant"] = relationship(back_populates="users")
