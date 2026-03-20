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

async function handleScheduling(message: string, body: any, leadInfo: any) {
  const { schedulingStep, scheduleData = {} } = body;
  const input = message.trim().toLowerCase();

  // Step 1 — Choose type
  if (schedulingStep === "choose_type") {
    if (input.includes("call")) {
      const dates = getAvailableDates();
      return NextResponse.json({
        reply: `📞 Great! Let's book a call.\n\nAvailable dates:\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\nReply with the number of your preferred date.`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData: { type: "CALL" },
        availableDates: dates,
      });
    } else if (input.includes("visit")) {
      const dates = getAvailableDates();
      return NextResponse.json({
        reply: `🏫 Great! Let's book a campus visit.\n\n📍 **Our Address:**\n${INSTITUTE_ADDRESS.name}\n${INSTITUTE_ADDRESS.address}\n🕐 ${INSTITUTE_ADDRESS.hours}\n\nAvailable dates:\n${dates.map((d, i) => `${i + 1}. ${d}`).join("\n")}\n\nReply with the number of your preferred date.`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData: { type: "VISIT" },
        availableDates: dates,
      });
    } else {
      return NextResponse.json({
        reply: `Please reply with **"call"** for a phone call or **"visit"** for a campus visit.`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "choose_type",
      });
    }
  }

  // Step 2 — Choose date
  if (schedulingStep === "choose_date") {
    const dates = body.availableDates || getAvailableDates();
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= dates.length) {
      return NextResponse.json({
        reply: `Please reply with a number between 1 and ${dates.length}.`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData,
        availableDates: dates,
      });
    }

    const selectedDate = dates[index];
    return NextResponse.json({
      reply: `✅ Date selected: **${selectedDate}**\n\nAvailable time slots:\n${AVAILABLE_SLOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nReply with the number of your preferred time slot.`,
      leadInfo,
      isScheduling: true,
      schedulingStep: "choose_time",
      scheduleData: { ...scheduleData, date: selectedDate },
      availableDates: dates,
    });
  }

  // Step 3 — Choose time
  if (schedulingStep === "choose_time") {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= AVAILABLE_SLOTS.length) {
      return NextResponse.json({
        reply: `Please reply with a number between 1 and ${AVAILABLE_SLOTS.length}.`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "choose_time",
        scheduleData,
        availableDates: body.availableDates,
      });
    }

    const selectedTime = AVAILABLE_SLOTS[index];

    if (!leadInfo?.name || !leadInfo?.email || !leadInfo?.phone) {
      return NextResponse.json({
        reply: `Almost done! I just need your details to confirm the booking.\n\nWhat is your full name?`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "collect_info",
        scheduleData: { ...scheduleData, time: selectedTime },
        availableDates: body.availableDates,
      });
    }

    const result = await bookAppointment({
      ...scheduleData,
      time: selectedTime,
      name: leadInfo.name,
      email: leadInfo.email,
      phone: leadInfo.phone,
      course: leadInfo.course,
    });

    if (!result.success) {
      return NextResponse.json({
        reply: `Sorry, that slot is already taken. Please choose another time.\n\n${AVAILABLE_SLOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
        leadInfo,
        isScheduling: true,
        schedulingStep: "choose_time",
        scheduleData,
        availableDates: body.availableDates,
      });
    }

    return NextResponse.json({
      reply: `🎉 Appointment confirmed!\n\n📋 **Details:**\n👤 Name: ${leadInfo.name}\n📅 Date: ${scheduleData.date}\n🕐 Time: ${selectedTime}\n📞 Type: ${scheduleData.type === "CALL" ? "Phone Call" : "Campus Visit"}\n\nWe'll contact you at ${leadInfo.phone}. See you soon!`,
      leadInfo,
      isScheduling: false,
      schedulingStep: null,
      scheduleData: {},
    });
  }

  // Step 4 — Collect info
  if (schedulingStep === "collect_info") {
    const updatedLeadInfo = await extractLeadInfo(message, leadInfo);
    const next = getNextQuestion(updatedLeadInfo);

    if (next) {
      return NextResponse.json({
        reply: next,
        leadInfo: updatedLeadInfo,
        isScheduling: true,
        schedulingStep: "collect_info",
        scheduleData,
        availableDates: body.availableDates,
      });
    }

    const result = await bookAppointment({
      ...scheduleData,
      name: updatedLeadInfo.name!,
      email: updatedLeadInfo.email!,
      phone: updatedLeadInfo.phone!,
      course: updatedLeadInfo.course,
    });

    if (!result.success) {
      return NextResponse.json({
        reply: `Sorry, that slot is already taken. Please choose another time.`,
        leadInfo: updatedLeadInfo,
        isScheduling: true,
        schedulingStep: "choose_time",
        scheduleData,
      });
    }

    return NextResponse.json({
      reply: `🎉 Appointment confirmed!\n\n📋 **Details:**\n👤 Name: ${updatedLeadInfo.name}\n📅 Date: ${scheduleData.date}\n🕐 Time: ${scheduleData.time}\n📞 Type: ${scheduleData.type === "CALL" ? "Phone Call" : "Campus Visit"}\n\nWe'll contact you at ${updatedLeadInfo.phone}. See you soon!`,
      leadInfo: { ...updatedLeadInfo, collected: true },
      isScheduling: false,
      schedulingStep: null,
      scheduleData: {},
    });
  }

  return NextResponse.json({
    reply: "Something went wrong with scheduling.",
    leadInfo,
    isScheduling: false,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      leadInfo = {},
      isEnrolling = false,
      isScheduling = false,
    } = body;

    //  Handle scheduling flow first
    if (isScheduling) {
      return handleScheduling(message, body, leadInfo);
    }

    //  Handle enrollment flow
if (isEnrolling && !leadInfo.collected) {
  const updatedLeadInfo: LeadInfo = await extractLeadInfo(message, leadInfo);

  //  Ask for missing fields first before checking if complete
  const nextQuestion = getNextQuestion(updatedLeadInfo);

  if (nextQuestion) {
    return NextResponse.json({
      reply: nextQuestion,
      leadInfo: updatedLeadInfo,
      isEnrolling: true,
    });
  }

  //  Only save when ALL fields are present
  if (isLeadComplete(updatedLeadInfo)) {
    await prisma.lead.create({
      data: {
        name: updatedLeadInfo.name!,
        email: updatedLeadInfo.email!,
        phone: updatedLeadInfo.phone!,
        course: updatedLeadInfo.course!,
      },
    });

    return NextResponse.json({
      reply: `🎉 Thank you, ${updatedLeadInfo.name}! Your interest in the ${updatedLeadInfo.course} course has been registered. Our admissions team will contact you at ${updatedLeadInfo.phone} shortly!`,
      leadInfo: { ...updatedLeadInfo, collected: true },
      isEnrolling: false,
    });
  }

  //  Fallback — something still missing
  return NextResponse.json({
    reply: "Could you please provide the remaining details?",
    leadInfo: updatedLeadInfo,
    isEnrolling: true,
  });
}

    // Detect intent
    const intent = await detectIntent(message);

    if (intent === "greeting") {
      return NextResponse.json({
        reply: "👋 Hello! Welcome to our admissions portal. I can help you with course information or assist you with enrollment. What would you like to know?",
        leadInfo,
        isEnrolling: false,
        isScheduling: false,
      });
    }

    if (intent === "out_of_scope") {
      return NextResponse.json({
        reply: "I'm sorry, I can only assist with admission and course-related queries. Please contact our admissions team for other questions.",
        leadInfo,
        isEnrolling: false,
        isScheduling: false,
      });
    }

    if (intent === "interest") {
      const updatedLeadInfo: LeadInfo = await extractLeadInfo(message, leadInfo);
      const nextQuestion = getNextQuestion(updatedLeadInfo);
      return NextResponse.json({
        reply: `Great! I'd love to help you with enrollment. ${nextQuestion}`,
        leadInfo: updatedLeadInfo,
        isEnrolling: true,
        isScheduling: false,
      });
    }

    if (intent === "schedule") {
      const dates = getAvailableDates();
      return NextResponse.json({
        reply: `I can help you schedule an appointment! Would you like to:\n\n📞 **Book a Call** — Our admissions team will call you at your preferred time\n🏫 **Visit Campus** — Come visit us at our institute\n\nPlease reply with **"call"** or **"visit"** to proceed.`,
        leadInfo,
        isEnrolling: false,
        isScheduling: true, 
        schedulingStep: "choose_type",
        availableDates: dates,
      });
    }

    // Default — FAQ
    const reply = await getAIResponse(message);
    return NextResponse.json({ reply, leadInfo, isEnrolling: false, isScheduling: false });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" });
  }
}