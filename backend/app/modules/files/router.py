from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload-url")
async def get_upload_url(current_user: dict = Depends(get_current_user)):
    # TODO: generate signed GCS URL
    return {"status": "not implemented"}
