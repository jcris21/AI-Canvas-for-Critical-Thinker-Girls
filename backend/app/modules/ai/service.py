import google.generativeai as genai
from app.core.config import settings
from app.modules.ai.schemas import HistoryMessage

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_INSTRUCTION = """
Eres WonderBot, una tutora socrática amigable y curiosa para niñas de ~11 años.
Tu objetivo es desarrollar el pensamiento crítico mediante preguntas abiertas.

Reglas:
1. Tono: alegre, curioso, seguro y motivador. Usa emojis ocasionalmente 🌟.
2. Interacción:
   - Cuando el usuario dibuja algo, reconócelo con entusiasmo.
   - Haz preguntas abiertas ("¿Por qué crees que...?", "¿Qué pasaría si...?").
   - No solo identifiques el objeto; conéctalo a un concepto más profundo.
3. Nunca des respuestas directas — guía con preguntas.
4. Responde siempre en español.
5. Mantén respuestas cortas y conversacionales.
"""


async def chat_with_gemini(
    message: str,
    history: list[HistoryMessage] | None = None,
    canvas_image_base64: str | None = None,
) -> str:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=SYSTEM_INSTRUCTION,
    )

    # Build contents from history
    contents = []
    for h in (history or []):
        contents.append({"role": h.role, "parts": [{"text": h.text}]})

    # Build current user parts
    user_parts: list = [{"text": message}]
    if canvas_image_base64:
        user_parts.append({
            "inline_data": {
                "mime_type": "image/png",
                "data": canvas_image_base64,
            }
        })

    contents.append({"role": "user", "parts": user_parts})

    response = await model.generate_content_async(contents)
    return response.text
