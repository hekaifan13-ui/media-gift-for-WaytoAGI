// @ts-nocheck
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    console.error("Gemini API Key not found. Set VITE_GEMINI_API_KEY in .env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePostcardMessage = async (
  topic: string, 
  tone: 'funny' | 'romantic' | 'poetic' | 'casual',
  recipient: string,
  location: string
): Promise<string> => {
  const client = getClient();
  if (!client) return "Error: API Key missing.";

  const prompt = `Write a short, engaging postcard message (max 50 words).
  Context:
  - To: ${recipient || 'a friend'}
  - Location/Topic: ${location ? `Visiting ${location}` : ''} ${topic}
  - Tone: ${tone}
  
  Do not include the "Dear X" or "Best, Y" parts, just the body of the message. Keep it concise and natural.`;

  try {
    // Using gemini-3-pro-preview for more stable/high-quality text generation
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Enjoying my time here!";
  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Having a great time! Wish you were here.";
  }
};

export const generateCoverImage = async (
  prompt: string,
  aspectRatio: string = "3:4"
): Promise<string | null> => {
  const client = getClient();
  if (!client) throw new Error("API Key missing");

  try {
    // Upgrading to gemini-3-pro-image-preview (Nano Banana Pro) for superior text rendering and image quality
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, 
          imageSize: '1K'
        }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64String}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};