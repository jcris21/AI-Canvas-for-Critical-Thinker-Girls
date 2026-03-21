import uuid

from app.models.mission import MissionStatus
from app.schemas.common import BaseResponse, BaseSchema


class MissionTemplateCreate(BaseSchema):
    lesson_id: uuid.UUID
    title: str
    ai_instruction: str


class MissionTemplateResponse(BaseResponse):
    lesson_id: uuid.UUID
    title: str
    ai_instruction: str


class AssignMissionRequest(BaseSchema):
    student_clerk_id: str


class AssignedMissionResponse(BaseResponse):
    template_id: uuid.UUID
    student_clerk_id: str
    status: MissionStatus
