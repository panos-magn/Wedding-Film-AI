import { GoogleGenAI } from "@google/genai";
async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: "AIzaSyFakeKey12345" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log(response.text);
  } catch (err: any) {
    console.log("FAILED WITH NAME:", err.name, "MESSAGE:", err.message);
  }
}
run();
