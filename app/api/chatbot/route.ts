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
import { shouldUseReactServerCondition } from "next/dist/build/utils";

// ================= HARDCODED COURSES =================
const COURSES = [
  { id: "1", name: "AI & Machine Learning", description: "Learn AI and ML from scratch", duration: "6 months", fees: "₹45,000", order: 1 },
  { id: "2", name: "Data Science", description: "Master data analysis and visualization", duration: "6 months", fees: "₹40,000", order: 2 },
  { id: "3", name: "Full Stack Development", description: "Build modern web applications", duration: "6 months", fees: "₹35,000", order: 3 },
  { id: "4", name: "Digital Marketing", description: "SEO, Social Media & Paid Ads", duration: "3 months", fees: "₹20,000", order: 4 },
  { id: "5", name: "Cybersecurity", description: "Ethical hacking and network security", duration: "6 months", fees: "₹50,000", order: 5 },
];

// ================= SUGGESTIONS =================
function getSuggestions(intent: string): string[] {
  switch (intent) {
    case "greeting":
    case "main_menu":
      return ["📚 View Courses", "💰 Check Fees", "📋 Enroll Now", "📞 Schedule a Call", "❓ Other Query"];
    case "courses":
      return ["💰 Check Fees", "📋 Enroll Now", "📞 Schedule a Call", "🔙 Main Menu"];
    case "faq":
      return ["📚 View Courses", "📋 Enroll Now", "📞 Schedule a Call", "🔙 Main Menu"];
    case "interest":
      return ["📞 Call me instead", "🏫 Visit Campus", "🔙 Main Menu"];
    case "schedule":
      return ["📞 Book a Call", "🏫 Visit Campus", "🔙 Main Menu"];
    case "schedule_confirmed":
      return ["📚 View Courses", "📋 Enroll Now", "🔙 Main Menu"];
    case "enrolled":
      return ["📚 View Courses", "📞 Schedule a Call", "🔙 Main Menu"];
    case "out_of_scope":
      return ["📚 View Courses", "📋 Enroll Now", "📞 Schedule a Call", "🔙 Main Menu"];
    case "choose_date":
    case "choose_time":
      return [];
    default:
      return ["📚 View Courses", "📋 Enroll Now", "📞 Schedule a Call", "🔙 Main Menu"];
  }
}

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
      data: { conversationId: conversation.id, role, content },
    });
  }
}

// ================= RESPOND HELPER =================
async function respond(
  sessionId: string | undefined,
  message: string,
  reply: string,
  leadInfo: any,
  extra: any = {},
  suggestions: string[] = []
) {
  if (sessionId) {
    await saveMessage(sessionId, "user", message, leadInfo);
    await saveMessage(sessionId, "bot", reply, leadInfo);
  }

  return NextResponse.json({ reply, leadInfo, suggestions, ...extra });
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
      const reply = `📞 Great! Let's book a call.\n\nAvailable dates:\n${dates.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n")}\n\nReply with the number of your preferred date.`;
      return respond(sessionId, message, reply, leadInfo, {
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData: { type: "CALL" },
        availableDates: dates,
      }, getSuggestions("choose_date"));
    }

    if (input.includes("visit")) {
      const reply = `🏫 Great! Let's book a campus visit.\n\n📍 ${INSTITUTE_ADDRESS.name}\n${INSTITUTE_ADDRESS.address}\n🕐 ${INSTITUTE_ADDRESS.hours}\n\nAvailable dates:\n${dates.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n")}\n\nReply with the number of your preferred date.`;
      return respond(sessionId, message, reply, leadInfo, {
        isScheduling: true,
        schedulingStep: "choose_date",
        scheduleData: { type: "VISIT" },
        availableDates: dates,
      }, getSuggestions("choose_date"));
    }

    return respond(sessionId, message,
      `Please reply with "call" for a phone call or "visit" for a campus visit.`,
      leadInfo,
      { isScheduling: true, schedulingStep: "choose_type" },
      getSuggestions("schedule")
    );
  }

  if (schedulingStep === "choose_date") {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= dates.length) {
      return respond(sessionId, message,
        `Please reply with a number between 1 and ${dates.length}.`,
        leadInfo,
        { isScheduling: true, schedulingStep: "choose_date", scheduleData, availableDates: dates },
        getSuggestions("choose_date")
      );
    }

    const selectedDate = dates[index];
    const reply = `✅ Date selected: ${selectedDate}\n\nAvailable time slots:\n${AVAILABLE_SLOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nReply with the number of your preferred time slot.`;

    return respond(sessionId, message, reply, leadInfo, {
      isScheduling: true,
      schedulingStep: "choose_time",
      scheduleData: { ...scheduleData, date: selectedDate },
      availableDates: dates,
    }, getSuggestions("choose_time"));
  }

  if (schedulingStep === "choose_time") {
    const index = parseInt(input) - 1;

    if (isNaN(index) || index < 0 || index >= AVAILABLE_SLOTS.length) {
      return respond(sessionId, message,
        `Please reply with a number between 1 and ${AVAILABLE_SLOTS.length}.`,
        leadInfo,
        { isScheduling: true, schedulingStep: "choose_time", scheduleData },
        getSuggestions("choose_time")
      );
    }

    const selectedTime = AVAILABLE_SLOTS[index];

    if (!leadInfo?.name || !leadInfo?.email || !leadInfo?.phone) {
      return respond(sessionId, message,
        `Almost done! What is your full name?`,
        leadInfo,
        {
          isScheduling: true,
          schedulingStep: "collect_info",
          scheduleData: { ...scheduleData, time: selectedTime },
        },
        []
      );
    }

    const result = await bookAppointment({ ...scheduleData, time: selectedTime, ...leadInfo });

    if (!result.success) {
      return respond(sessionId, message,
        `Sorry, that slot is already taken. Please choose another time.\n\n${AVAILABLE_SLOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
        leadInfo,
        { isScheduling: true, schedulingStep: "choose_time", scheduleData },
        getSuggestions("choose_time")
      );
    }

    return respond(sessionId, message,
      `🎉 Appointment confirmed!\n\n📋 Details:\n👤 ${leadInfo.name}\n📅 ${scheduleData.date}\n🕐 ${selectedTime}\n📞 ${scheduleData.type === "CALL" ? "Phone Call" : "Campus Visit"}\n\nWe'll contact you at ${leadInfo.phone}. See you soon!`,
      leadInfo,
      { isScheduling: false, schedulingStep: null, scheduleData: {} },
      getSuggestions("schedule_confirmed")
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
      }, []);
    }

    const result = await bookAppointment({ ...scheduleData, ...updatedLeadInfo });

    if (!result.success) {
      return respond(sessionId, message,
        `Sorry, that slot is already taken. Please choose another time.`,
        updatedLeadInfo,
        { isScheduling: true, schedulingStep: "choose_time" },
        getSuggestions("choose_time")
      );
    }

    return respond(sessionId, message,
      `🎉 Appointment confirmed!\n\n📋 Details:\n👤 ${updatedLeadInfo.name}\n📅 ${scheduleData.date}\n🕐 ${scheduleData.time}\n📞 ${scheduleData.type === "CALL" ? "Phone Call" : "Campus Visit"}\n\nWe'll contact you at ${updatedLeadInfo.phone}. See you soon!`,
      { ...updatedLeadInfo, collected: true },
      { isScheduling: false, schedulingStep: null, scheduleData: {} },
      getSuggestions("schedule_confirmed")
    );
  }

  return respond(sessionId, message, "Something went wrong with scheduling.", leadInfo, {}, getSuggestions("main_menu"));
}

// ================= MAIN API =================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("SessionId received:", body.sessionId);
    console.log("Message:", body.message);
    const {
      message,
      leadInfo = {},
      isEnrolling = false,
      isScheduling = false,
      sessionId,
    } = body;

    if (message === "Show me the main menu" || message === "🔙 Main Menu") {
      return respond(sessionId, message,
        "Here's what I can help you with! 😊",
        leadInfo,
        { isEnrolling: false, isScheduling: false },
        getSuggestions("main_menu")
      );
    }

    if (isScheduling) {
      return handleScheduling(message, body, leadInfo, sessionId);
    }

    if (isEnrolling && !leadInfo.collected) {
      const updatedLeadInfo: LeadInfo = await extractLeadInfo(message, leadInfo);
      const nextQuestion = getNextQuestion(updatedLeadInfo);

      if (nextQuestion) {
        return respond(sessionId, message, nextQuestion, updatedLeadInfo, {
          isEnrolling: true,
        }, []);
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

        return respond(sessionId, message,
          `🎉 Thank you, ${updatedLeadInfo.name}! Your interest in the ${updatedLeadInfo.course} course has been registered. Our admissions team will contact you at ${updatedLeadInfo.phone} shortly!`,
          { ...updatedLeadInfo, collected: true },
          { isEnrolling: false, SharedWorker: false },
          getSuggestions("enrolled")
        );
      }
    }

    const intent = await detectIntent(message);

    if (intent === "greeting") {
      return respond(sessionId, message,
        "👋 Hello! Welcome to IFDA Institute — AI-Integrated Learning. I'm Priya, your admission counselor. How can I help you today?",
        leadInfo,
        { isEnrolling: false, isScheduling: false },
        getSuggestions("greeting")
      );
    }

    if (intent === "courses") {
      return respond(sessionId, message,
        "Here are our available courses! 🎓 Tap Interested to enroll or Know More to learn about a course:",
        leadInfo,
        { isEnrolling: false, isScheduling: false, showCourses: true, courses: COURSES },
        getSuggestions("courses")
      );
    }

    if (intent === "out_of_scope") {
      return respond(sessionId, message,
        "I'm sorry, I can only assist with admission and course-related queries. Please contact our admissions team for other questions.",
        leadInfo,
        { isEnrolling: false, isScheduling: false },
        getSuggestions("out_of_scope")
      );
    }

    if (intent === "interest") {
      const updatedLeadInfo = await extractLeadInfo(message, leadInfo);
      const nextQuestion = getNextQuestion(updatedLeadInfo);
      return respond(sessionId, message,
        `Great! I'd love to help you with enrollment. ${nextQuestion}`,
        updatedLeadInfo,
        { isEnrolling: true, isScheduling: false, showcourses: false },
        getSuggestions("interest")
      );
    }

    if (intent === "schedule") {
      return respond(sessionId, message,
        `I can help you schedule an appointment!\n\nWould you like to:\n\n📞 Book a Call — Our admissions team will call you\n🏫 Visit Campus — Come visit us at our institute\n\nPlease reply with "call" or "visit" to proceed.`,
        leadInfo,
        { isEnrolling: false, isScheduling: true, schedulingStep: "choose_type", availableDates: getAvailableDates() },
        getSuggestions("schedule")
      );
    }
const structured = await getAIResponse(message, leadInfo);
const replyText = structured.components
  .filter((c) => c.type === "text")
  .map((c) => (c as any).content)
  .join(" ") || "Here's what I found!";

if (sessionId) {
  await saveMessage(sessionId, "user", message, leadInfo);
  await saveMessage(sessionId, "bot", replyText, leadInfo);
}

return NextResponse.json({
  structured,
  leadInfo,
  suggestions: [],
  isEnrolling: false,
  isScheduling: false,
});

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong", suggestions: [] });
  }
}