import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchSimilarFaqs } from "@/lib/ai/embeddings";
import { prisma } from "@/lib/db/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type ChatComponent =
  | { type: "text"; content: string }
  | { type: "carousel"; items: CourseCard[] }
  | { type: "course_detail"; course: CourseDetail }
  | { type: "quick_replies"; options: string[] };

export type CourseCard = {
  id: string;
  name: string;
  fee: string;
  tag?: string;
  category?: string;
};

export type CourseDetail = {
  name: string;
  fee: string;
  duration?: string;
  description?: string;
};

export type StructuredResponse = {
  components: ChatComponent[];
};

export async function getAIResponse(
  message: string,
  leadInfo?: any
): Promise<StructuredResponse> {
  console.log("🔥 getAIResponse called at", new Date().toISOString(), "| message:", message.slice(0, 30));
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    let faqContext = "";
    try {
      const relevantFaqs = await searchSimilarFaqs(message, 5);
      faqContext = relevantFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    } catch {
      const allFaqs = await prisma.faq.findMany({ take: 10 });
      faqContext = allFaqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    }

    const userName = leadInfo?.name ? leadInfo.name.split(" ")[0] : null;
    const interestedCourse = leadInfo?.course || null;

    const prompt = `
You are IDFA Advisor, a warm admission counselor at IFDA Digital AI Institute.

YOUR KNOWLEDGE BASE (answer ONLY from this):
${faqContext}

${userName ? `Student's name: ${userName}.` : ""}
${interestedCourse ? `They are interested in: ${interestedCourse}.` : ""}

RESPONSE FORMAT — Always respond with ONLY a valid JSON object. No markdown, no backticks, no explanation outside JSON.

SCHEMA:
{
  "components": [
    { "type": "text", "content": "string" },
    { "type": "carousel", "items": [{ "id": "string", "name": "string", "fee": "string", "tag": "string", "category": "string" }] },
    { "type": "course_detail", "course": { "name": "string", "fee": "string", "duration": "string", "description": "string" } },
    { "type": "quick_replies", "options": ["string", "string"] }
  ]
}

RULES:
- text: warm, conversational, no bullet points, use student name naturally if known, always end with an open-ended question to encourage replies, add some humour and contextual emojis if appropriate
- carousel: show when user asks about multiple courses — list up to 10, use real fees from knowledge base
- course_detail: show when a specific course is clicked/asked about
- quick_replies: always end with 2–4 relevant follow-up options. Max 4.
- If info not in knowledge base, say warmly to contact admissions team
- Never invent fees or details

BEHAVIOR BY INTENT:
- General FAQ → text + quick_replies
- "Show courses" / broad query → text + carousel + quick_replies
- Specific course selected → text + course_detail + quick_replies: ["💰 Check Fee", "📋 Enroll Now", "🔍 Similar Courses", "📞 Talk to Counselor"]
- Enrollment interest → text + quick_replies: ["📋 Enroll Now", "📞 Schedule a Call", "🏫 Visit Campus"]

Student message: "${message}"
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/^```json|^```|```$/gm, "").trim();

    try {
      return JSON.parse(clean) as StructuredResponse;
    } catch {
      return {
        components: [
          { type: "text", content: clean || "I'm sorry, I couldn't process that. Could you rephrase?" },
          { type: "quick_replies", options: ["📚 View Courses", "📞 Schedule a Call", "🔙 Main Menu"] },
        ],
      };
    }
  } catch (error: any) {
    console.error("AI Error:", error);
    const is429 = error?.status === 429;
    return {
      components: [
        {
          type: "text",
          content: is429
            ? "I'm a little overwhelmed right now! 😊 Please try again in a moment."
            : "I'm so sorry, something went wrong on my end! Could you try again in a moment?",
        },
        { type: "quick_replies", options: ["📚 View Courses", "📞 Schedule a Call"] },
      ],
    };
  }
}