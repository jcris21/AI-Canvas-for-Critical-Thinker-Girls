from app.models.lesson import AssetType
from app.schemas.common import BaseSchema


class UploadUrlRequest(BaseSchema):
    filename: str
    asset_type: AssetType
    lesson_id: str


class UploadUrlResponse(BaseSchema):
    upload_url: str   # GCS signed URL for PUT
    gcs_path: str     # path to store in DB after upload
