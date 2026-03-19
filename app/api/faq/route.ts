import { prisma } from "@/lib/db/prisma"; // your prisma.ts file
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const faqs = await prisma.faq.findMany();

    return NextResponse.json(faqs);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}