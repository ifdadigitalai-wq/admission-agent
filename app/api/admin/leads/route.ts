// app/api/admin/leads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Lead fetch error:", JSON.stringify(error, null, 2)); //  detailed log
    return NextResponse.json({ error: String(error) }, { status: 500 }); //  return real error
  }
}
