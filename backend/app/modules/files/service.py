"""Google Cloud Storage signed URL generation."""
import datetime
import re
import uuid

from google.cloud import storage

from app.core.config import settings
from app.modules.files.schemas import UploadUrlRequest, UploadUrlResponse

# Module-level singleton — GCS client initialization is expensive and not request-specific.
_gcs_client: storage.Client | None = None


def _get_gcs_client() -> storage.Client:
    global _gcs_client
    if _gcs_client is None:
        _gcs_client = storage.Client()
    return _gcs_client


class FileService:
    def __init__(self) -> None:
        self.bucket = _get_gcs_client().bucket(settings.GCS_BUCKET_NAME)

    # Note: this method is async for interface consistency with other service methods,
    # even though the GCS signed URL generation is synchronous (no I/O awaited here).
    async def generate_upload_url(
        self, tenant_id: uuid.UUID, data: UploadUrlRequest
    ) -> UploadUrlResponse:
        safe_filename = re.sub(r"[^a-zA-Z0-9._-]", "_", data.filename)
        gcs_path = f"tenants/{tenant_id}/lessons/{data.lesson_id}/{data.asset_type}/{safe_filename}"
        blob = self.bucket.blob(gcs_path)

        upload_url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=15),
            method="PUT",
            content_type="application/octet-stream",
        )
        return UploadUrlResponse(upload_url=upload_url, gcs_path=gcs_path)
