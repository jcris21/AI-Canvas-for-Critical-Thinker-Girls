import uuid
from datetime import datetime

from app.models.chat import MessageRole
from app.schemas.common import BaseResponse, BaseSchema


class SendMessageRequest(BaseSchema):
    content: str


class ChatMessageResponse(BaseSchema):
    id: uuid.UUID
    role: MessageRole
    content: str
    created_at: datetime


class ChatSessionResponse(BaseResponse):
    assigned_mission_id: uuid.UUID
    student_clerk_id: str
    messages: list[ChatMessageResponse] = []
