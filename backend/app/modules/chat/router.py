from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, current_user: dict = Depends(get_current_user)):
    # TODO: implement — persist message + call AI service
    return {"status": "not implemented"}
