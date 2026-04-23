import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/middleware";

export async function GET(req: NextRequest) {
  try {
    const admin = requireRole(req, "analytics");

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
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}