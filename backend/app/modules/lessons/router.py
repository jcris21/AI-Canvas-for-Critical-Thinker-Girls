from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.post("")
async def create_lesson(current_user: dict = Depends(get_current_user)):
    # TODO: implement
    return {"status": "not implemented"}


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str, current_user: dict = Depends(get_current_user)):
    # TODO: implement
    return {"status": "not implemented"}
