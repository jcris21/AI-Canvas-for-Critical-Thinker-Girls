const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export interface HistoryMessage {
  role: "user" | "model";
  text: string;
}

export const chatWithGemini = async (
  history: HistoryMessage[],
  currentMessage: string,
  imageBase64?: string
): Promise<{ text: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "local",
        message: currentMessage,
        history,
        canvas_image_base64: imageBase64 ?? null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("Backend AI error:", response.status);
      return { text: "¡Oh no! Me desconcentré un poco. ¿Puedes repetirlo?" };
    }

    const data = await response.json();
    if (!data.reply) {
      throw new Error("Invalid response: missing reply field");
    }
    return { text: data.reply };
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Network error: unable to reach the server. ${error.message}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
