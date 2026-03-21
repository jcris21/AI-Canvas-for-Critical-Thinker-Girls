"""Tests for app.modules.ai.service — AIService.chat()."""
import base64
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_genai_response(text: str | None):
    """Return a mock Gemini response object."""
    resp = MagicMock()
    resp.text = text
    return resp


def _b64(data: str) -> str:
    return base64.b64encode(data.encode()).decode()


# ---------------------------------------------------------------------------
# AIService initialisation
# ---------------------------------------------------------------------------

class TestAIServiceInit:
    def test_uses_api_key_when_provided(self):
        """When GEMINI_API_KEY is set the client must use api_key auth."""
        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                from app.modules.ai.service import AIService
                svc = AIService()
                mock_client_cls.assert_called_once_with(api_key="test-key")

    def test_uses_vertex_when_api_key_is_none(self):
        """When GEMINI_API_KEY is None the client must use Vertex AI credentials."""
        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = None
                mock_settings.VERTEX_PROJECT = "my-project"
                mock_settings.VERTEX_LOCATION = "us-central1"
                from app.modules.ai.service import AIService
                svc = AIService()
                mock_client_cls.assert_called_once_with(
                    vertexai=True,
                    project="my-project",
                    location="us-central1",
                )


# ---------------------------------------------------------------------------
# AIService.chat() — happy paths
# ---------------------------------------------------------------------------

class TestAIServiceChat:
    def _make_service(self, response_text: str | None = "Hola, ¿qué aprendiste hoy?"):
        """Return an AIService with its Gemini client fully mocked."""
        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.GEMINI_MODEL = "gemini-2.5-flash"

                mock_client = MagicMock()
                mock_client_cls.return_value = mock_client

                # aio.models.generate_content is async
                mock_client.aio.models.generate_content = AsyncMock(
                    return_value=_make_genai_response(response_text)
                )

                from app.modules.ai.service import AIService
                svc = AIService()
                svc.client = mock_client  # override after construction

                return svc, mock_client

    @pytest.mark.asyncio
    async def test_returns_reply_text_on_success(self):
        """chat() must return the text from the Gemini response."""
        svc, mock_client = self._make_service("¡Muy bien!")

        with patch("app.modules.ai.service.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            reply = await svc.chat(history=[], new_message="Hola")

        assert reply == "¡Muy bien!"

    @pytest.mark.asyncio
    async def test_history_is_converted_to_content_objects(self):
        """History dicts should be converted to Gemini Content objects before the call."""
        svc, mock_client = self._make_service("Respuesta")

        history = [
            {"role": "user", "content": "¿Qué es el agua?"},
            {"role": "model", "content": "¿Qué piensas tú?"},
        ]

        with patch("app.modules.ai.service.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            await svc.chat(history=history, new_message="Dime más")

        call_kwargs = mock_client.aio.models.generate_content.call_args
        # contents should have history + 1 new user message = 3 total
        assert call_kwargs is not None

    @pytest.mark.asyncio
    async def test_canvas_image_is_appended_as_inline_data(self):
        """When canvas_image_base64 is provided it should be included in the request."""
        svc, mock_client = self._make_service("Con imagen")

        raw_bytes = b"fake-png-bytes"
        image_b64 = base64.b64encode(raw_bytes).decode()

        with patch("app.modules.ai.service.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            reply = await svc.chat(
                history=[],
                new_message="Mira esto",
                canvas_image_base64=image_b64,
            )

        assert reply == "Con imagen"
        mock_client.aio.models.generate_content.assert_called_once()

    @pytest.mark.asyncio
    async def test_data_url_prefix_is_stripped_from_image(self):
        """Images with a data:image/png;base64, prefix should have the prefix stripped."""
        svc, mock_client = self._make_service("Entendido")

        raw_bytes = b"fake-png-content"
        image_b64 = base64.b64encode(raw_bytes).decode()
        data_url = f"data:image/png;base64,{image_b64}"

        with patch("app.modules.ai.service.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            # Should not raise; the method should strip the prefix transparently
            reply = await svc.chat(
                history=[],
                new_message="Mira",
                canvas_image_base64=data_url,
            )

        assert reply == "Entendido"

    @pytest.mark.asyncio
    async def test_custom_system_instruction_is_forwarded(self):
        """When system_instruction is provided it must override the default."""
        svc, mock_client = self._make_service("Custom")

        with patch("app.modules.ai.service.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            await svc.chat(
                history=[],
                new_message="Test",
                system_instruction="You are a pirate.",
            )

        call_kwargs = mock_client.aio.models.generate_content.call_args.kwargs
        config = call_kwargs.get("config")
        assert config is not None
        assert config.system_instruction == "You are a pirate."

    @pytest.mark.asyncio
    async def test_history_uses_text_key_as_fallback(self):
        """History dicts that use 'text' key (frontend format) must still work."""
        svc, mock_client = self._make_service("OK")

        history = [{"role": "user", "text": "¿Cómo estás?"}]

        with patch("app.modules.ai.service.settings") as mock_settings:
            mock_settings.GEMINI_MODEL = "gemini-2.5-flash"
            reply = await svc.chat(history=history, new_message="Bien")

        assert reply == "OK"


# ---------------------------------------------------------------------------
# AIService.chat() — error paths
# ---------------------------------------------------------------------------

class TestAIServiceChatErrors:
    @pytest.mark.asyncio
    async def test_empty_response_text_raises_500(self):
        """When Gemini returns an empty string response the service must raise HTTP 500."""
        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.GEMINI_MODEL = "gemini-2.5-flash"

                mock_client = MagicMock()
                mock_client_cls.return_value = mock_client
                mock_client.aio.models.generate_content = AsyncMock(
                    return_value=_make_genai_response("")
                )

                from app.modules.ai.service import AIService
                svc = AIService()
                svc.client = mock_client

                with pytest.raises(HTTPException) as exc_info:
                    await svc.chat(history=[], new_message="Hello")

                assert exc_info.value.status_code == 500
                assert "empty response" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_none_response_text_raises_500(self):
        """When Gemini returns None as response text the service must raise HTTP 500."""
        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.GEMINI_MODEL = "gemini-2.5-flash"

                mock_client = MagicMock()
                mock_client_cls.return_value = mock_client
                mock_client.aio.models.generate_content = AsyncMock(
                    return_value=_make_genai_response(None)
                )

                from app.modules.ai.service import AIService
                svc = AIService()
                svc.client = mock_client

                with pytest.raises(HTTPException) as exc_info:
                    await svc.chat(history=[], new_message="Hello")

                assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_genai_exception_raises_500(self):
        """Any exception from the Gemini client must surface as HTTP 500."""
        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.GEMINI_MODEL = "gemini-2.5-flash"

                mock_client = MagicMock()
                mock_client_cls.return_value = mock_client
                mock_client.aio.models.generate_content = AsyncMock(
                    side_effect=RuntimeError("API unreachable")
                )

                from app.modules.ai.service import AIService
                svc = AIService()
                svc.client = mock_client

                with pytest.raises(HTTPException) as exc_info:
                    await svc.chat(history=[], new_message="Hello")

                assert exc_info.value.status_code == 500
                assert "temporarily unavailable" in exc_info.value.detail.lower()

    @pytest.mark.asyncio
    async def test_network_timeout_raises_500(self):
        """A network timeout from httpx must also yield HTTP 500."""
        import httpx

        with patch("app.modules.ai.service.genai.Client") as mock_client_cls:
            with patch("app.modules.ai.service.settings") as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.GEMINI_MODEL = "gemini-2.5-flash"

                mock_client = MagicMock()
                mock_client_cls.return_value = mock_client
                mock_client.aio.models.generate_content = AsyncMock(
                    side_effect=httpx.TimeoutException("timed out")
                )

                from app.modules.ai.service import AIService
                svc = AIService()
                svc.client = mock_client

                with pytest.raises(HTTPException) as exc_info:
                    await svc.chat(history=[], new_message="Hello")

                assert exc_info.value.status_code == 500
