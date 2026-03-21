"""Tests for app.modules.files.service — FileService GCS signed URL generation."""
import uuid
import datetime
from unittest.mock import MagicMock, patch

import pytest


TENANT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
LESSON_ID = str(uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"))


def _make_upload_request(
    filename: str = "diagram.png",
    asset_type_str: str = "image",
    lesson_id: str = LESSON_ID,
):
    """Build an UploadUrlRequest with the given values."""
    from app.models.lesson import AssetType
    from app.modules.files.schemas import UploadUrlRequest

    return UploadUrlRequest(
        filename=filename,
        asset_type=AssetType(asset_type_str),
        lesson_id=lesson_id,
    )


def _make_file_service():
    """Return a FileService with a fully mocked GCS client."""
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_blob.generate_signed_url.return_value = "https://storage.googleapis.com/signed-url"

    mock_gcs_client = MagicMock()
    mock_gcs_client.bucket.return_value = mock_bucket

    with (
        patch("app.modules.files.service._get_gcs_client", return_value=mock_gcs_client),
        patch("app.modules.files.service.settings") as mock_settings,
    ):
        mock_settings.GCS_BUCKET_NAME = "test-bucket"
        from app.modules.files.service import FileService
        svc = FileService()
        svc.bucket = mock_bucket
        return svc, mock_bucket, mock_blob


# ---------------------------------------------------------------------------
# FileService.generate_upload_url()
# ---------------------------------------------------------------------------

class TestGenerateUploadUrl:
    @pytest.mark.asyncio
    async def test_returns_upload_url_and_gcs_path(self):
        """Happy path: must return both upload_url and gcs_path."""
        svc, mock_bucket, mock_blob = _make_file_service()
        mock_blob.generate_signed_url.return_value = "https://storage.example.com/signed"

        req = _make_upload_request()
        result = await svc.generate_upload_url(TENANT_ID, req)

        assert result.upload_url == "https://storage.example.com/signed"
        assert result.gcs_path != ""

    @pytest.mark.asyncio
    async def test_gcs_path_contains_tenant_id(self):
        """The generated GCS path must include the tenant ID for isolation."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request()
        result = await svc.generate_upload_url(TENANT_ID, req)

        assert str(TENANT_ID) in result.gcs_path

    @pytest.mark.asyncio
    async def test_gcs_path_contains_lesson_id(self):
        """The generated GCS path must include the lesson ID."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request(lesson_id=LESSON_ID)
        result = await svc.generate_upload_url(TENANT_ID, req)

        assert LESSON_ID in result.gcs_path

    @pytest.mark.asyncio
    async def test_gcs_path_contains_asset_type(self):
        """The generated GCS path must include the asset_type subdirectory."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request(asset_type_str="pdf")
        result = await svc.generate_upload_url(TENANT_ID, req)

        assert "pdf" in result.gcs_path

    @pytest.mark.asyncio
    async def test_special_characters_in_filename_are_sanitized(self):
        """Unsafe characters in the filename must be replaced with underscores."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request(filename="my file (v2)!.png")
        result = await svc.generate_upload_url(TENANT_ID, req)

        # The GCS path must not contain spaces or parentheses
        safe_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-/")
        filename_part = result.gcs_path.split("/")[-1]
        for ch in filename_part:
            assert ch in safe_chars, f"Unsafe character '{ch}' found in GCS path filename"

    @pytest.mark.asyncio
    async def test_signed_url_expiration_is_15_minutes(self):
        """The signed URL must be generated with a 15-minute expiration."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request()
        await svc.generate_upload_url(TENANT_ID, req)

        call_kwargs = mock_blob.generate_signed_url.call_args.kwargs
        assert call_kwargs["expiration"] == datetime.timedelta(minutes=15)

    @pytest.mark.asyncio
    async def test_signed_url_method_is_put(self):
        """The signed URL must specify the PUT HTTP method."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request()
        await svc.generate_upload_url(TENANT_ID, req)

        call_kwargs = mock_blob.generate_signed_url.call_args.kwargs
        assert call_kwargs["method"] == "PUT"

    @pytest.mark.asyncio
    async def test_signed_url_version_is_v4(self):
        """The signed URL must use v4 signing."""
        svc, mock_bucket, mock_blob = _make_file_service()

        req = _make_upload_request()
        await svc.generate_upload_url(TENANT_ID, req)

        call_kwargs = mock_blob.generate_signed_url.call_args.kwargs
        assert call_kwargs["version"] == "v4"

    @pytest.mark.asyncio
    async def test_different_tenant_ids_produce_different_paths(self):
        """Two different tenants must never share the same GCS path prefix."""
        svc, mock_bucket, mock_blob = _make_file_service()

        tenant_a = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        tenant_b = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")

        req = _make_upload_request()

        result_a = await svc.generate_upload_url(tenant_a, req)
        result_b = await svc.generate_upload_url(tenant_b, req)

        assert result_a.gcs_path != result_b.gcs_path


# ---------------------------------------------------------------------------
# GCS client singleton
# ---------------------------------------------------------------------------

class TestGCSClientSingleton:
    def test_get_gcs_client_returns_same_instance_on_repeated_calls(self):
        """_get_gcs_client() must return the same object on repeated calls (singleton)."""
        from app.modules.files import service as file_service_module

        # Reset the singleton before testing
        original = file_service_module._gcs_client
        file_service_module._gcs_client = None

        try:
            mock_storage_client = MagicMock()
            with patch("app.modules.files.service.storage.Client", return_value=mock_storage_client):
                client1 = file_service_module._get_gcs_client()
                client2 = file_service_module._get_gcs_client()

            assert client1 is client2
        finally:
            file_service_module._gcs_client = original

    def test_get_gcs_client_instantiates_storage_client_once(self):
        """storage.Client() must be called exactly once even across multiple _get_gcs_client() calls."""
        from app.modules.files import service as file_service_module

        original = file_service_module._gcs_client
        file_service_module._gcs_client = None

        try:
            mock_storage_client = MagicMock()
            with patch("app.modules.files.service.storage.Client", return_value=mock_storage_client) as mock_cls:
                file_service_module._get_gcs_client()
                file_service_module._get_gcs_client()
                file_service_module._get_gcs_client()

            mock_cls.assert_called_once()
        finally:
            file_service_module._gcs_client = original
