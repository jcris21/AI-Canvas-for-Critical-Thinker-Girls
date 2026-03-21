from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import TenantScopedModel


class User(TenantScopedModel):
    """Local user profile — identity is owned by Clerk."""
    __tablename__ = "users"

    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
