// lib/whatsapp/session.ts
import { prisma } from "@/lib/db/prisma";

export async function getSession(phone: string) {
  let session = await prisma.whatsAppSession.findUnique({ where: { phone } });

  if (!session) {
    session = await prisma.whatsAppSession.create({
      data: { phone },
    });
  }

  return {
    ...session,
    leadInfo: session.leadInfo as any,
    scheduleData: session.scheduleData as any,
    availableDates: session.availableDates as any,
  };
}

export async function updateSession(phone: string, data: Partial<{
  leadInfo: any;
  isEnrolling: boolean;
  isScheduling: boolean;
  schedulingStep: string | null;
  scheduleData: any;
  availableDates: any;
}>) {
  return prisma.whatsAppSession.upsert({
    where: { phone },
    update: { ...data, updatedAt: new Date() },
    create: { phone, ...data },
  });
}

export async function clearSession(phone: string) {
  return prisma.whatsAppSession.upsert({
    where: { phone },
    update: {
      leadInfo: {},
      isEnrolling: false,
      isScheduling: false,
      schedulingStep: null,
      scheduleData: {},
      availableDates: [],
    },
    create: { phone },
  });
}