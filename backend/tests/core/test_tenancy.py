"""Tests for app.core.tenancy — tenant context resolution and enforcement."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException


TENANT_UUID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CLERK_USER = "user_test_clerk_999"


def _make_scalar_result(value):
    """Return a mock whose .scalar_one_or_none() returns *value*."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


class TestGetTenantId:
    """Unit tests for the synchronous get_tenant_id() helper."""

    def test_returns_tenant_uuid_when_context_is_set(self):
        """get_tenant_id() returns the UUID that was stored in the ContextVar."""
        from app.core import tenancy

        token = tenancy._tenant_ctx.set(TENANT_UUID)
        try:
            result = tenancy.get_tenant_id()
            assert result == TENANT_UUID
        finally:
            tenancy._tenant_ctx.reset(token)

    def test_raises_400_when_context_is_not_set(self):
        """get_tenant_id() raises HTTP 400 if no tenant has been set."""
        from app.core import tenancy

        # Ensure the context var holds None
        token = tenancy._tenant_ctx.set(None)
        try:
            with pytest.raises(HTTPException) as exc_info:
                tenancy.get_tenant_id()
            assert exc_info.value.status_code == 400
            assert "Tenant context not set" in exc_info.value.detail
        finally:
            tenancy._tenant_ctx.reset(token)


class TestResolveTenant:
    """Tests for the async resolve_tenant() dependency."""

    @pytest.mark.asyncio
    async def test_valid_membership_returns_tenant_uuid(self):
        """Happy path: user is a member → resolve_tenant returns the UUID."""
        from app.core import tenancy

        mock_db = AsyncMock()
        fake_membership = MagicMock()
        mock_db.execute = AsyncMock(return_value=_make_scalar_result(fake_membership))

        result = await tenancy.resolve_tenant(
            x_tenant_id=str(TENANT_UUID),
            clerk_user_id=CLERK_USER,
            db=mock_db,
        )

        assert result == TENANT_UUID

    @pytest.mark.asyncio
    async def test_invalid_uuid_string_raises_400(self):
        """Non-UUID string in X-Tenant-Id header → HTTP 400."""
        from app.core import tenancy

        mock_db = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await tenancy.resolve_tenant(
                x_tenant_id="not-a-uuid",
                clerk_user_id=CLERK_USER,
                db=mock_db,
            )

        assert exc_info.value.status_code == 400
        assert "not a valid UUID" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_user_not_a_member_raises_403(self):
        """If the user has no membership in the tenant → HTTP 403."""
        from app.core import tenancy

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=_make_scalar_result(None))

        with pytest.raises(HTTPException) as exc_info:
            await tenancy.resolve_tenant(
                x_tenant_id=str(TENANT_UUID),
                clerk_user_id=CLERK_USER,
                db=mock_db,
            )

        assert exc_info.value.status_code == 403
        assert "does not belong to this tenant" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_tenant_context_is_cleared_after_successful_resolve(self):
        """ContextVar must be reset to its prior value after resolve_tenant returns.

        This prevents tenant context from leaking across requests when running
        under an async event loop that reuses OS threads.
        """
        from app.core import tenancy

        mock_db = AsyncMock()
        fake_membership = MagicMock()
        mock_db.execute = AsyncMock(return_value=_make_scalar_result(fake_membership))

        previous_value = tenancy._tenant_ctx.get()

        await tenancy.resolve_tenant(
            x_tenant_id=str(TENANT_UUID),
            clerk_user_id=CLERK_USER,
            db=mock_db,
        )

        # The context var should have been reset to whatever it was before
        assert tenancy._tenant_ctx.get() == previous_value

    @pytest.mark.asyncio
    async def test_tenant_context_is_cleared_after_403_error(self):
        """ContextVar must be reset even when a 403 exception is raised.

        The finally block in resolve_tenant guarantees cleanup on all paths.
        """
        from app.core import tenancy

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(return_value=_make_scalar_result(None))

        previous_value = tenancy._tenant_ctx.get()

        with pytest.raises(HTTPException):
            await tenancy.resolve_tenant(
                x_tenant_id=str(TENANT_UUID),
                clerk_user_id=CLERK_USER,
                db=mock_db,
            )

        # Context must be cleaned up even after an exception
        assert tenancy._tenant_ctx.get() == previous_value

    @pytest.mark.asyncio
    async def test_empty_string_tenant_id_raises_400(self):
        """Empty string in X-Tenant-Id header → HTTP 400 (invalid UUID)."""
        from app.core import tenancy

        mock_db = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await tenancy.resolve_tenant(
                x_tenant_id="",
                clerk_user_id=CLERK_USER,
                db=mock_db,
            )

        assert exc_info.value.status_code == 400
