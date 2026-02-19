import { GoogleGenAI } from "@google/genai";

export const generateResponse = async (userPrompt: string, context: string) => {
  try {
    // Initialize API client lazily to avoid 'process is not defined' errors during initial bundle load
    // This is critical for static deployments where process.env might not be polyfilled globally
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    
    if (!apiKey) {
        console.warn("Gemini API Key is missing.");
        return "시스템 설정 오류: API 키가 확인되지 않습니다.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are Heum's AI Assistant for the photography studio "Stills by Heum".
        
        Context about the studio:
        ${context}
        
        **Instructions for response:**
        1. Role: You are a warm, kind, and professional studio manager welcoming a guest.
        2. Tone: Use polite, honorific Korean (존댓말 - '해요'체 mostly) appropriate for a friendly face-to-face consultation. The tone should be gentle (상냥한), empathetic, and inviting.
        3. Be concise but warm. Avoid being robotic.
        4. Detect the user's language and reply in the same language. If Korean, use the specified warm tone.
        
        User Question: ${userPrompt}
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "죄송합니다. 잠시 후 다시 시도해주세요. (Sorry, please try again later.)";
  }
};