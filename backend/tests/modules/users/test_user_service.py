"""Tests for app.modules.users.service — UserService."""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


TENANT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
USER_UUID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
CLERK_USER_ID = "user_clerk_abc"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    return db


def _make_user_create(
    clerk_user_id: str = CLERK_USER_ID,
    email: str = "alice@example.com",
    display_name: str | None = "Alice",
):
    from app.modules.users.schemas import UserCreate
    return UserCreate(
        clerk_user_id=clerk_user_id,
        email=email,
        display_name=display_name,
    )


def _make_user_update(display_name: str | None = None, avatar_url: str | None = None):
    from app.modules.users.schemas import UserUpdate
    return UserUpdate(display_name=display_name, avatar_url=avatar_url)


def _fake_user(
    clerk_user_id: str = CLERK_USER_ID,
    email: str = "alice@example.com",
    display_name: str = "Alice",
):
    user = MagicMock()
    user.id = USER_UUID
    user.tenant_id = TENANT_ID
    user.clerk_user_id = clerk_user_id
    user.email = email
    user.display_name = display_name
    user.avatar_url = None
    return user


# ---------------------------------------------------------------------------
# UserService.get_or_create()
# ---------------------------------------------------------------------------

class TestUserServiceGetOrCreate:
    @pytest.mark.asyncio
    async def test_returns_existing_user_when_already_present(self):
        """get_or_create() must return the first existing user when found."""
        db = _make_db()
        existing = _fake_user()

        mock_repo = AsyncMock()
        mock_repo.list = AsyncMock(return_value=[existing])

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.get_or_create(_make_user_create())

        assert result is existing
        mock_repo.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_creates_new_user_when_not_found(self):
        """get_or_create() must call repo.create() when no existing user is found."""
        db = _make_db()
        new_user = _fake_user()

        mock_repo = AsyncMock()
        mock_repo.list = AsyncMock(return_value=[])
        mock_repo.create = AsyncMock(return_value=new_user)

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.get_or_create(_make_user_create())

        assert result is new_user
        mock_repo.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_or_create_passes_clerk_user_id_as_filter(self):
        """get_or_create() must filter by clerk_user_id when checking for existence."""
        db = _make_db()
        existing = _fake_user()

        mock_repo = AsyncMock()
        mock_repo.list = AsyncMock(return_value=[existing])

        data = _make_user_create(clerk_user_id="user_xyz")

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            await svc.get_or_create(data)

        mock_repo.list.assert_called_once_with(clerk_user_id="user_xyz")

    @pytest.mark.asyncio
    async def test_create_is_called_with_all_fields(self):
        """repo.create() must receive all fields from UserCreate when creating."""
        db = _make_db()
        new_user = _fake_user()

        mock_repo = AsyncMock()
        mock_repo.list = AsyncMock(return_value=[])
        mock_repo.create = AsyncMock(return_value=new_user)

        data = _make_user_create(
            clerk_user_id="user_new",
            email="bob@example.com",
            display_name="Bob",
        )

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            await svc.get_or_create(data)

        call_kwargs = mock_repo.create.call_args.kwargs
        assert call_kwargs["clerk_user_id"] == "user_new"
        assert call_kwargs["email"] == "bob@example.com"


# ---------------------------------------------------------------------------
# UserService.get_by_id()
# ---------------------------------------------------------------------------

class TestUserServiceGetById:
    @pytest.mark.asyncio
    async def test_returns_user_when_found(self):
        """get_by_id() must return the user when it exists."""
        db = _make_db()
        user = _fake_user()

        mock_repo = AsyncMock()
        mock_repo.get = AsyncMock(return_value=user)

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.get_by_id(USER_UUID)

        assert result is user

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        """get_by_id() must return None when no user with the given ID exists."""
        db = _make_db()

        mock_repo = AsyncMock()
        mock_repo.get = AsyncMock(return_value=None)

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.get_by_id(USER_UUID)

        assert result is None


# ---------------------------------------------------------------------------
# UserService.update()
# ---------------------------------------------------------------------------

class TestUserServiceUpdate:
    @pytest.mark.asyncio
    async def test_update_returns_updated_user(self):
        """update() must return the updated user instance."""
        db = _make_db()
        user = _fake_user()
        updated = _fake_user(display_name="Alice Updated")

        mock_repo = AsyncMock()
        mock_repo.get = AsyncMock(return_value=user)
        mock_repo.update = AsyncMock(return_value=updated)

        data = _make_user_update(display_name="Alice Updated")

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.update(USER_UUID, data)

        assert result is updated

    @pytest.mark.asyncio
    async def test_update_returns_none_when_user_not_found(self):
        """update() must return None when the user does not exist."""
        db = _make_db()

        mock_repo = AsyncMock()
        mock_repo.get = AsyncMock(return_value=None)

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.update(USER_UUID, _make_user_update(display_name="X"))

        assert result is None
        mock_repo.update.assert_not_called()

    @pytest.mark.asyncio
    async def test_update_excludes_none_values(self):
        """update() must pass only non-None fields to repo.update()."""
        db = _make_db()
        user = _fake_user()
        updated = _fake_user(display_name="Alice Updated")

        mock_repo = AsyncMock()
        mock_repo.get = AsyncMock(return_value=user)
        mock_repo.update = AsyncMock(return_value=updated)

        # Only display_name is provided; avatar_url is None (should be excluded)
        data = _make_user_update(display_name="Alice Updated", avatar_url=None)

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            await svc.update(USER_UUID, data)

        call_kwargs = mock_repo.update.call_args.kwargs
        # avatar_url should be excluded because it is None
        assert "avatar_url" not in call_kwargs

    @pytest.mark.asyncio
    async def test_update_with_avatar_url(self):
        """update() must pass avatar_url when it is explicitly provided."""
        db = _make_db()
        user = _fake_user()
        updated = _fake_user()
        updated.avatar_url = "https://example.com/avatar.png"

        mock_repo = AsyncMock()
        mock_repo.get = AsyncMock(return_value=user)
        mock_repo.update = AsyncMock(return_value=updated)

        data = _make_user_update(avatar_url="https://example.com/avatar.png")

        with patch("app.modules.users.service.BaseRepository", return_value=mock_repo):
            from app.modules.users.service import UserService
            svc = UserService(db, TENANT_ID)
            result = await svc.update(USER_UUID, data)

        call_kwargs = mock_repo.update.call_args.kwargs
        assert call_kwargs["avatar_url"] == "https://example.com/avatar.png"
