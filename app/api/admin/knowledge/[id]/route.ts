import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/middleware";

// DELETE: Remove a knowledge file record and its associated FAQ entries
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(req, "knowledge");

    const { id } = await params;

    // Find the knowledge file
    const knowledgeFile = await prisma.knowledgeFile.findUnique({
      where: { id },
    });

    if (!knowledgeFile) {
      return NextResponse.json(
        { error: "Knowledge file not found" },
        { status: 404 }
      );
    }

    // Delete all FAQ entries associated with this upload
    await prisma.$executeRaw`
      DELETE FROM "Faq" WHERE source = ${`upload:${id}`}
    `;

    // Delete the knowledge file record
    await prisma.knowledgeFile.delete({ where: { id } });

    return NextResponse.json({
      message: `Deleted ${knowledgeFile.filename} and ${knowledgeFile.entries} associated FAQ entries`,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Knowledge delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge file" },
      { status: 500 }
    );
  }
}
