import { GoogleGenAI } from "@google/genai";

export const generateResponse = async (userPrompt: string, context: string, fullData?: any) => {
  try {
    const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
    
    if (!apiKey) {
        console.warn("Gemini API Key is missing.");
        return "시스템 설정 오류: API 키가 확인되지 않습니다.";
    }

    const ai = new GoogleGenAI({ apiKey });

    // Construct a rich context from the full data object if provided
    let richContext = context;
    if (fullData) {
        richContext += `\n\n[Detailed Website Data]\n`;
        richContext += `Packages: ${JSON.stringify(fullData.packages)}\n`;
        richContext += `FAQs: ${JSON.stringify(fullData.faqs)}\n`;
        richContext += `Notices: ${JSON.stringify(fullData.notices)}\n`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are Heum's intelligent AI Manager for "Stills by Heum".
        
        **Core Knowledge Base:**
        ${richContext}
        
        **Directives:**
        1. **Role:** Professional Studio Manager. Helpful, polite, and precise.
        2. **Accuracy:** Use the [Detailed Website Data] to answer specific questions about prices, time limits, and policies. Do not hallucinate prices.
        3. **Correction:** If the user asks something wrong (e.g., "Can I book for $10?"), politely correct them with the actual price from the data.
        4. **Language:** Reply in the same language as the User Question (Korean or English).
        5. **Tone:** Professional Korean ('해요'체) or Polite English.
        6. **Length:** Keep it concise (1-3 sentences) unless listing packages.

        User Question: ${userPrompt}
      `,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "죄송합니다. 잠시 후 다시 시도해주세요. (Sorry, please try again later.)";
  }
};