import { NextResponse } from "next/server";
import { bookAppointment } from "@/lib/scheduler/calendar";

export async function POST(req: Request) {
  try {
    const { name, email, phone, course, type, date, time } = await req.json();

    if (!name || !email || !phone || !type || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await bookAppointment({ name, email, phone, course, type, date, time });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 409 });
    }

    return NextResponse.json({ success: true, appointment: result.appointment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}