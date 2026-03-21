"""Tests for app.core.config — Settings class validation and defaults.

Strategy: We import the Settings class directly (not the module-level
`settings` singleton) and instantiate it inside environment patches.
This avoids triggering the module-level `settings = Settings()` call
which would fail when env vars are intentionally absent.
"""
import pytest
from unittest.mock import patch
from pydantic import ValidationError


def _make_settings(**env_overrides):
    """Instantiate Settings with only the provided env vars visible."""
    from app.core.config import Settings
    with patch.dict("os.environ", env_overrides, clear=True):
        return Settings()


# ---------------------------------------------------------------------------
# Required fields — happy paths
# ---------------------------------------------------------------------------

class TestSettingsValidRequiredFields:
    def test_valid_settings_instantiate_without_error(self):
        """Settings must instantiate when all required vars are present."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
        )
        assert s.DATABASE_URL == "postgresql+asyncpg://user:pass@localhost/db"
        assert s.CLERK_SECRET_KEY == "sk_test_abc"
        assert s.CLERK_JWKS_URL == "https://clerk.example.com/.well-known/jwks.json"

    def test_default_values_are_applied(self):
        """Optional fields must carry their declared defaults."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
        )
        assert s.GEMINI_MODEL == "gemini-2.5-flash"
        assert s.VERTEX_LOCATION == "us-central1"
        assert s.APP_ENV == "development"
        assert "http://localhost:3000" in s.CORS_ORIGINS

    def test_gemini_api_key_defaults_to_none(self):
        """GEMINI_API_KEY is optional and defaults to None when absent."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
        )
        assert s.GEMINI_API_KEY is None

    def test_gemini_api_key_is_read_when_set(self):
        """GEMINI_API_KEY is populated when explicitly provided."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
            GEMINI_API_KEY="my-api-key",
        )
        assert s.GEMINI_API_KEY == "my-api-key"

    def test_cors_origins_is_a_list(self):
        """CORS_ORIGINS must be parsed as a list of strings."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
        )
        assert isinstance(s.CORS_ORIGINS, list)

    def test_custom_app_env_is_applied(self):
        """APP_ENV must be set from the environment variable."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
            APP_ENV="production",
        )
        assert s.APP_ENV == "production"

    def test_gcs_bucket_name_defaults_to_empty_string(self):
        """GCS_BUCKET_NAME defaults to empty string when not set."""
        s = _make_settings(
            DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
            CLERK_SECRET_KEY="sk_test_abc",
            CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
        )
        assert s.GCS_BUCKET_NAME == ""


# ---------------------------------------------------------------------------
# Required fields — validation error paths
# ---------------------------------------------------------------------------

class TestSettingsValidationErrors:
    def test_empty_database_url_raises_error_mentioning_database_url(self):
        """Empty DATABASE_URL must raise a validation error that names DATABASE_URL."""
        with pytest.raises((ValidationError, ValueError)) as exc_info:
            _make_settings(
                DATABASE_URL="",
                CLERK_SECRET_KEY="sk_test_abc",
                CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
            )
        assert "DATABASE_URL" in str(exc_info.value)

    def test_empty_clerk_secret_key_raises_error_mentioning_clerk_secret_key(self):
        """Empty CLERK_SECRET_KEY must raise a validation error that names CLERK_SECRET_KEY."""
        with pytest.raises((ValidationError, ValueError)) as exc_info:
            _make_settings(
                DATABASE_URL="postgresql+asyncpg://user:pass@localhost/db",
                CLERK_SECRET_KEY="",
                CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
            )
        assert "CLERK_SECRET_KEY" in str(exc_info.value)

    def test_both_missing_raises_error_mentioning_both(self):
        """When both DATABASE_URL and CLERK_SECRET_KEY are empty both must appear in the error."""
        with pytest.raises((ValidationError, ValueError)) as exc_info:
            _make_settings(
                DATABASE_URL="",
                CLERK_SECRET_KEY="",
                CLERK_JWKS_URL="",
            )
        error_text = str(exc_info.value)
        assert "DATABASE_URL" in error_text
        assert "CLERK_SECRET_KEY" in error_text

    def test_absent_database_url_raises_error(self):
        """When DATABASE_URL is entirely absent from env the error must fire."""
        with pytest.raises((ValidationError, ValueError)) as exc_info:
            _make_settings(
                CLERK_SECRET_KEY="sk_test_abc",
                CLERK_JWKS_URL="https://clerk.example.com/.well-known/jwks.json",
                # DATABASE_URL intentionally not provided
            )
        assert "DATABASE_URL" in str(exc_info.value)
