"""Tests for app.modules.integrations.clerk — Clerk webhook signature verification."""
import base64
import hashlib
import hmac
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.modules.integrations.clerk import router, _verify_clerk_signature


# ---------------------------------------------------------------------------
# Helper: generate a valid HMAC-SHA256 signature in the Svix wire format
# ---------------------------------------------------------------------------

_TEST_SECRET_RAW = b"super-secret-webhook-key-32bytes"
_TEST_SECRET_B64 = base64.b64encode(_TEST_SECRET_RAW).decode()
_TEST_CLERK_SECRET_KEY = f"whsec_{_TEST_SECRET_B64}"


def _sign(payload: bytes, svix_timestamp: str) -> str:
    """Produce a valid svix-signature header value for the given payload."""
    msg = f"{svix_timestamp}.{payload.decode()}".encode()
    digest = hmac.new(_TEST_SECRET_RAW, msg, hashlib.sha256).hexdigest()
    return f"v1={digest}"


# ---------------------------------------------------------------------------
# Isolated FastAPI app for integration route tests
# ---------------------------------------------------------------------------

def _make_client() -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/integrations")
    return TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# _verify_clerk_signature unit tests
# ---------------------------------------------------------------------------

class TestVerifyClerkSignature:
    def test_valid_signature_returns_true(self):
        """A correctly HMAC-signed payload must return True."""
        payload = b'{"type":"user.created"}'
        timestamp = "1700000000"
        sig = _sign(payload, timestamp)

        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            result = _verify_clerk_signature(payload, sig, timestamp)

        assert result is True

    def test_tampered_payload_returns_false(self):
        """A payload that has been tampered with after signing must return False."""
        original_payload = b'{"type":"user.created"}'
        tampered_payload = b'{"type":"user.deleted"}'
        timestamp = "1700000000"
        sig = _sign(original_payload, timestamp)

        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            result = _verify_clerk_signature(tampered_payload, sig, timestamp)

        assert result is False

    def test_wrong_timestamp_returns_false(self):
        """A different timestamp than the one used during signing must fail."""
        payload = b'{"type":"user.created"}'
        real_timestamp = "1700000000"
        wrong_timestamp = "1700000001"
        sig = _sign(payload, real_timestamp)

        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            result = _verify_clerk_signature(payload, sig, wrong_timestamp)

        assert result is False

    def test_completely_invalid_signature_returns_false(self):
        """A random garbage signature must return False."""
        payload = b'{"type":"user.created"}'
        timestamp = "1700000000"

        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            result = _verify_clerk_signature(payload, "v1=not_a_real_signature", timestamp)

        assert result is False

    def test_whsec_prefix_is_stripped_before_decoding(self):
        """The whsec_ prefix must be stripped before base64-decoding the secret."""
        payload = b'{"type":"user.created"}'
        timestamp = "1700000000"
        sig = _sign(payload, timestamp)

        # Secret with whsec_ prefix — the function must handle it correctly
        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            result = _verify_clerk_signature(payload, sig, timestamp)

        assert result is True

    def test_signature_with_multiple_values_uses_last(self):
        """When svix-signature contains multiple comma-separated values, use the last."""
        payload = b'{"type":"user.created"}'
        timestamp = "1700000000"
        valid_sig = _sign(payload, timestamp)

        combined_sig = f"v1=invalidsig,{valid_sig}"

        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            result = _verify_clerk_signature(payload, combined_sig, timestamp)

        assert result is True


# ---------------------------------------------------------------------------
# POST /integrations/clerk/webhooks — HTTP integration tests
# ---------------------------------------------------------------------------

class TestClerkWebhookEndpoint:
    def _post_webhook(
        self,
        client: TestClient,
        payload: dict,
        timestamp: str = "1700000000",
        sig_override: str | None = None,
    ):
        raw = json.dumps(payload).encode()
        sig = sig_override or _sign(raw, timestamp)

        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            return client.post(
                "/integrations/clerk/webhooks",
                content=raw,
                headers={
                    "Content-Type": "application/json",
                    "svix-id": "msg_001",
                    "svix-timestamp": timestamp,
                    "svix-signature": sig,
                },
            )

    def test_valid_user_created_event_returns_200(self):
        """A correctly signed user.created event must return 200 with {received: true}."""
        client = _make_client()
        response = self._post_webhook(client, {"type": "user.created", "data": {}})

        assert response.status_code == 200
        assert response.json() == {"received": True}

    def test_valid_user_deleted_event_returns_200(self):
        """A correctly signed user.deleted event must return 200."""
        client = _make_client()
        response = self._post_webhook(client, {"type": "user.deleted", "data": {}})

        assert response.status_code == 200

    def test_unknown_event_type_returns_200(self):
        """An unknown event type must still return 200 (graceful no-op)."""
        client = _make_client()
        response = self._post_webhook(client, {"type": "session.created", "data": {}})

        assert response.status_code == 200

    def test_invalid_signature_returns_400(self):
        """A request with a bad signature must be rejected with HTTP 400."""
        client = _make_client()

        raw = json.dumps({"type": "user.created"}).encode()
        with patch("app.modules.integrations.clerk.settings") as mock_settings:
            mock_settings.CLERK_SECRET_KEY = _TEST_CLERK_SECRET_KEY
            response = client.post(
                "/integrations/clerk/webhooks",
                content=raw,
                headers={
                    "Content-Type": "application/json",
                    "svix-id": "msg_002",
                    "svix-timestamp": "1700000000",
                    "svix-signature": "v1=totallywrong",
                },
            )

        assert response.status_code == 400
        assert "Invalid webhook signature" in response.json()["detail"]

    def test_missing_svix_id_header_returns_422(self):
        """A request without the required svix-id header must return 422."""
        client = _make_client()
        raw = json.dumps({"type": "user.created"}).encode()

        response = client.post(
            "/integrations/clerk/webhooks",
            content=raw,
            headers={
                "Content-Type": "application/json",
                "svix-timestamp": "1700000000",
                "svix-signature": "v1=anything",
                # svix-id intentionally omitted
            },
        )

        assert response.status_code == 422

    def test_missing_svix_signature_header_returns_422(self):
        """A request without the required svix-signature header must return 422."""
        client = _make_client()
        raw = json.dumps({"type": "user.created"}).encode()

        response = client.post(
            "/integrations/clerk/webhooks",
            content=raw,
            headers={
                "Content-Type": "application/json",
                "svix-id": "msg_003",
                "svix-timestamp": "1700000000",
                # svix-signature intentionally omitted
            },
        )

        assert response.status_code == 422

    def test_empty_body_with_valid_signature_returns_200(self):
        """An empty JSON body {} with a valid signature must return 200."""
        client = _make_client()
        response = self._post_webhook(client, {})

        assert response.status_code == 200
