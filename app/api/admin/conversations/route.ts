import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this");

async function verifyAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch { return null; }
}

// ✅ Add the second 'context' parameter, even if empty, to satisfy the RouteHandler type
export async function GET(
  req: NextRequest, 
  context: any // Adding this satisfies the strict Type Check in Next.js 16
) {
  const admin = await verifyAdmin(req);
  
  // Basic Auth Check
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}