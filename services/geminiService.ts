
import { GoogleGenAI } from "@google/genai";
import { Selections } from "../types";

// Always initialize with named parameter and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAICommentary = async (userName: string, selections: Selections) => {
  const selectionSummary = Object.entries(selections)
    .map(([category, winner]) => `${category}: ${winner}`)
    .join("\n");

  const prompt = `
    I am participating in a Workplace Oscar Pool. My name is ${userName}.
    Here are my predictions for the 2025 Oscars:
    ${selectionSummary}

    Act as a high-end, witty Film Critic. Provide a short, max 25-word "Review" of my ballot. 
    Be opinionated and mention at least one film title. 
    The tone should be sharp, cinematic, and fun. 
    Do NOT use more than 2 sentences.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });
    
    // Direct .text property access as per guidelines
    return response.text || "A bold, if slightly unhinged, collection of predictions.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Academy is stunned by your vision.";
  }
};
