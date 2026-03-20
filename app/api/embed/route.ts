import { NextResponse } from "next/server";
import { embedAllFaqs } from "@/lib/ai/embeddings";

export async function GET() {
  try {
    await embedAllFaqs();
    return NextResponse.json({ message: " All FAQs embedded successfully!" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to embed FAQs" }, { status: 500 });
  }
}