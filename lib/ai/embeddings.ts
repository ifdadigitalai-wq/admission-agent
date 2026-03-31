
import { GoogleGenerativeAI } from "@google/generative-ai";
// import openai from "openai";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// const openaiClient = new openai.OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// Generate embedding for any text using Gemini
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Store embeddings for all FAQs in the DB
export async function embedAllFaqs() {
  const faqs = await prisma.faq.findMany();

  for (const faq of faqs) {
    const text = `${faq.question} ${faq.answer}`;
    const embedding = await generateEmbedding(text);

    // Store as pgvector using raw query
    await prisma.$executeRaw`
      UPDATE "Faq"
      SET embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${faq.id}
    `;

    console.log(` Embedded FAQ: ${faq.question}`);
  }

  console.log(" All FAQs embedded successfully!");
}

// Find the most similar FAQs to a user query
export async function searchSimilarFaqs(
  query: string,
  topK: number = 3
): Promise<{ question: string; answer: string }[]> {
  const queryEmbedding = await generateEmbedding(query);

  // Use pgvector cosine similarity search
  const results = await prisma.$queryRaw<{ question: string; answer: string }[]>`
    SELECT question, answer
    FROM "Faq"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${topK}
  `;

  return results;
}
