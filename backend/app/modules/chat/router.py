import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user_id
from app.core.tenancy import resolve_tenant
from app.models.chat import MessageRole
from app.modules.ai.service import AIService
from app.modules.chat.schemas import ChatSessionResponse, SendMessageRequest
from app.modules.chat.service import ChatService

router = APIRouter()


@router.post("/sessions/{session_id}/messages", response_model=ChatSessionResponse)
async def send_message(
    session_id: uuid.UUID,
    body: SendMessageRequest,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionResponse:
    chat_svc = ChatService(db, tenant_id)
    session = await chat_svc.get_session_with_messages(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Persist user message
    await chat_svc.add_message(session_id, MessageRole.USER, body.content)

    # Get AI response
    ai_svc = AIService()
    history = [{"role": m.role, "content": m.content} for m in session.messages]
    ai_reply = await ai_svc.chat(history, body.content)

    # Persist assistant message
    await chat_svc.add_message(session_id, MessageRole.ASSISTANT, ai_reply)

    updated = await chat_svc.get_session_with_messages(session_id)
    return ChatSessionResponse.model_validate(updated)
