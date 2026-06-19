import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.log("No API key found.");
  process.exit(1);
}

console.log("Found API key starting with: " + apiKey.substring(0, 5));

const ai = new GoogleGenAI({ 
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello",
    });
    console.log("Success:", response.text);
  } catch (error: any) {
    console.error("Failed:", error.message);
  }
}

run();
