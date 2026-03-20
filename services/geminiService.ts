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
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: "local",
      message: currentMessage,
      history,
      canvas_image_base64: imageBase64 ?? null,
    }),
  });

  if (!response.ok) {
    console.error("Backend AI error:", response.status);
    return { text: "¡Oh no! Me desconcentré un poco. ¿Puedes repetirlo?" };
  }

  const data = await response.json();
  return { text: data.reply };
};
