import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

async function isAuthenticated(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}

// 1. GET: Fetch all team members
export async function GET(req: Request) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all admins but exclude passwords for security
    const members = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        contactNumber: true,
        profilePicture: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Add a new team member
export async function POST(req: Request) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, contactNumber, profilePicture } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    // Check if member already exists
    const existingMember = await prisma.admin.findUnique({ where: { email } });
    if (existingMember) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newMember = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "SUPPORT", // Default fallback role
        contactNumber: contactNumber || null,
        profilePicture: profilePicture || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        contactNumber: true,
        profilePicture: true,
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 3. PUT: Update a team member (e.g., change role)
// 3. PUT: Update a team member (Edit Details & Change Role)
export async function PUT(req: Request) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, email, role, contactNumber, profilePicture } = body;

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const updatedMember = await prisma.admin.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(profilePicture !== undefined && { profilePicture }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        contactNumber: true,
        profilePicture: true,
      },
    });

    return NextResponse.json(updatedMember, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update member:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
// 4. DELETE: Remove a team member
export async function DELETE(req: Request) {
  if (!(await isAuthenticated(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Extract ID from the search params (e.g., /api/admin/members?id=123)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Member deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to create member:", error);
    return NextResponse.json({ error: error.message || "Unknown error occurred" }, { status: 500 });
  }
}