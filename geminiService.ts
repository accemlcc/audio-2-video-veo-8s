import { GoogleGenAI } from "@google/genai";

// Initialize with a dummy key if process.env is not immediately available,
// but we will always create a fresh instance before calls to ensure the latest key is used.
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAudioForPrompt = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getClient();
  
  const systemInstruction = `You are an expert creative director for music videos and abstract cinema. 
  Your task is to listen to audio clips and describe a stunning, high-quality visual scene that perfectly matches the mood, rhythm, and atmosphere of the audio.
  The output will be used as a prompt for a video generation AI (Veo).
  
  Guidelines:
  - Focus on visual elements: lighting, colors, camera movement, and subject matter.
  - Use keywords like "cinematic", "4k", "highly detailed", "atmospheric".
  - Keep the description under 80 words.
  - Do not mention "sound" or "audio" in the description itself; describe what is SEEN.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Audio,
            },
          },
          {
            text: "Create a visual video generation prompt based on this audio.",
          },
        ],
      },
    });

    return response.text || "A futuristic abstract scene pulsing with neon colors.";
  } catch (error) {
    console.error("Error analyzing audio:", error);
    throw new Error("Failed to analyze audio content.");
  }
};

export const generateVeoVideo = async (prompt: string): Promise<string> => {
  const ai = getClient();

  try {
    console.log("Starting Veo generation with prompt:", prompt);
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9',
      }
    });

    console.log("Video operation started:", operation);

    // Poll for completion
    while (!operation.done) {
      console.log("Polling Veo status...");
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    console.log("Video generation complete:", operation);

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
      throw new Error("No video URI returned from generation.");
    }

    // Fetch the video content using the API key to avoid playback issues with authenticated URLs
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw new Error("Video generation failed. Please ensure you are using a paid billing project enabled for Veo.");
  }
};