import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getAIResponse(message: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
You are an AI admission assistant for an institute.

Only answer questions about:
- courses
- fees
- eligibility
- admissions

If unrelated, politely refuse.

User: ${message}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response || "No response from AI";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating response";
  }
}