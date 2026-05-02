// AI generation service - currently disabled (no API key configured)
// To enable: add VITE_GEMINI_API_KEY to your environment

export const generatePostcardMessage = async (
  _topic: string,
  _tone: 'funny' | 'romantic' | 'poetic' | 'casual',
  _recipient: string,
  _location: string
): Promise<string> => {
  return "AI generation requires a Gemini API key. Please configure VITE_GEMINI_API_KEY.";
};

export const generateCoverImage = async (
  _prompt: string,
  _aspectRatio: string = "3:4"
): Promise<string | null> => {
  throw new Error("AI image generation requires a Gemini API key. Please configure VITE_GEMINI_API_KEY.");
};
