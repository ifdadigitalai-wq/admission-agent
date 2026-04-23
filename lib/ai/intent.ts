import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type LeadInfo = {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  collected: boolean;
};
export type IntentResult = {
  intent:
    | "faq"
    | "lead_collection"
    | "greeting"
    | "out_of_scope"
    | "lead_complete";
  missingFields: string[];
  extractedInfo: LeadInfo;
  shouldAskForInfo: boolean;
};

// Extract any lead info the user may have already shared
export async function extractLeadInfo(
  message: string,
  existingInfo: LeadInfo
): Promise<LeadInfo> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are a data extraction assistant. Extract any personal information from the user message.

Existing info already collected: ${JSON.stringify(existingInfo)}

User message: "${message}"

Extract and return ONLY a JSON object with these fields (keep existing values if not mentioned):
{
  "name": "full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "course": "match to one of these exact names if mentioned: Basic Computer, Advance Excel, Spoken English, DCA, MDCA, Python Core, Python Advance, Python with Machine Learning, Python with Data Science, Website Designing, Website Development, Full Stack Development, MERN Stack, UI UX, Graphic Designing, Video Editing, Digital Marketing, Master Digital Marketing, Tally, Corporate E-Accounting, Data Analytics, Master Data Analytics, Stock Market, Diploma in Financial Market, or null if not mentioned"
}

Return ONLY raw JSON. No explanation. No markdown.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const extracted = JSON.parse(text);

    return {
      name: extracted.name || existingInfo.name,
      email: extracted.email || existingInfo.email,
      phone: extracted.phone || existingInfo.phone,
      course: extracted.course || existingInfo.course,
      collected: false,
    };
  } catch {
    return existingInfo;
  }
}

// Detect what the user is trying to do
export async function detectIntent(message: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Classify this user message into exactly ONE intent.

INTENT DEFINITIONS:
- "courses" → wants to see/know about courses, programs, what's offered, course list, view courses, show courses, available programs
- "greeting" → hi, hello, hey, good morning, namaste, how are you
- "faq" → fees, cost, price, how much, eligibility, duration, documents, certificates, EMI, batch, timing, schedule of classes
- "interest" → wants to enroll, join, register, apply, take admission, I want to do a course
- "schedule" → book a call, schedule meeting, visit campus, talk to counselor, appointment, call me
- "out_of_scope" → completely unrelated to education, institute, or learning

STRICT RULES:
- "courses" ALWAYS wins if message has: course, program, offer, available, show, list, what do you teach, subjects
- NEVER return "out_of_scope" for anything education-related
- Return ONLY the single word, nothing else

Message: "${message}"

Reply with ONE word only: courses, greeting, faq, interest, schedule, out_of_scope
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim().toLowerCase().replace(/[^a-z_]/g, "");

    // ✅ Keyword safety net — never let course queries fall through
    const msgLower = message.toLowerCase();
    if (["course", "program", "offer", "what do you", "show me", "available", "list"].some(k => msgLower.includes(k))) {
      return "courses";
    }
    if (["fee", "cost", "price", "how much", "emi", "eligib", "duration", "timing"].some(k => msgLower.includes(k))) {
      return "faq";
    }
    if (["enroll", "join", "register", "apply", "admission"].some(k => msgLower.includes(k))) {
      return "interest";
    }
    if (["call", "visit", "schedule", "appointment", "meet"].some(k => msgLower.includes(k))) {
      return "schedule";
    }

    return raw || "faq";
  } catch {
    return "faq";
  }
}

// Get the next question to ask based on missing fields
export function getNextQuestion(leadInfo: LeadInfo): string | null {
  if (!leadInfo.name) return "How about knowing your name first? It helps me to reach you better when you join us!😃";
  if (!leadInfo.phone) return "Could you please share your phone number?";
  if (!leadInfo.email) return "What's your email address?";
  if (!leadInfo.course) return "Which course are you interested in? We offer programs in IT, Accounts, Data Science, Digital Marketing, Stock Market, and more — just tell me your interest area!";
  return null;
}
export function isLeadComplete(leadInfo: LeadInfo): boolean {
  return !!(
    leadInfo.name &&
    leadInfo.email &&
    leadInfo.phone &&
    leadInfo.course
  );
}