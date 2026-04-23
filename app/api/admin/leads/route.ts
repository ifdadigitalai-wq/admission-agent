// app/api/admin/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const admin = requireRole(req, "leads");
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Lead fetch error:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
