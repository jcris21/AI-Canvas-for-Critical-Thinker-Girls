import { GoogleGenAI, FunctionDeclaration, Type, Schema, Tool } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Define the Function Tool for Image Injection
const generateIllustrationTool: FunctionDeclaration = {
  name: "generate_illustration",
  description: "Generates a visual illustration or image to explain a concept to the child. Use this when a visual aid would help critical thinking.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: "A descriptive prompt for the image to be generated (e.g., 'a diagram of a solar eclipse', 'a cute cartoon cat thinking')."
      }
    },
    required: ["prompt"]
  }
};

const SYSTEM_INSTRUCTION = `
You are "WonderBot", a friendly, encouraging, and Socratic tutor for an 11-year-old girl.
Your goal is to develop Critical Thinking skills.

Rules:
1. Tone: Cheerful, curious, safe, and encouraging. Use emojis occasionally 🌟.
2. Interaction: 
   - When the user draws something, acknowledge it enthusiastically.
   - Ask open-ended questions ("Why do you think...?", "What would happen if...?").
   - Do not just identify the object; bridge it to a concept (e.g., "I see a tree! If trees could talk to the wind, what secrets would they share?").
3. Visuals:
   - If a concept is abstract (like 'gravity', 'empathy', 'structure'), or if the user asks for a drawing, use the 'generate_illustration' tool.
   - Explain what you are drawing before or while you do it.

Do not give long lectures. Keep responses concise and conversational.
`;

export const chatWithGemini = async (
  history: { role: string; parts: { text: string }[] }[],
  currentMessage: string,
  imageBase64?: string
): Promise<{ text: string; generatedImageBase64?: string }> => {
  
  const ai = getClient();
  
  // Configure the model
  const model = "gemini-2.5-flash";
  
  const tools: Tool[] = [{ functionDeclarations: [generateIllustrationTool] }];

  // Prepare content
  const parts: any[] = [{ text: currentMessage }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: imageBase64,
      },
    });
  }

  try {
    // We use generateContent for a single turn here to keep it stateless in this PoC service,
    // but in a real app, we would maintain the ChatSession.
    // Incorporating history manually for context.
    const contents = [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: parts }
    ];

    const result = await ai.models.generateContent({
      model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        thinkingConfig: { thinkingBudget: 0 } // Low latency preferred for kids
      }
    });

    const response = result.candidates?.[0];
    
    if (!response) throw new Error("No response from AI");

    const textPart = response.content?.parts?.find(p => p.text);
    let responseText = textPart?.text || "";

    // Check for function calls
    const functionCallPart = response.content?.parts?.find(p => p.functionCall);
    let generatedImageBase64: string | undefined = undefined;

    if (functionCallPart && functionCallPart.functionCall) {
      const { name, args } = functionCallPart.functionCall;
      
      if (name === "generate_illustration") {
        const prompt = args['prompt'] as string;
        responseText += `\n\n(Generando una ilustración de: ${prompt}...)`;
        
        // Call Image Generation Model
        try {
          generatedImageBase64 = await generateImage(prompt);
        } catch (imgError) {
          console.error("Image generation failed", imgError);
          responseText += "\n(Ups, no pude dibujar eso, pero imagina que está ahí!)";
        }
      }
    }

    return { text: responseText, generatedImageBase64 };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "¡Oh no! Me desconcentré un poco. ¿Puedes repetirlo?" };
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  // Using imagen-4.0-generate-001 as requested for high quality, or fallback to flash-image if needed
  const model = "imagen-4.0-generate-001";
  
  try {
    const response = await ai.models.generateImages({
      model,
      prompt: `Illustration for a child, style of a friendly textbook or storybook: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1'
      }
    });
    
    return response.generatedImages[0].image.imageBytes;
  } catch (e) {
    console.warn("Imagen model failed, trying gemini-2.5-flash-image fallback");
    // Fallback mechanism not implemented in this snippet to keep it clean, 
    // but in production handle fallback logic here.
    throw e;
  }
};
