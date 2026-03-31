import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this");
async function verifyAdmin(req: NextRequest) {
  try {
    const token = req.cookies.get("admin_token")?.value || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch { return null; }
}
const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    totalLeads,
    pendingLeads,
    contactedLeads,
    convertedLeads,
    rejectedLeads,
    totalAppointments,
    scheduledAppointments,
    completedAppointments,
    cancelledAppointments,
    callAppointments,
    visitAppointments,
    leadsByCourse,
    recentLeads,
    recentAppointments,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "PENDING" } }),
    prisma.lead.count({ where: { status: "CONTACTED" } }),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.lead.count({ where: { status: "REJECTED" } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "SCHEDULED" } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.appointment.count({ where: { type: "CALL" } }),
    prisma.appointment.count({ where: { type: "VISIT" } }),
    prisma.lead.groupBy({ by: ["course"], _count: { course: true }, orderBy: { _count: { course: "desc" } } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.appointment.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return NextResponse.json({
    leads: {
      total: totalLeads,
      pending: pendingLeads,
      contacted: contactedLeads,
      converted: convertedLeads,
      rejected: rejectedLeads,
    },
    appointments: {
      total: totalAppointments,
      scheduled: scheduledAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      calls: callAppointments,
      visits: visitAppointments,
    },
    leadsByCourse,
    recentLeads,
    recentAppointments,
  });
}