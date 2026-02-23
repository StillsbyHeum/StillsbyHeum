import { GoogleGenAI } from "@google/genai";
import { ContentData } from "../types";

// Initialize the Gemini API client
// Note: The API key is provided via process.env.GEMINI_API_KEY
// We use a lazy initialization pattern or just init here if the key is guaranteed.
// The guidelines say: "Always use process.env.GEMINI_API_KEY for the Gemini API."
// And "Initialize the SDK client only when first needed" is for third-party keys that might crash.
// But for Gemini, it's usually safe if the key is present.
// However, to be safe and follow the "lazy initialization" pattern for robustness:

let ai: GoogleGenAI | null = null;

const getAIClient = () => {
    if (!ai) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is missing");
            throw new Error("GEMINI_API_KEY is not set");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const generateResponse = async (
  userMessage: string,
  aiContext: string,
  content: ContentData
): Promise<string> => {
  try {
    const client = getAIClient();

    // Construct a system instruction that includes the context and content data
    // We limit the content data to avoid token limits if it's too large, 
    // but for this app it should be fine.
    // We can extract relevant parts of content to keep it focused.
    
    const relevantContent = {
        packages: content.packages,
        faqs: content.faqs,
        notices: content.notices,
        meetingPoints: content.meetingPoints,
        contactInfo: {
            instagram: content.instagramUrl,
            kakao: content.kakaoUrl
        }
    };

    const systemInstruction = `
      You are an AI assistant for a photographer named Heum (Nathan).
      Your goal is to help potential clients with their inquiries about photography services.
      
      Context provided by Admin:
      ${aiContext}
      
      Website Data:
      ${JSON.stringify(relevantContent, null, 2)}
      
      Guidelines:
      1. Answer based ONLY on the provided data.
      2. Be polite, professional, and friendly.
      3. If the answer isn't in the data, ask them to contact via Instagram or KakaoTalk.
      4. Respond in the language the user is using (Korean or English).
      5. Keep answers concise.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now. Please try again later.";
  }
};
