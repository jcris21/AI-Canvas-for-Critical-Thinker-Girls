from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/canvas", tags=["canvas"])


@router.get("/scenes/{scene_id}")
async def get_scene(scene_id: str, current_user: dict = Depends(get_current_user)):
    # TODO: implement
    return {"status": "not implemented"}


@router.patch("/scenes/{scene_id}")
async def update_scene(scene_id: str, current_user: dict = Depends(get_current_user)):
    # TODO: implement
    return {"status": "not implemented"}
