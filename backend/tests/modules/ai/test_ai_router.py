"""Integration-style tests for app.modules.ai.router — /api/v1/ai/chat endpoint."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.modules.ai.router import router, get_ai_service
from app.modules.ai.service import AIService


# ---------------------------------------------------------------------------
# Isolated FastAPI app for ai router tests (no auth needed here because
# the ai router does not require authentication by design)
# ---------------------------------------------------------------------------

def _make_client(ai_service_mock) -> TestClient:
    """Build a test client with the AI service dependency overridden."""
    app = FastAPI()
    app.include_router(router, prefix="/ai")

    app.dependency_overrides[get_ai_service] = lambda: ai_service_mock

    return TestClient(app, raise_server_exceptions=False)


def _mock_ai_service(reply: str | None = None, raises: Exception | None = None) -> MagicMock:
    """Return a mock AIService whose chat() returns *reply* or raises *raises*."""
    svc = MagicMock(spec=AIService)
    if raises is not None:
        svc.chat = AsyncMock(side_effect=raises)
    else:
        svc.chat = AsyncMock(return_value=reply)
    return svc


# ---------------------------------------------------------------------------
# POST /ai/chat — happy paths
# ---------------------------------------------------------------------------

class TestAIChatEndpointHappyPath:
    def test_returns_200_with_reply_on_success(self):
        """Valid request body → 200 with {reply: ...}."""
        svc = _mock_ai_service(reply="¿Qué sabes sobre las nubes?")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={
                "session_id": "sess-001",
                "message": "Hola",
                "history": [],
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["reply"] == "¿Qué sabes sobre las nubes?"

    def test_passes_history_to_service(self):
        """History list from the request body must be forwarded to AIService.chat()."""
        svc = _mock_ai_service(reply="Interesante")
        client = _make_client(svc)

        history = [
            {"role": "user", "text": "¿Qué es la fotosíntesis?"},
            {"role": "model", "text": "¿Qué crees tú que es?"},
        ]

        client.post(
            "/ai/chat",
            json={
                "session_id": "sess-002",
                "message": "No sé",
                "history": history,
            },
        )

        call_kwargs = svc.chat.call_args.kwargs
        assert len(call_kwargs["history"]) == 2

    def test_passes_canvas_image_to_service(self):
        """canvas_image_base64 must reach AIService.chat() when provided."""
        svc = _mock_ai_service(reply="Veo un árbol")
        client = _make_client(svc)

        client.post(
            "/ai/chat",
            json={
                "session_id": "sess-003",
                "message": "¿Qué ves?",
                "history": [],
                "canvas_image_base64": "aGVsbG8=",
            },
        )

        call_kwargs = svc.chat.call_args.kwargs
        assert call_kwargs["canvas_image_base64"] == "aGVsbG8="

    def test_passes_system_instruction_to_service(self):
        """system_instruction from request body must be forwarded to the service."""
        svc = _mock_ai_service(reply="Custom")
        client = _make_client(svc)

        client.post(
            "/ai/chat",
            json={
                "session_id": "sess-004",
                "message": "Go",
                "history": [],
                "system_instruction": "Be a pirate.",
            },
        )

        call_kwargs = svc.chat.call_args.kwargs
        assert call_kwargs["system_instruction"] == "Be a pirate."

    def test_empty_history_is_accepted(self):
        """An empty history list is valid and must not cause errors."""
        svc = _mock_ai_service(reply="Hola")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={
                "session_id": "sess-005",
                "message": "Hola",
            },
        )

        assert response.status_code == 200


# ---------------------------------------------------------------------------
# POST /ai/chat — error paths
# ---------------------------------------------------------------------------

class TestAIChatEndpointErrors:
    def test_missing_message_returns_422(self):
        """Request without 'message' field → 422 Unprocessable Entity."""
        svc = _mock_ai_service(reply="Should not be called")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={"session_id": "sess-006", "history": []},
        )

        assert response.status_code == 422

    def test_missing_session_id_returns_422(self):
        """Request without 'session_id' field → 422 Unprocessable Entity."""
        svc = _mock_ai_service(reply="Should not be called")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={"message": "Hello", "history": []},
        )

        assert response.status_code == 422

    def test_ai_service_500_is_propagated(self):
        """When AIService raises HTTP 500 the endpoint must propagate it."""
        svc = _mock_ai_service(
            raises=HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service is temporarily unavailable. Please try again later.",
            )
        )
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={"session_id": "sess-007", "message": "Test", "history": []},
        )

        assert response.status_code == 500

    def test_empty_message_string_is_forwarded_to_service(self):
        """An empty string for 'message' is structurally valid; service decides semantics."""
        svc = _mock_ai_service(reply="¿Qué quisiste decir?")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={"session_id": "sess-008", "message": "", "history": []},
        )

        # The endpoint itself does not reject empty messages
        assert response.status_code == 200

    def test_invalid_role_in_history_returns_422(self):
        """History entry with invalid role value → 422 Unprocessable Entity."""
        svc = _mock_ai_service(reply="N/A")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            json={
                "session_id": "sess-009",
                "message": "Test",
                "history": [{"role": "admin", "text": "Hello"}],
            },
        )

        assert response.status_code == 422

    def test_non_json_body_returns_422(self):
        """Sending plain text instead of JSON → 422."""
        svc = _mock_ai_service(reply="N/A")
        client = _make_client(svc)

        response = client.post(
            "/ai/chat",
            content="not json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422
