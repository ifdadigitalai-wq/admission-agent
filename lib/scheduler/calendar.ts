import { prisma } from "@/lib/db/prisma";

export const INSTITUTE_ADDRESS = {
  name: "IDFA Digital AI Institute",
  address: "123, Tech Park, Sector 5, Noida, Uttar Pradesh - 201301",
  phone: "+91-9876543210",
  email: "admissions@ifdadigitalai.com",
  hours: "Monday to Saturday, 10:00 AM - 5:00 PM",
};

export const AVAILABLE_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

// Check if a slot is already booked
export async function isSlotAvailable(
  date: string,
  time: string,
  type: "CALL" | "VISIT"
): Promise<boolean> {
  const existing = await prisma.appointment.findFirst({
    where: { date, time, type, status: "SCHEDULED" },
  });
  return !existing;
}

// Book an appointment
export async function bookAppointment(data: {
  name: string;
  email: string;
  phone: string;
  course?: string;
  type: "CALL" | "VISIT";
  date: string;
  time: string;
}) {
  const available = await isSlotAvailable(data.date, data.time, data.type);
  if (!available) {
    return { success: false, message: "This slot is already booked. Please choose another time." };
  }

  const appointment = await prisma.appointment.create({ data });
  return { success: true, appointment };
}

// Get available dates (next 7 working days)
export function getAvailableDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  let count = 0;

  while (dates.length < 7) {
    const next = new Date(today);
    next.setDate(today.getDate() + count + 1);
    const day = next.getDay();

    // Skip Sundays (0)
    if (day !== 0) {
      dates.push(next.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }));
    }
    count++;
  }

  return dates;
}