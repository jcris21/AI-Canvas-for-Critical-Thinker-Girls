from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.modules.ai.schemas import ChatRequest, ChatResponse
from app.modules.ai.service import chat_with_gemini

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
) -> ChatResponse:
    reply = await chat_with_gemini(
        message=body.message,
        canvas_image_base64=body.canvas_image_base64,
    )
    return ChatResponse(reply=reply, session_id=body.session_id)
