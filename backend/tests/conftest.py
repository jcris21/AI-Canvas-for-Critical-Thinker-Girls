"""Shared pytest fixtures for the WonderCanvas backend test suite.

All fixtures that need to be shared across test modules live here.
Individual test modules may define their own local fixtures for
test-specific needs.

IMPORT ORDER IS CRITICAL
------------------------
1. os.environ is patched first so pydantic-settings resolves required vars.
2. SQLAlchemy engine creation is patched next so `app.core.db` never tries
   to open a real database connection during collection.
3. Only after both patches are active do we import any app modules.
"""
import uuid
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Step 1 — Patch environment variables BEFORE any app import.
#
# pydantic-settings reads from os.environ at Settings() instantiation time
# (which happens at module level in app.core.config).  The patch must be
# started before pytest imports conftest.py's fixtures.
# ---------------------------------------------------------------------------
_ENV_PATCH = patch.dict(
    "os.environ",
    {
        "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/testdb",
        "CLERK_SECRET_KEY": "sk_test_dummy_key_for_tests",
        "CLERK_JWKS_URL": "https://clerk.example.com/.well-known/jwks.json",
        "GEMINI_API_KEY": "test-gemini-key",
        "GCS_BUCKET_NAME": "test-bucket",
        "APP_ENV": "test",
    },
)
_ENV_PATCH.start()

# ---------------------------------------------------------------------------
# Step 2 — Mock SQLAlchemy engine creation BEFORE importing app.core.db.
#
# app.core.db calls create_async_engine() at module level.  Without a real
# database the driver will raise during DNS resolution / TCP connect.  We
# patch both the sqlalchemy namespace (for the initial import) and
# app.core.db's local reference (for subsequent calls after import).
# ---------------------------------------------------------------------------
_mock_engine = MagicMock()
_mock_session_maker = MagicMock()

# Patch in the sqlalchemy package so the `from sqlalchemy...import` in
# app.core.db gets the mock when the module is first imported.
_ENGINE_PATCH = patch(
    "sqlalchemy.ext.asyncio.create_async_engine",
    return_value=_mock_engine,
)
_SESSION_PATCH = patch(
    "sqlalchemy.ext.asyncio.async_sessionmaker",
    return_value=_mock_session_maker,
)
_ENGINE_PATCH.start()
_SESSION_PATCH.start()

# Force-import app.core.db now (while the patches are active) so its
# module-level code runs against the mocked engine.  Later imports will
# reuse the already-initialised module from sys.modules.
import importlib
import sys as _sys

# Only import if not already cached (avoids double-init on reload).
if "app.core.db" not in _sys.modules:
    try:
        importlib.import_module("app.core.db")
    except Exception:
        pass  # Will be retried per-test if needed

# ---------------------------------------------------------------------------
# Step 3 — Mock google.genai Client so importing AIService never touches GCP.
# ---------------------------------------------------------------------------
_GENAI_PATCH = patch("google.genai.Client", MagicMock())
_GENAI_PATCH.start()

# ---------------------------------------------------------------------------
# Step 4 — Mock google.cloud.storage so FileService never touches GCS.
# ---------------------------------------------------------------------------
_GCS_PATCH = patch("google.cloud.storage.Client", MagicMock())
_GCS_PATCH.start()


# ---------------------------------------------------------------------------
# Common UUIDs & string constants reused across tests
# ---------------------------------------------------------------------------

TENANT_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
USER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
LESSON_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
MISSION_TEMPLATE_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")
ASSIGNED_MISSION_ID = uuid.UUID("55555555-5555-5555-5555-555555555555")
SESSION_ID = uuid.UUID("66666666-6666-6666-6666-666666666666")
CLERK_USER_ID = "user_clerk_abc123"


@pytest.fixture
def tenant_id() -> uuid.UUID:
    return TENANT_ID


@pytest.fixture
def user_id() -> uuid.UUID:
    return USER_ID


@pytest.fixture
def lesson_id() -> uuid.UUID:
    return LESSON_ID


@pytest.fixture
def clerk_user_id() -> str:
    return CLERK_USER_ID


# ---------------------------------------------------------------------------
# Async DB session mock
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db() -> AsyncMock:
    """Return a fully mocked AsyncSession.

    Tests can configure return values on individual methods as needed:
        mock_db.execute.return_value = ...
    """
    session = AsyncMock()
    session.add = MagicMock()  # add() is synchronous in SQLAlchemy
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.delete = AsyncMock()
    # execute returns a result proxy — tests configure this per-scenario
    session.execute = AsyncMock()
    return session


# ---------------------------------------------------------------------------
# Mock for settings (so tests can override individual values)
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_settings():
    """Patch app.core.config.settings with a MagicMock.

    Usage:
        def test_something(mock_settings):
            mock_settings.GEMINI_API_KEY = "new-key"
    """
    from app.core import config as config_module
    real_settings = config_module.settings
    fake = MagicMock()
    fake.DATABASE_URL = "postgresql+asyncpg://test:test@localhost/testdb"
    fake.CLERK_SECRET_KEY = "sk_test_dummy_key_for_tests"
    fake.CLERK_JWKS_URL = "https://clerk.example.com/.well-known/jwks.json"
    fake.GEMINI_API_KEY = "test-gemini-key"
    fake.GCS_BUCKET_NAME = "test-bucket"
    fake.GEMINI_MODEL = "gemini-2.5-flash"
    fake.VERTEX_PROJECT = ""
    fake.VERTEX_LOCATION = "us-central1"
    fake.APP_ENV = "test"
    fake.CORS_ORIGINS = ["http://localhost:3000"]

    config_module.settings = fake
    yield fake
    config_module.settings = real_settings


# ---------------------------------------------------------------------------
# FastAPI test client with full dependency overrides
# ---------------------------------------------------------------------------

@pytest.fixture
def app(mock_db) -> FastAPI:
    """Return the FastAPI app with DB and auth dependencies overridden."""
    # Import lazily — env and engine patches are already active at this point
    from app.main import app as _app
    from app.core.db import get_db
    from app.core.security import get_current_user_id, verify_token
    from app.core.tenancy import resolve_tenant

    async def _fake_get_db() -> AsyncGenerator:
        yield mock_db

    async def _fake_verify_token() -> dict:
        return {"sub": CLERK_USER_ID}

    async def _fake_get_current_user_id() -> str:
        return CLERK_USER_ID

    async def _fake_resolve_tenant() -> uuid.UUID:
        return TENANT_ID

    _app.dependency_overrides[get_db] = _fake_get_db
    _app.dependency_overrides[verify_token] = _fake_verify_token
    _app.dependency_overrides[get_current_user_id] = _fake_get_current_user_id
    _app.dependency_overrides[resolve_tenant] = _fake_resolve_tenant

    yield _app

    _app.dependency_overrides.clear()


@pytest.fixture
def client(app) -> TestClient:
    """Return a synchronous TestClient wrapping the overridden FastAPI app."""
    return TestClient(app, raise_server_exceptions=False)
