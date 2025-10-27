import { GoogleGenAI, Modality } from "@google/genai";

// The API key MUST be obtained exclusively from the environment variable process.env.API_KEY.
// Assume this variable is pre-configured and accessible.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key (process.env.API_KEY) is not set. Image generation will fail.");
}

// Initialize with a check for API_KEY to avoid runtime errors if it's truly missing.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateStyleGuide = async (theme: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. Check API Key configuration.");
  }
  try {
    const prompt = `Based on the theme "${theme}", create a concise but detailed artistic style guide for a cohesive chess set. Describe the overall mood, color palette, key materials (e.g., polished obsidian, weathered bone, glowing neon), recurring motifs, and lighting style. The output must be a single, descriptive paragraph focusing on visual elements.`;
    
    console.log(`Generating style guide for theme: "${theme}"`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating style guide via Gemini API:", error);
    throw new Error("Failed to generate the art style guide.");
  }
};


export const generateChessPieceImage = async (prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. Check API Key configuration.");
  }

  try {
    console.log(`Generating image with prompt: "${prompt}"`);
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001', // Upgraded model for higher quality
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }, // JPEG is generally smaller
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      console.error("No image generated or invalid response structure:", response);
      throw new Error("No image data received from Gemini API.");
    }
  } catch (error) {
    console.error("Error generating image via Gemini API:", error);
    let errorMessage = "Failed to generate image.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Attempt to extract more specific error message from Gemini response if available
    const geminiError = (error as any)?.response?.data?.error?.message || (error as any)?.message;
    if (geminiError) {
        throw new Error(`Gemini API Error: ${geminiError}`);
    }
    throw new Error(errorMessage);
  }
};

// Helper to convert data URL to a generative part for multimodal requests
const fileToGenerativePart = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL. Expected format: data:mime/type;base64,data');
  }
  const mimeType = match[1];
  const data = match[2];
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

export const editChessPieceImage = async (base64ImageData: string, prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. Check API Key configuration.");
  }

  try {
    console.log(`Editing image with prompt: "${prompt}"`);
    
    const imagePart = fileToGenerativePart(base64ImageData);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });
    
    // The edited image is expected in the first candidate's content parts.
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const mimeType = part.inlineData.mimeType;
        // Reconstruct the data URL for rendering in the browser.
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    console.error("No image data found in edit response:", response);
    throw new Error("No image data received from Gemini API after edit.");

  } catch (error) {
    console.error("Error editing image via Gemini API:", error);
    let errorMessage = "Failed to edit image.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Attempt to extract more specific error message from Gemini response if available
    const geminiError = (error as any)?.response?.data?.error?.message || (error as any)?.message;
    if (geminiError) {
        throw new Error(`Gemini API Error: ${geminiError}`);
    }
    throw new Error(errorMessage);
  }
};
