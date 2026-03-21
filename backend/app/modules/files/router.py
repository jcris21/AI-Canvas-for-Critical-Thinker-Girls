import uuid

from fastapi import APIRouter, Depends

from app.core.tenancy import resolve_tenant
from app.modules.files.schemas import UploadUrlRequest, UploadUrlResponse
from app.modules.files.service import FileService

router = APIRouter()


@router.post("/upload-url", response_model=UploadUrlResponse)
async def get_upload_url(
    body: UploadUrlRequest,
    tenant_id: uuid.UUID = Depends(resolve_tenant),
) -> UploadUrlResponse:
    svc = FileService()
    return await svc.generate_upload_url(tenant_id, body)
