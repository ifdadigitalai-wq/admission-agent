import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchSimilarFaqs } from "@/lib/ai/embeddings";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function getAIResponse(message: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let faqContext = "";

    try {
      // Try semantic search first
      const relevantFaqs = await searchSimilarFaqs(message, 3);
      faqContext = relevantFaqs
        .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
        .join("\n\n");
    } catch (embeddingError) {
      console.warn("⚠️ Embedding search failed, falling back to all FAQs:", embeddingError);

      // Fallback — fetch all FAQs directly
      const allFaqs = await prisma.faq.findMany();
      faqContext = allFaqs
        .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
        .join("\n\n");
    }

    if (!faqContext) {
      return "I don't have enough information to answer that. Please contact our admissions team.";
    }

    const prompt = `
You are a professional AI admission assistant for an institute.

Here is the knowledge base for this query:
${faqContext}

Rules:
- Answer ONLY from the above knowledge base
- Be short, clear, and helpful
- If the answer is not found, say: "Please contact our admissions team for more details"

User Question: ${message}
`;

    const result = await model.generateContent(prompt);
    return result.response.text() || "No response";

  } catch (error) {
    console.error("AI Error:", error);
    return "Error generating response";
  }
}