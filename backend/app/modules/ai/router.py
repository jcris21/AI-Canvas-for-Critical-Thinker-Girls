from fastapi import APIRouter, Depends

from app.modules.ai.schemas import ChatRequest, ChatResponse
from app.modules.ai.service import AIService

router = APIRouter()


def get_ai_service() -> AIService:
    return AIService()


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(body: ChatRequest, svc: AIService = Depends(get_ai_service)) -> ChatResponse:
    """Direct AI endpoint. Accepts conversation history and optional canvas image."""
    history = [{"role": msg.role, "text": msg.text} for msg in body.history]
    reply = await svc.chat(
        history=history,
        new_message=body.message,
        canvas_image_base64=body.canvas_image_base64,
        system_instruction=body.system_instruction,
    )
    return ChatResponse(reply=reply)
