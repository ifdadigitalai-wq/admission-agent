import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/middleware";

// ✅ Add the second 'context' parameter, even if empty, to satisfy the RouteHandler type
export async function GET(
  req: NextRequest, 
  context: any // Adding this satisfies the strict Type Check in Next.js 16
) {
  try {
    const admin = requireRole(req, "conversations");

    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, 
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}