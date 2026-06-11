import { Project, AIModuleConfig } from "../types";

export async function generateAIContent(
  config: AIModuleConfig,
  project: Project,
  userInputs: Record<string, string>,
  userId: string
): Promise<string> {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config,
        project,
        userInputs,
        userId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned status code ${response.status}`);
    }

    const data = await response.json();
    return data.text || "No response generated.";
  } catch (error) {
    console.error("Failed to generate content through proxy:", error);
    throw error;
  }
}
