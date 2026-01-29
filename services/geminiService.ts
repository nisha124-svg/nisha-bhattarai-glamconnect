import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBeautyAdvice = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a professional, friendly, and trendy beauty assistant for a salon booking app called GlamConnect. 
      Your tone should be feminine, encouraging, and expert.
      
      User Query: "${query}"
      
      Provide a concise, helpful answer (max 3 sentences). 
      If they ask about services, recommend generic types like "Hydrating Facial" or "Balayage" but don't promise specific prices.`,
    });

    return response.text || "I'm having a bad hair day and can't answer right now. Try again later!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oops! My beauty connection is a bit fuzzy. Please try asking again.";
  }
};