import uuid
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TenantScopedModel


class AssetType(str, Enum):
    IMAGE = "image"
    PDF = "pdf"
    VIDEO = "video"


class Lesson(TenantScopedModel):
    __tablename__ = "lessons"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)  # clerk_user_id

    cards: Mapped[list["LessonCard"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    assets: Mapped[list["LessonAsset"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")


class LessonCard(TenantScopedModel):
    __tablename__ = "lesson_cards"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(nullable=False, default=0)

    lesson: Mapped["Lesson"] = relationship(back_populates="cards")


class LessonAsset(TenantScopedModel):
    __tablename__ = "lesson_assets"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    asset_type: Mapped[AssetType] = mapped_column(String(50), nullable=False)
    gcs_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    lesson: Mapped["Lesson"] = relationship(back_populates="assets")
