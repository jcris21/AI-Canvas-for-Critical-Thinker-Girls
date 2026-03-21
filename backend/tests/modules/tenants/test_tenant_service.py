"""Tests for app.modules.tenants.service — TenantService."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException


TENANT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CLERK_CREATOR = "user_creator_111"
CLERK_MEMBER = "user_member_222"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_scalar_result(value):
    """Return a mock execute() result whose .scalar_one_or_none() returns *value*."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


def _make_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    return db


def _make_service(db):
    from app.modules.tenants.service import TenantService
    return TenantService(db)


def _make_tenant_create(name: str = "Escuela WonderBot", slug: str = "escuela-wonderbot"):
    from app.modules.tenants.schemas import TenantCreate
    return TenantCreate(name=name, slug=slug)


def _make_add_member_request(clerk_user_id: str = CLERK_MEMBER, role: str = "student"):
    from app.modules.tenants.schemas import AddMemberRequest
    from app.models.tenant import TenantRole
    return AddMemberRequest(clerk_user_id=clerk_user_id, role=TenantRole(role))


# ---------------------------------------------------------------------------
# TenantService.create()
# ---------------------------------------------------------------------------

class TestTenantServiceCreate:
    @pytest.mark.asyncio
    async def test_create_adds_tenant_and_creator_membership(self):
        """create() must add() both the Tenant and a UserTenant membership."""
        db = _make_db()

        fake_tenant = MagicMock()
        fake_tenant.id = TENANT_ID

        async def _fake_refresh(obj):
            if isinstance(obj, type(fake_tenant)):
                pass

        db.refresh.side_effect = _fake_refresh

        # First add() call is the Tenant, second is UserTenant
        svc = _make_service(db)

        with (
            patch("app.modules.tenants.service.Tenant") as mock_tenant_cls,
            patch("app.modules.tenants.service.UserTenant") as mock_user_tenant_cls,
        ):
            mock_tenant_instance = MagicMock()
            mock_tenant_instance.id = TENANT_ID
            mock_tenant_cls.return_value = mock_tenant_instance

            mock_membership = MagicMock()
            mock_user_tenant_cls.return_value = mock_membership

            result = await svc.create(_make_tenant_create(), CLERK_CREATOR)

        assert db.add.call_count == 2
        assert db.flush.call_count == 2

    @pytest.mark.asyncio
    async def test_create_assigns_admin_role_to_creator(self):
        """The creator's membership must have ADMIN role."""
        from app.models.tenant import TenantRole

        db = _make_db()

        async def _fake_refresh(obj):
            pass

        db.refresh.side_effect = _fake_refresh

        svc = _make_service(db)

        with (
            patch("app.modules.tenants.service.Tenant") as mock_tenant_cls,
            patch("app.modules.tenants.service.UserTenant") as mock_user_tenant_cls,
        ):
            mock_tenant_instance = MagicMock()
            mock_tenant_instance.id = TENANT_ID
            mock_tenant_cls.return_value = mock_tenant_instance

            mock_membership = MagicMock()
            mock_user_tenant_cls.return_value = mock_membership

            await svc.create(_make_tenant_create(), CLERK_CREATOR)

        # Verify UserTenant was created with role=ADMIN
        call_kwargs = mock_user_tenant_cls.call_args.kwargs
        assert call_kwargs["role"] == TenantRole.ADMIN

    @pytest.mark.asyncio
    async def test_create_returns_tenant_instance(self):
        """create() must return the Tenant ORM instance."""
        db = _make_db()

        async def _fake_refresh(obj):
            pass

        db.refresh.side_effect = _fake_refresh

        svc = _make_service(db)

        with (
            patch("app.modules.tenants.service.Tenant") as mock_tenant_cls,
            patch("app.modules.tenants.service.UserTenant"),
        ):
            mock_tenant_instance = MagicMock()
            mock_tenant_instance.id = TENANT_ID
            mock_tenant_cls.return_value = mock_tenant_instance

            result = await svc.create(_make_tenant_create(), CLERK_CREATOR)

        assert result is mock_tenant_instance


# ---------------------------------------------------------------------------
# TenantService.add_member()
# ---------------------------------------------------------------------------

class TestTenantServiceAddMember:
    @pytest.mark.asyncio
    async def test_add_member_happy_path_returns_membership(self):
        """add_member() must return the new UserTenant when tenant exists and user is new."""
        db = _make_db()

        fake_tenant = MagicMock()
        # First execute call: tenant exists; second: no existing membership
        db.execute.side_effect = [
            _make_scalar_result(fake_tenant),   # tenant found
            _make_scalar_result(None),           # no duplicate
        ]

        svc = _make_service(db)

        with patch("app.modules.tenants.service.UserTenant") as mock_user_tenant_cls:
            mock_membership = MagicMock()
            mock_user_tenant_cls.return_value = mock_membership

            result = await svc.add_member(TENANT_ID, _make_add_member_request())

        assert result is mock_membership
        db.add.assert_called_once()
        db.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_member_raises_404_when_tenant_not_found(self):
        """add_member() must raise HTTP 404 when the tenant does not exist."""
        db = _make_db()
        db.execute.return_value = _make_scalar_result(None)  # tenant not found

        svc = _make_service(db)

        with pytest.raises(HTTPException) as exc_info:
            await svc.add_member(TENANT_ID, _make_add_member_request())

        assert exc_info.value.status_code == 404
        assert "not found" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_add_member_raises_409_on_duplicate_membership(self):
        """add_member() must raise HTTP 409 when the user is already a member."""
        db = _make_db()

        fake_tenant = MagicMock()
        existing_membership = MagicMock()

        db.execute.side_effect = [
            _make_scalar_result(fake_tenant),         # tenant found
            _make_scalar_result(existing_membership),  # duplicate exists
        ]

        svc = _make_service(db)

        with pytest.raises(HTTPException) as exc_info:
            await svc.add_member(TENANT_ID, _make_add_member_request())

        assert exc_info.value.status_code == 409
        assert "already a member" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_add_member_does_not_call_db_add_on_404(self):
        """When the tenant is not found, db.add() must never be called."""
        db = _make_db()
        db.execute.return_value = _make_scalar_result(None)

        svc = _make_service(db)

        with pytest.raises(HTTPException):
            await svc.add_member(TENANT_ID, _make_add_member_request())

        db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_add_member_does_not_call_db_add_on_409(self):
        """When a duplicate is detected, db.add() must never be called."""
        db = _make_db()

        fake_tenant = MagicMock()
        existing_membership = MagicMock()

        db.execute.side_effect = [
            _make_scalar_result(fake_tenant),
            _make_scalar_result(existing_membership),
        ]

        svc = _make_service(db)

        with pytest.raises(HTTPException):
            await svc.add_member(TENANT_ID, _make_add_member_request())

        db.add.assert_not_called()


# ---------------------------------------------------------------------------
# TenantService.get_by_slug()
# ---------------------------------------------------------------------------

class TestTenantServiceGetBySlug:
    @pytest.mark.asyncio
    async def test_get_by_slug_returns_tenant_when_found(self):
        """get_by_slug() returns the Tenant when a matching slug exists."""
        db = _make_db()
        fake_tenant = MagicMock()
        fake_tenant.slug = "my-school"
        db.execute.return_value = _make_scalar_result(fake_tenant)

        svc = _make_service(db)
        result = await svc.get_by_slug("my-school")

        assert result is fake_tenant

    @pytest.mark.asyncio
    async def test_get_by_slug_returns_none_when_not_found(self):
        """get_by_slug() returns None when no matching tenant exists."""
        db = _make_db()
        db.execute.return_value = _make_scalar_result(None)

        svc = _make_service(db)
        result = await svc.get_by_slug("nonexistent-slug")

        assert result is None
