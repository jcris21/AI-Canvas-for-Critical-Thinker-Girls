import uuid
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TenantScopedModel


class MissionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MissionTemplate(TenantScopedModel):
    """Created by teacher. Defines the AI instruction and links to a lesson."""
    __tablename__ = "mission_templates"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    ai_instruction: Mapped[str] = mapped_column(Text, nullable=False)  # Socratic prompt

    assignments: Mapped[list["AssignedMission"]] = relationship(
        back_populates="template", cascade="all, delete-orphan"
    )


class AssignedMission(TenantScopedModel):
    """One instance of a MissionTemplate assigned to a specific student."""
    __tablename__ = "assigned_missions"

    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mission_templates.id", ondelete="CASCADE"), nullable=False
    )
    student_clerk_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[MissionStatus] = mapped_column(
        String(50), nullable=False, default=MissionStatus.PENDING
    )

    template: Mapped["MissionTemplate"] = relationship(back_populates="assignments")
