"""Tests for app.core.security — JWT verification and JWKS caching."""
import time
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_credentials(token: str):
    """Return a minimal HTTPAuthorizationCredentials-like object."""
    creds = MagicMock()
    creds.credentials = token
    return creds


# ---------------------------------------------------------------------------
# _get_jwks — caching and TTL behaviour
# ---------------------------------------------------------------------------

class TestGetJwks:
    """Tests for the JWKS fetch + cache logic inside security.py."""

    @pytest.mark.asyncio
    async def test_fetches_jwks_on_first_call(self):
        """First call with no cache should hit the JWKS URL."""
        from app.core import security

        fake_jwks = {"keys": [{"kty": "RSA", "kid": "key1"}]}

        mock_response = MagicMock()
        mock_response.json.return_value = fake_jwks
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        # Reset module-level cache before test
        security._jwks_cache = None
        security._jwks_fetched_at = 0.0

        with patch("app.core.security.httpx.AsyncClient", return_value=mock_client):
            result = await security._get_jwks()

        assert result == fake_jwks
        mock_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_cached_jwks_within_ttl(self):
        """Subsequent calls within the TTL window must NOT re-fetch."""
        from app.core import security

        cached_jwks = {"keys": [{"kty": "RSA", "kid": "cached"}]}
        security._jwks_cache = cached_jwks
        security._jwks_fetched_at = time.monotonic()  # just fetched

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.core.security.httpx.AsyncClient", return_value=mock_client):
            result = await security._get_jwks()

        assert result is cached_jwks
        mock_client.get.assert_not_called()

    @pytest.mark.asyncio
    async def test_re_fetches_after_ttl_expiry(self):
        """When the TTL has elapsed the module must perform a fresh HTTP fetch."""
        from app.core import security

        stale_jwks = {"keys": [{"kty": "RSA", "kid": "stale"}]}
        fresh_jwks = {"keys": [{"kty": "RSA", "kid": "fresh"}]}

        security._jwks_cache = stale_jwks
        # Simulate that the last fetch happened more than 1 hour ago
        security._jwks_fetched_at = time.monotonic() - (security._JWKS_TTL_SECONDS + 1)

        mock_response = MagicMock()
        mock_response.json.return_value = fresh_jwks
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.core.security.httpx.AsyncClient", return_value=mock_client):
            result = await security._get_jwks()

        assert result == fresh_jwks
        mock_client.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_cache_timestamp_after_fetch(self):
        """After a successful fetch _jwks_fetched_at must be updated."""
        from app.core import security

        security._jwks_cache = None
        security._jwks_fetched_at = 0.0

        fake_jwks = {"keys": []}
        mock_response = MagicMock()
        mock_response.json.return_value = fake_jwks
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        before = time.monotonic()
        with patch("app.core.security.httpx.AsyncClient", return_value=mock_client):
            await security._get_jwks()

        assert security._jwks_fetched_at >= before


# ---------------------------------------------------------------------------
# verify_token
# ---------------------------------------------------------------------------

class TestVerifyToken:
    """Tests for the verify_token FastAPI dependency."""

    @pytest.mark.asyncio
    async def test_valid_jwt_returns_payload(self):
        """A well-formed, verifiable JWT must return the decoded payload dict."""
        from app.core import security

        expected_payload = {"sub": "user_abc", "iss": "clerk"}
        fake_jwks = {"keys": []}

        with (
            patch.object(security, "_get_jwks", AsyncMock(return_value=fake_jwks)),
            patch("app.core.security.jwt.decode", return_value=expected_payload),
        ):
            payload = await security.verify_token(_make_credentials("valid.jwt.token"))

        assert payload == expected_payload

    @pytest.mark.asyncio
    async def test_invalid_jwt_raises_401(self):
        """A JWTError from python-jose must surface as HTTP 401."""
        from app.core import security
        from jose import JWTError

        fake_jwks = {"keys": []}

        with (
            patch.object(security, "_get_jwks", AsyncMock(return_value=fake_jwks)),
            patch("app.core.security.jwt.decode", side_effect=JWTError("bad sig")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await security.verify_token(_make_credentials("bad.token"))

        assert exc_info.value.status_code == 401
        assert "Authentication failed" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_expired_token_raises_401(self):
        """An ExpiredSignatureError (subclass of JWTError) should also give 401."""
        from app.core import security
        from jose import ExpiredSignatureError

        fake_jwks = {"keys": []}

        with (
            patch.object(security, "_get_jwks", AsyncMock(return_value=fake_jwks)),
            patch("app.core.security.jwt.decode", side_effect=ExpiredSignatureError("expired")),
        ):
            with pytest.raises(HTTPException) as exc_info:
                await security.verify_token(_make_credentials("expired.token"))

        assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# get_current_user_id
# ---------------------------------------------------------------------------

class TestGetCurrentUserId:
    """Tests for the get_current_user_id dependency."""

    @pytest.mark.asyncio
    async def test_returns_sub_from_payload(self):
        """Sub claim present → returns user id string."""
        from app.core.security import get_current_user_id

        user_id = await get_current_user_id({"sub": "user_xyz", "iss": "clerk"})
        assert user_id == "user_xyz"

    @pytest.mark.asyncio
    async def test_missing_sub_raises_401(self):
        """Payload without 'sub' must raise HTTP 401."""
        from app.core.security import get_current_user_id

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id({"iss": "clerk"})

        assert exc_info.value.status_code == 401
        assert "Missing subject" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_empty_payload_raises_401(self):
        """Empty payload dict must raise HTTP 401."""
        from app.core.security import get_current_user_id

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id({})

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_none_sub_raises_401(self):
        """A None value for 'sub' must still raise HTTP 401."""
        from app.core.security import get_current_user_id

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_id({"sub": None})

        assert exc_info.value.status_code == 401
