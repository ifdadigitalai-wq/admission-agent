import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/middleware";
import { parseKnowledgeFile } from "@/lib/ai/knowledge-parser";
import { embedNewFaqs } from "@/lib/ai/embeddings";

// GET: List all uploaded knowledge files in chronological order
export async function GET(req: NextRequest) {
  try {
    requireRole(req, "knowledge");

    const files = await prisma.knowledgeFile.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Knowledge list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge files" },
      { status: 500 }
    );
  }
}

// POST: Upload and process a knowledge file
export async function POST(req: NextRequest) {
  try {
    const admin = requireRole(req, "knowledge");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const allowedTypes = ["txt", "csv", "json", "pdf"];

    if (!allowedTypes.includes(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: .${ext}. Allowed: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Create a record of the upload
    const knowledgeFile = await prisma.knowledgeFile.create({
      data: {
        filename: fileName,
        fileType: ext,
        fileSize: file.size,
        uploadedBy: admin.name || admin.email,
        status: "processing",
      },
    });

    // Read file into buffer (file is NOT stored on disk)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      // Parse the file into Q&A pairs
      const entries = await parseKnowledgeFile(buffer, ext);

      if (entries.length === 0) {
        await prisma.knowledgeFile.update({
          where: { id: knowledgeFile.id },
          data: {
            status: "failed",
            error: "No Q&A entries could be extracted from this file",
          },
        });
        return NextResponse.json(
          { error: "No Q&A entries could be extracted from this file", file: knowledgeFile },
          { status: 400 }
        );
      }

      // Insert FAQ entries with source tracking
      const createdFaqs = await Promise.all(
        entries.map((entry) =>
          prisma.faq.create({
            data: {
              question: entry.question,
              answer: entry.answer,
              source: `upload:${knowledgeFile.id}`,
            },
          })
        )
      );

      const faqIds = createdFaqs.map((f) => f.id);

      // Generate embeddings for the new entries
      try {
        await embedNewFaqs(faqIds);
      } catch (embedError) {
        console.error("Embedding error (entries still saved):", embedError);
        // Entries are saved even if embedding fails — they'll be picked up
        // by fallback plain-text search in the chatbot
      }

      // Update the knowledge file record
      const updatedFile = await prisma.knowledgeFile.update({
        where: { id: knowledgeFile.id },
        data: {
          status: "completed",
          entries: entries.length,
          error: null,
        },
      });

      return NextResponse.json({
        message: `Successfully processed ${entries.length} Q&A entries from ${fileName}`,
        file: updatedFile,
        entriesCount: entries.length,
      });
    } catch (parseError: any) {
      // Mark file as failed
      await prisma.knowledgeFile.update({
        where: { id: knowledgeFile.id },
        data: {
          status: "failed",
          error: parseError.message || "Failed to parse file",
        },
      });

      return NextResponse.json(
        { error: `Failed to process file: ${parseError.message}`, file: knowledgeFile },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error.message === "Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Knowledge upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
