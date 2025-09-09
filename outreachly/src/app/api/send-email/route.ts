// /api/send-email/route.ts

import { NextResponse } from "next/server";
import { EmailService } from "@/services/emailService";

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();

    // 1. Validation (Controller's job)
    if (!to || !subject || !body) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Call the Business Logic (Controller tells the Model what to do)
    const result = await EmailService.send({ to, subject, body });

    // 3. Send the Response (Controller's job)
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in send-email route:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
