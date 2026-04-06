import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { getSession, updateSession } from "@/lib/whatsapp/session";
import { getAIResponse } from "@/lib/ai/llm";
import { detectIntent, extractLeadInfo, getNextQuestion, isLeadComplete } from "@/lib/ai/intent";
import { getAvailableDates, AVAILABLE_SLOTS, INSTITUTE_ADDRESS, bookAppointment } from "@/lib/scheduler/calendar";
import { prisma } from "@/lib/db/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

// ── Webhook verification (GET) ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ── Incoming message handler (POST) ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: "no messages" });
    }

    const message = messages[0];
    const from = message.from; // user's WhatsApp phone number
    const text = message.type === "text" ? message.text?.body?.trim() : null;

    if (!text) return NextResponse.json({ status: "non-text ignored" });

    // Save to conversation DB
    await saveWhatsAppMessage(from, "user", text);

    // Get session state
    const session = await getSession(from);
    const { leadInfo, isEnrolling, isScheduling, schedulingStep, scheduleData, availableDates } = session;

    let reply = "";

    // ── Scheduling flow ──────────────────────────────────────────────────
    if (isScheduling) {
      const result = await handleScheduling(text, {
        schedulingStep, scheduleData, availableDates, leadInfo, from
      });
      reply = result.reply;
      await updateSession(from, result.sessionUpdate);

    // ── Enrollment flow ──────────────────────────────────────────────────
    } else if (isEnrolling && !leadInfo?.collected) {
      const updatedLeadInfo = await extractLeadInfo(text, leadInfo);
      const nextQuestion = getNextQuestion(updatedLeadInfo);

      if (nextQuestion) {
        reply = nextQuestion;
        await updateSession(from, { leadInfo: updatedLeadInfo, isEnrolling: true });
      } else if (isLeadComplete(updatedLeadInfo)) {
        await prisma.lead.create({
          data: {
            name: updatedLeadInfo.name!,
            email: updatedLeadInfo.email!,
            phone: updatedLeadInfo.phone!,
            course: updatedLeadInfo.course!,
            source: "WHATSAPP",
          },
        });
        reply = `🎉 Thank you, ${updatedLeadInfo.name}! Your interest in the ${updatedLeadInfo.course} course has been registered. Our admissions team will contact you shortly!`;
        await updateSession(from, { leadInfo: { ...updatedLeadInfo, collected: true }, isEnrolling: false });
      }

    // ── Intent detection ─────────────────────────────────────────────────
    } else {
      const intent = await detectIntent(text);

      if (intent === "greeting") {
        reply = `👋 Hello! Welcome to IFDA Institute.\n\nI'm your AI admission counselor. I can help you with:\n\n🎓 Course information & fees\n📋 Enrollment process\n📞 Schedule a call or campus visit\n\nWhat would you like to know?`;

      } else if (intent === "schedule") {
        const dates = getAvailableDates();
        reply = `I can help you schedule an appointment!\n\nWould you like to:\n\n📞 *Book a Call* — reply with "call"\n🏫 *Visit Campus* — reply with "visit"\n\nWhich do you prefer?`;
        await updateSession(from, {
          isScheduling: true,
          schedulingStep: "choose_type",
          availableDates: dates,
        });

      } else if (intent === "interest") {
        const updatedLeadInfo = await extractLeadInfo(text, leadInfo);
        const nextQuestion = getNextQuestion(updatedLeadInfo);
        reply = `Great! I'd love to help you with enrollment. ${nextQuestion}`;
        await updateSession(from, { leadInfo: updatedLeadInfo, isEnrolling: true });

      } else if (intent === "out_of_scope") {
        reply = `I'm sorry, I can only assist with admission and course-related queries. Please contact our admissions team directly for other questions.`;

      } else {
        // FAQ
        reply = await getAIResponse(text, leadInfo);
      }
    }

    // Send reply
    await sendWhatsAppMessage(from, reply);
    await saveWhatsAppMessage(from, "bot", reply);

    return NextResponse.json({ status: "ok" });

  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// ── Scheduling handler ───────────────────────────────────────────────────────
async function handleScheduling(
  input: string,
  ctx: { schedulingStep: any; scheduleData: any; availableDates: any; leadInfo: any; from: string }
) {
  const { schedulingStep, scheduleData, availableDates, leadInfo } = ctx;
  const msg = input.trim().toLowerCase();

  if (schedulingStep === "choose_type") {
    if (msg.includes("call")) {
      const dates = getAvailableDates();
      return {
        reply: `📞 Great! Let's book a call.\n\nAvailable dates:\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\nReply with the number of your preferred date.`,
        sessionUpdate: { schedulingStep: "choose_date", scheduleData: { type: "CALL" }, availableDates: dates },
      };
    } else if (msg.includes("visit")) {
      const dates = getAvailableDates();
      return {
        reply: `🏫 Great! Let's book a campus visit.\n\n📍 *Our Address:*\n${INSTITUTE_ADDRESS.name}\n${INSTITUTE_ADDRESS.address}\n🕐 ${INSTITUTE_ADDRESS.hours}\n\nAvailable dates:\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\nReply with the number of your preferred date.`,
        sessionUpdate: { schedulingStep: "choose_date", scheduleData: { type: "VISIT" }, availableDates: dates },
      };
    }
    return {
      reply: `Please reply with *"call"* for a phone call or *"visit"* for a campus visit.`,
      sessionUpdate: {},
    };
  }

  if (schedulingStep === "choose_date") {
    const dates = availableDates || getAvailableDates();
    const index = parseInt(msg) - 1;
    if (isNaN(index) || index < 0 || index >= dates.length) {
      return {
        reply: `Please reply with a number between 1 and ${dates.length}.`,
        sessionUpdate: {},
      };
    }
    const selectedDate = dates[index];
    return {
      reply: `✅ Date selected: *${selectedDate}*\n\nAvailable time slots:\n${AVAILABLE_SLOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nReply with the number of your preferred time slot.`,
      sessionUpdate: { schedulingStep: "choose_time", scheduleData: { ...scheduleData, date: selectedDate } },
    };
  }

  if (schedulingStep === "choose_time") {
    const index = parseInt(msg) - 1;
    if (isNaN(index) || index < 0 || index >= AVAILABLE_SLOTS.length) {
      return {
        reply: `Please reply with a number between 1 and ${AVAILABLE_SLOTS.length}.`,
        sessionUpdate: {},
      };
    }
    const selectedTime = AVAILABLE_SLOTS[index];

    if (!leadInfo?.name || !leadInfo?.email || !leadInfo?.phone) {
      return {
        reply: `Almost done! I just need your details.\n\nWhat is your full name?`,
        sessionUpdate: { schedulingStep: "collect_info", scheduleData: { ...scheduleData, time: selectedTime } },
      };
    }

    const result = await bookAppointment({
      ...scheduleData, time: selectedTime,
      name: leadInfo.name, email: leadInfo.email,
      phone: leadInfo.phone, course: leadInfo.course,
    });

    if (!result.success) {
      return {
        reply: `Sorry, that slot is already taken. Please choose another time.\n\n${AVAILABLE_SLOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
        sessionUpdate: { schedulingStep: "choose_time" },
      };
    }

    return {
      reply: `🎉 Appointment confirmed!\n\n📋 *Details:*\n👤 ${leadInfo.name}\n📅 ${scheduleData.date}\n🕐 ${selectedTime}\n📞 ${scheduleData.type === "CALL" ? "Phone Call" : "Campus Visit"}\n\nWe'll contact you at ${leadInfo.phone}. See you soon!`,
      sessionUpdate: { isScheduling: false, schedulingStep: null, scheduleData: {} },
    };
  }

  if (schedulingStep === "collect_info") {
    const updatedLeadInfo = await extractLeadInfo(input, leadInfo);
    const next = getNextQuestion(updatedLeadInfo);

    if (next) {
      return {
        reply: next,
        sessionUpdate: { leadInfo: updatedLeadInfo },
      };
    }

    const result = await bookAppointment({
      ...scheduleData,
      name: updatedLeadInfo.name!,
      email: updatedLeadInfo.email!,
      phone: updatedLeadInfo.phone!,
      course: updatedLeadInfo.course,
    });

    return {
      reply: `🎉 Appointment confirmed!\n\n📋 *Details:*\n👤 ${updatedLeadInfo.name}\n📅 ${scheduleData.date}\n🕐 ${scheduleData.time}\n📞 ${scheduleData.type === "CALL" ? "Phone Call" : "Campus Visit"}\n\nWe'll contact you at ${updatedLeadInfo.phone}. See you soon!`,
      sessionUpdate: {
        leadInfo: { ...updatedLeadInfo, collected: true },
        isScheduling: false,
        schedulingStep: null,
        scheduleData: {},
      },
    };
  }

  return { reply: "Something went wrong. Please try again.", sessionUpdate: { isScheduling: false } };
}

// ── Save message to DB ───────────────────────────────────────────────────────
async function saveWhatsAppMessage(phone: string, role: "user" | "bot", content: string) {
  await prisma.conversation.upsert({
    where: { sessionId: `whatsapp_${phone}` },
    update: {
      updatedAt: new Date(),
      ...(role === "user" && { unread: { increment: 1 } }),
    },
    create: {
      sessionId: `whatsapp_${phone}`,
      userPhone: phone,
      unread: role === "user" ? 1 : 0,
    },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { sessionId: `whatsapp_${phone}` },
  });

  if (conversation) {
    await prisma.conversationMessage.create({
      data: { conversationId: conversation.id, role, content },
    });
  }
}