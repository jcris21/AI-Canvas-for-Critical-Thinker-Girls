from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/missions", tags=["missions"])


@router.post("")
async def create_mission(current_user: dict = Depends(get_current_user)):
    # TODO: implement
    return {"status": "not implemented"}


@router.post("/{mission_id}/assign")
async def assign_mission(mission_id: str, current_user: dict = Depends(get_current_user)):
    # TODO: implement
    return {"status": "not implemented"}
