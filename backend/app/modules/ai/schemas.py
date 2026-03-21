from typing import Literal

from app.schemas.common import BaseSchema


class HistoryMessage(BaseSchema):
    role: Literal["user", "model"]
    text: str


class ChatRequest(BaseSchema):
    session_id: str
    message: str
    history: list[HistoryMessage] = []
    canvas_image_base64: str | None = None
    system_instruction: str | None = None


class ChatResponse(BaseSchema):
    reply: str
