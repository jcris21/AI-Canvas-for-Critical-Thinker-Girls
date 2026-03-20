from pydantic import BaseModel


class HistoryMessage(BaseModel):
    role: str  # "user" | "model"
    text: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: list[HistoryMessage] = []
    canvas_image_base64: str | None = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
