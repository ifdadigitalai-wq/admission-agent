import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const courses = await prisma.course.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(courses);
}