import { GoogleGenerativeAI } from "@google/generative-ai";
import openai from "openai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const openaiClient = new openai.OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
// you can use openaiclient to call it in place of genAI if you want to switch to openai's models instead of google's gemini
// simply comment out genAI related code and uncomment the openaiClient code in getAIResponse function
export type LeadInfo = {
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  collected: boolean; // true when all required fields are gathered
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

Extract and return ONLY a JSON object with these fields (keep existing values if not mentioned in message):
{
  "name": "full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "course": "course they are interested in (Data Science, Finance, Programming) or null"
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
Classify the following user message into one of these intents:
- "greeting" → user is saying hi, hello, hey etc.
- "faq" → user is asking about courses, fees, eligibility, duration, admission, documents
- "schedule" → user wants to book a call, schedule a meeting, visit campus, talk to someone, book appointment
- "interest" → user wants to enroll, apply, register, or know how to join
- "out_of_scope" → message is unrelated to education/admission

User message: "${message}"

Reply with ONLY one word: greeting,schedule, faq, interest, or out_of_scope
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim().toLowerCase();
  } catch {
    return "faq";
  }
}

// Get the next question to ask based on missing fields
export function getNextQuestion(leadInfo: LeadInfo): string | null {
  if (!leadInfo.name) {
    return "May I know your full name?";
  }
  if (!leadInfo.phone) {
    return "Could you please share your phone number?";
  }
  if (!leadInfo.email) {
    return "What's your email address?";
  }
  if (!leadInfo.course) {
    return "Which course are you interested in? We offer Data Science, Finance, and Programming.";
  }

  return null; // all info collected
}

// Check if all required lead info is collected
export function isLeadComplete(leadInfo: LeadInfo): boolean {
  return !!(
    leadInfo.name &&
    leadInfo.email &&
    leadInfo.phone &&
    leadInfo.course
  );
}
