import { NextRequest } from "next/server";
import { verifyToken, AdminPayload } from "./jwt";
import { hasPermission, Feature } from "./permissions";

export function getAdminFromRequest(req: NextRequest): AdminPayload | null {
  const authHeader = req.headers.get("authorization");
  const cookie = req.cookies.get("admin_token")?.value;

  if (process.env.NODE_ENV !== "production") {
    console.log("[auth] incoming authorization:", authHeader);
    console.log("[auth] incoming admin_token cookie present:", !!cookie);
  }

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const verified = verifyToken(token);
    if (process.env.NODE_ENV !== "production") console.log("[auth] verifyToken(authorization) =>", !!verified);
    if (verified) return verified;
  }

  if (cookie) {
    const verified = verifyToken(cookie);
    if (process.env.NODE_ENV !== "production") console.log("[auth] verifyToken(cookie) =>", !!verified);
    if (verified) return verified;
  }

  return null;
}

export function requireAdmin(req: NextRequest): AdminPayload {
  const admin = getAdminFromRequest(req);
  if (!admin) throw new Error("Unauthorized");
  return admin;
}

/**
 * Verify the request is from an authenticated admin with permission
 * to access the specified feature. Throws "Unauthorized" or "Forbidden".
 */
export function requireRole(req: NextRequest, feature: Feature): AdminPayload {
  const admin = getAdminFromRequest(req);
  if (!admin) throw new Error("Unauthorized");
  if (!hasPermission(admin.role, feature)) throw new Error("Forbidden");
  return admin;
}