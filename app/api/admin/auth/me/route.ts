import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth/middleware";
import { verifyToken } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookie = req.cookies.get("admin_token")?.value;

  if (process.env.NODE_ENV !== "production") {
    console.log("[me] incoming authorization:", authHeader);
    console.log("[me] incoming admin_token cookie present:", !!cookie);
  }

  const admin = getAdminFromRequest(req);
  if (!admin) {
    if (process.env.NODE_ENV !== "production") {
      const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const headerValid = headerToken ? !!verifyToken(headerToken) : false;
      const cookieValid = cookie ? !!verifyToken(cookie) : false;
      console.log("[me] verify headerValid:", headerValid, "cookieValid:", cookieValid);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ admin });
}