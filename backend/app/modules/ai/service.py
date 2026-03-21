"""Gemini integration — supports GEMINI_API_KEY (local) and Vertex AI (production)."""
import base64

from fastapi import HTTPException, status
from google import genai
from google.genai import types

from app.core.config import settings

SOCRATIC_SYSTEM_INSTRUCTION = """
Eres WonderBot, una tutora socrática amigable para niñas de ~11 años.
Responde SIEMPRE en español. Usa el método socrático: guía con preguntas abiertas,
nunca des la respuesta directamente. Sé alentadora, usa emojis ocasionalmente.
""".strip()


class AIService:
    def __init__(self) -> None:
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = genai.Client(
                vertexai=True,
                project=settings.VERTEX_PROJECT,
                location=settings.VERTEX_LOCATION,
            )

    async def chat(
        self,
        history: list[dict],
        new_message: str,
        canvas_image_base64: str | None = None,
        system_instruction: str | None = None,
    ) -> str:
        # Convert history to Gemini Content objects
        # History dicts use "content" key (from DB) or "text" key (from frontend)
        contents = [
            types.Content(
                role=msg["role"],
                parts=[types.Part(text=msg.get("content") or msg.get("text", ""))],
            )
            for msg in history
        ]

        # Build current message parts (text + optional canvas image)
        parts: list[types.Part] = [types.Part(text=new_message)]
        if canvas_image_base64:
            img_data = canvas_image_base64
            if "," in img_data:
                img_data = img_data.split(",", 1)[1]
            parts.append(
                types.Part(
                    inline_data=types.Blob(
                        mime_type="image/png",
                        data=base64.b64decode(img_data),
                    )
                )
            )

        contents.append(types.Content(role="user", parts=parts))

        try:
            response = await self.client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction or SOCRATIC_SYSTEM_INSTRUCTION,
                    temperature=0.7,
                ),
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service is temporarily unavailable. Please try again later.",
            )

        reply = response.text
        if not reply:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service returned an empty response. Please try again later.",
            )
        return reply
