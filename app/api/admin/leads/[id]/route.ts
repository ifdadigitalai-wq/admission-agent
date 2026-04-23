import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/middleware";

// ✅ Explicitly type the context as a Promise for Next.js 15/16
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireRole(req, "leads");
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.conversation.update({
      where: { id },
      data: { unread: 0 },
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Conversation fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// ✅ Apply the same fix to DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = requireRole(req, "leads");
    const { id } = await params;

    await prisma.conversationMessage.deleteMany({
      where: { conversationId: id },
    });

    await prisma.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}