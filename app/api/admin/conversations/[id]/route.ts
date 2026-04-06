import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db/prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this"
);

async function verifyAdmin(req: NextRequest) {
  try {
    const token =
      req.cookies.get("admin_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params is a Promise in Next.js 15
) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // ✅ await params before accessing id

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
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}