import { NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai/llm";
import {
  detectIntent,
  extractLeadInfo,
  getNextQuestion,
  isLeadComplete,
  LeadInfo,
} from "@/lib/ai/intent";
import { prisma } from "@/lib/db/prisma";
import {
  getAvailableDates,
  AVAILABLE_SLOTS,
  INSTITUTE_ADDRESS,
  bookAppointment,
} from "@/lib/scheduler/calendar";

// ================= SAVE MESSAGE =================
async function saveMessage(
  sessionId: string,
  role: "user" | "bot",
  content: string,
  leadInfo?: any
) {
  await prisma.conversation.upsert({
    where: { sessionId },
    update: {
      updatedAt: new Date(),
      ...(leadInfo?.name && { userName: leadInfo.name }),
      ...(leadInfo?.email && { userEmail: leadInfo.email }),
      ...(leadInfo?.phone && { userPhone: leadInfo.phone }),
      ...(role === "user" && { unread: { increment: 1 } }),
    },
    create: {
      sessionId,
      userName: leadInfo?.name || null,
      userEmail: leadInfo?.email || null,
      userPhone: leadInfo?.phone || null,
      unread: role === "user" ? 1 : 0,
    },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { sessionId },
  });

  if (conversation) {
    await prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role,
        content,
      },
    });
  }
}

// ================= RESPONSE HELPER =================
async function respond(
  sessionId: string | undefined,
  message: string,
  reply: string,
  leadInfo: any,
  extra: any = {}
) {
  if (sessionId) {
    await saveMessage(sessionId, "user", message, leadInfo);
    await saveMessage(sessionId, "bot", reply, leadInfo);
  }

  return NextResponse.json({ reply, leadInfo, ...extra });
}

// ================= SCHEDULING =================
async function handleScheduling(
  message: string,
  body: any,
  leadInfo: any,
  sessionId?: string
) {
  const { schedulingStep, scheduleData = {} } = body;
  const input = message.trim().toLowerCase();
  const dates = body.availableDates || getAvailableDates();

  if (schedulingStep === "choose_type") {
    if (input.includes("call")) {
      const reply = `📞 Great! Let's book a call.\n\nAvailable dates:\n${dates
        .map((d: any, i: number) => `${i + 1}. ${d}`)
        .join("\n")}`;

      return respond(sessionId, message, reply, leadInfo, {
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData: { type: "CALL" },
        availableDates: dates,
      });
    }

    if (input.includes("visit")) {
      const reply = `🏫 Great! Let's book a campus visit.\n\n📍 ${INSTITUTE_ADDRESS.name}\n${INSTITUTE_ADDRESS.address}\n🕐 ${INSTITUTE_ADDRESS.hours}\n\nAvailable dates:\n${dates
        .map((d: any, i: number) => `${i + 1}. ${d}`)
        .join("\n")}`;

      return respond(sessionId, message, reply, leadInfo, {
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData: { type: "VISIT" },
        availableDates: dates,
      });
    }

    return respond(
      sessionId,
      message,
      `Reply with "call" or "visit".`,
      leadInfo,
      { isScheduling: true, schedulingStep: "choose_type" }
    );
  }

  if (schedulingStep === "choose_date") {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= dates.length) {
      return respond(
        sessionId,
        message,
        `Choose between 1 and ${dates.length}.`,
        leadInfo,
        {
          isScheduling: true,
          schedulingStep: "choose_date",
          scheduleData,
          availableDates: dates,
        }
      );
    }

    const selectedDate = dates[index];

    const reply = `✅ Date: ${selectedDate}\n\nAvailable slots:\n${AVAILABLE_SLOTS.map(
      (s, i) => `${i + 1}. ${s}`
    ).join("\n")}`;

    return respond(sessionId, message, reply, leadInfo, {
      isScheduling: true,
      schedulingStep: "choose_time",
      scheduleData: { ...scheduleData, date: selectedDate },
      availableDates: dates,
    });
  }

  if (schedulingStep === "choose_time") {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= AVAILABLE_SLOTS.length) {
      return respond(
        sessionId,
        message,
        `Choose between 1 and ${AVAILABLE_SLOTS.length}.`,
        leadInfo,
        {
          isScheduling: true,
          schedulingStep: "choose_time",
          scheduleData,
        }
      );
    }

    const selectedTime = AVAILABLE_SLOTS[index];

    if (!leadInfo?.name || !leadInfo?.email || !leadInfo?.phone) {
      return respond(
        sessionId,
        message,
        `Almost done! What's your full name?`,
        leadInfo,
        {
          isScheduling: true,
          schedulingStep: "collect_info",
          scheduleData: { ...scheduleData, time: selectedTime },
        }
      );
    }

    const result = await bookAppointment({
      ...scheduleData,
      time: selectedTime,
      ...leadInfo,
    });

    if (!result.success) {
      return respond(
        sessionId,
        message,
        `Slot taken. Choose another.`,
        leadInfo,
        { isScheduling: true, schedulingStep: "choose_time" }
      );
    }

    return respond(
      sessionId,
      message,
      `🎉 Appointment confirmed!`,
      leadInfo,
      { isScheduling: false }
    );
  }

  if (schedulingStep === "collect_info") {
    const updatedLeadInfo = await extractLeadInfo(message, leadInfo);
    const next = getNextQuestion(updatedLeadInfo);

    if (next) {
      return respond(sessionId, message, next, updatedLeadInfo, {
        isScheduling: true,
        schedulingStep: "collect_info",
        scheduleData,
      });
    }

    const result = await bookAppointment({
      ...scheduleData,
      ...updatedLeadInfo,
    });

    if (!result.success) {
      return respond(
        sessionId,
        message,
        `Slot taken. Choose another.`,
        updatedLeadInfo,
        { isScheduling: true, schedulingStep: "choose_time" }
      );
    }

    return respond(
      sessionId,
      message,
      `🎉 Appointment confirmed!`,
      { ...updatedLeadInfo, collected: true },
      { isScheduling: false }
    );
  }

  return respond(sessionId, message, "Scheduling error.", leadInfo);
}

// ================= MAIN API =================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      message,
      leadInfo = {},
      isEnrolling = false,
      isScheduling = false,
      sessionId, // ✅ ADDED
    } = body;

    // Scheduling
    if (isScheduling) {
      return handleScheduling(message, body, leadInfo, sessionId);
    }

    // Enrollment
    if (isEnrolling && !leadInfo.collected) {
      const updatedLeadInfo: LeadInfo = await extractLeadInfo(
        message,
        leadInfo
      );

      const nextQuestion = getNextQuestion(updatedLeadInfo);

      if (nextQuestion) {
        return respond(sessionId, message, nextQuestion, updatedLeadInfo, {
          isEnrolling: true,
        });
      }

      if (isLeadComplete(updatedLeadInfo)) {
        await prisma.lead.create({
          data: {
            name: updatedLeadInfo.name!,
            email: updatedLeadInfo.email!,
            phone: updatedLeadInfo.phone!,
            course: updatedLeadInfo.course!,
          },
        });

        return respond(
          sessionId,
          message,
          `🎉 Registered successfully!`,
          { ...updatedLeadInfo, collected: true },
          { isEnrolling: false }
        );
      }
    }

    // Intent detection
    const intent = await detectIntent(message);

    if (intent === "greeting") {
      return respond(
        sessionId,
        message,
        "👋 Hello! How can I help you?",
        leadInfo
      );
    }

    if (intent === "interest") {
      const updatedLeadInfo = await extractLeadInfo(message, leadInfo);
      const nextQuestion = getNextQuestion(updatedLeadInfo);

      return respond(
        sessionId,
        message,
        `Great! ${nextQuestion}`,
        updatedLeadInfo,
        { isEnrolling: true }
      );
    }

    if (intent === "schedule") {
      return respond(
        sessionId,
        message,
        `Reply with "call" or "visit" to book.`,
        leadInfo,
        {
          isScheduling: true,
          schedulingStep: "choose_type",
          availableDates: getAvailableDates(),
        }
      );
    }

    // Default AI response
    const reply = await getAIResponse(message, leadInfo);

    return respond(sessionId, message, reply, leadInfo);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" });
  }
}