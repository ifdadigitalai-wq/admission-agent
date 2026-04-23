import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type ParsedEntry = {
  question: string;
  answer: string;
};

/**
 * Parse a file buffer into Q&A pairs based on file type.
 * The file is never stored — only its parsed content is used.
 */
export async function parseKnowledgeFile(
  buffer: Buffer,
  fileType: string
): Promise<ParsedEntry[]> {
  switch (fileType.toLowerCase()) {
    case "csv":
      return parseCsv(buffer.toString("utf-8"));
    case "json":
      return parseJson(buffer.toString("utf-8"));
    case "txt":
      return parseTxt(buffer.toString("utf-8"));
    case "pdf":
      return parsePdf(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * CSV: expects two columns — question, answer.
 * Handles quoted fields and commas inside quotes.
 */
function parseCsv(content: string): ParsedEntry[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const entries: ParsedEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row
    if (i === 0) {
      const lower = line.toLowerCase();
      if (lower.includes("question") && lower.includes("answer")) continue;
    }

    // Parse CSV fields (handles quoted commas)
    const fields = parseCsvLine(line);
    if (fields.length >= 2 && fields[0].trim() && fields[1].trim()) {
      entries.push({
        question: fields[0].trim(),
        answer: fields[1].trim(),
      });
    }
  }

  return entries;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * JSON: expects an array of { question, answer } objects.
 */
function parseJson(content: string): ParsedEntry[] {
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error(
      'JSON must be an array of { "question": "...", "answer": "..." } objects'
    );
  }

  return data
    .filter(
      (item: any) =>
        item &&
        typeof item.question === "string" &&
        typeof item.answer === "string" &&
        item.question.trim() &&
        item.answer.trim()
    )
    .map((item: any) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }));
}

/**
 * TXT: Uses Gemini AI to extract Q&A pairs from unstructured text.
 * This handles any text format — paragraphs, bullet points, etc.
 */
async function parseTxt(content: string): Promise<ParsedEntry[]> {
  if (!content.trim()) return [];

  // If the text already has Q:/A: or Q./A. formatting, try simple parse first
  const simpleParsed = trySimpleTxtParse(content);
  if (simpleParsed.length > 0) return simpleParsed;

  // Use Gemini to extract Q&A pairs from unstructured text
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Chunk large texts to avoid token limits
  const chunks = chunkText(content, 6000);
  const allEntries: ParsedEntry[] = [];

  for (const chunk of chunks) {
    const prompt = `
You are a knowledge extraction assistant. Extract question-answer pairs from the following text.
Convert every piece of factual information into a clear question and its answer.

TEXT:
${chunk}

Return ONLY a valid JSON array of objects with "question" and "answer" fields.
Example: [{"question": "What is X?", "answer": "X is ..."}, ...]

Rules:
- Extract ALL factual information as Q&A pairs
- Questions should be natural and conversational
- Answers should be complete and self-contained
- Return ONLY raw JSON, no markdown, no backticks, no explanation
`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const clean = raw.replace(/^```json|^```|```$/gm, "").trim();
      const parsed = JSON.parse(clean);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.question?.trim() && item.answer?.trim()) {
            allEntries.push({
              question: item.question.trim(),
              answer: item.answer.trim(),
            });
          }
        }
      }
    } catch {
      // If AI parsing fails for this chunk, skip it
      console.error("Failed to parse text chunk with AI");
    }
  }

  return allEntries;
}

/**
 * Try simple Q:/A: or Q./A. pattern parsing for well-formatted txt files.
 */
function trySimpleTxtParse(content: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Pattern: "Q: ... A: ..." or "Question: ... Answer: ..."
  const blocks = content.split(/\n\s*\n/);
  for (const block of blocks) {
    const qMatch = block.match(
      /(?:^|\n)\s*(?:Q|Question)\s*[:.]?\s*(.+?)(?:\n|$)/i
    );
    const aMatch = block.match(
      /(?:^|\n)\s*(?:A|Answer)\s*[:.]?\s*(.+?)(?:\n\s*(?:Q|Question)|$)/
    );

    if (qMatch && aMatch && qMatch[1].trim() && aMatch[1].trim()) {
      entries.push({
        question: qMatch[1].trim(),
        answer: aMatch[1].trim(),
      });
    }
  }

  return entries;
}

/**
 * PDF: Extract text from PDF and then use AI to create Q&A pairs.
 */
async function parsePdf(buffer: Buffer): Promise<ParsedEntry[]> {
  // Dynamic import for pdf-parse
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default || mod;

  const data = await pdfParse(buffer);
  const text = data.text;

  if (!text.trim()) {
    throw new Error("PDF appears to be empty or contains only images");
  }

  // Reuse the txt parser for the extracted text
  return parseTxt(text);
}

/**
 * Split text into chunks of roughly maxChars characters,
 * breaking at paragraph boundaries.
 */
function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}
