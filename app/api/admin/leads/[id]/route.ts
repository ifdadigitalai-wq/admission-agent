import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status, notes } = await req.json();

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: { status, notes },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}