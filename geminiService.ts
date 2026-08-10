
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FoodItem } from "./types";

const FOOD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the food item" },
          calories: { type: Type.NUMBER, description: "Calories in kcal" },
          protein: { type: Type.NUMBER, description: "Protein in grams" },
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
          fat: { type: Type.NUMBER, description: "Total fat in grams" },
          fiber: { type: Type.NUMBER, description: "Fiber in grams" },
        },
        required: ["name", "calories", "protein", "carbs", "fat", "fiber"],
        propertyOrdering: ["name", "calories", "protein", "carbs", "fat", "fiber"],
      },
    },
  },
  required: ["items"],
  propertyOrdering: ["items"],
};

export const extractNutrition = async (
  text: string,
  imageB64?: string,
  audioB64?: string,
  history?: { name: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }[]
): Promise<FoodItem[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Format history for the prompt to ensure consistency
  const historyContext = history && history.length > 0 
    ? `\n\nFor consistency, refer to the user's previous logs. If the current item matches one of these, use similar nutritional values unless the portion seems significantly different: ${JSON.stringify(history.slice(0, 30))}`
    : "";

  const parts: any[] = [
    { text: `Analyze the following food log. Identify each distinct food item and provide estimated nutrition (calories, protein, carbs, fat, fiber). User input: "${text || 'See attached media'}"${historyContext}` }
  ];

  if (imageB64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageB64.split(",")[1] || imageB64,
      },
    });
  }

  if (audioB64) {
    parts.push({
      inlineData: {
        mimeType: "audio/webm",
        data: audioB64.split(",")[1] || audioB64,
      },
    });
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: FOOD_SCHEMA,
    },
  });

  try {
    const jsonStr = response.text;
    if (!jsonStr) return [];
    
    const parsed = JSON.parse(jsonStr.trim());
    const rawItems = Array.isArray(parsed) ? parsed : (parsed.items || []);
    
    return rawItems.map((item: any) => ({
      name: item.name || "Unknown Item",
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      fiber: Number(item.fiber) || 0,
      id: Math.random().toString(36).substr(2, 9),
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};
