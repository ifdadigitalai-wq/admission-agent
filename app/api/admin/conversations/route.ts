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

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);

  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // last message preview
      },
    },
  });

  return NextResponse.json(conversations);
}