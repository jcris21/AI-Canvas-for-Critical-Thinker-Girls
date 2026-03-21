import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TenantScopedModel


class CanvasScene(TenantScopedModel):
    __tablename__ = "canvas_scenes"

    assigned_mission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assigned_missions.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    # Fabric.js JSON snapshot for fast full restore
    snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    objects: Mapped[list["CanvasObject"]] = relationship(
        back_populates="scene", cascade="all, delete-orphan"
    )


class CanvasObject(TenantScopedModel):
    """Individual object on the canvas (image, text, etc.)."""
    __tablename__ = "canvas_objects"

    scene_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("canvas_scenes.id", ondelete="CASCADE"), nullable=False
    )
    object_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "image", "text"
    fabric_data: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Fabric.js object JSON

    draggable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deletable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    scene: Mapped["CanvasScene"] = relationship(back_populates="objects")
