import { Project, AIModuleConfig } from "../types";
import { auth } from "./firebase";

export interface AIGenerationResponse {
  text: string;
  aiCreditsUsed?: number;
  aiCreditsLimit?: number;
}

export async function generateAIContent(
  config: AIModuleConfig,
  project: Project,
  userInputs: Record<string, string>,
  userId: string,
  customGeminiApiKey?: string,
  customOpenAiApiKey?: string,
  aiProvider?: "gemini" | "openai"
): Promise<AIGenerationResponse> {
  try {
    const token = await auth.currentUser?.getIdToken();
    
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        config,
        project,
        userInputs,
        userId,
        customGeminiApiKey,
        customOpenAiApiKey,
        aiProvider,
      }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      throw new Error(data?.error || `Server returned status code ${response.status}`);
    }

    return {
      text: data?.text || "No response generated.",
      aiCreditsUsed: data?.aiCreditsUsed,
      aiCreditsLimit: data?.aiCreditsLimit,
    };
  } catch (error) {
    console.error("Failed to generate content through proxy:", error);
    throw error;
  }
}
