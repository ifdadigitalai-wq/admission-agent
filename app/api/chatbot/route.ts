import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai/llm";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    console.log("User message:", message);

    const reply = await getAIResponse(message);
    console.log("AI reply:", reply);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({ error: "Something went wrong" });
  }
}