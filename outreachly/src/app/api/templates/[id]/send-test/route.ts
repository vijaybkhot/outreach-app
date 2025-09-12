import { NextResponse, NextRequest } from "next/server";
import { EmailService } from "@/services/emailService";

// POST /api/templates/[id]/send-test
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, renderedTemplate } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    if (
      !renderedTemplate ||
      !renderedTemplate.subject ||
      !renderedTemplate.body
    ) {
      return NextResponse.json(
        { error: "Rendered template data is required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send the actual email using EmailService
    try {
      console.log(`Attempting to send test email to: ${email.trim()}`);
      console.log(`Subject: ${renderedTemplate.subject}`);
      console.log(`From: ${process.env.AWS_SES_SOURCE_EMAIL}`);

      const emailResult = await EmailService.send({
        to: email.trim(),
        subject: renderedTemplate.subject,
        body: renderedTemplate.body,
      });

      console.log(`✅ Test email sent successfully to: ${email}`);
      console.log(`📧 AWS SES Message ID: ${emailResult.messageId}`);

      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString(),
        note: "Email sent via AWS SES. If not received, check spam folder or verify the email address is allowed in AWS SES sandbox mode.",
      });
    } catch (emailError) {
      console.error("❌ Failed to send test email:", emailError);

      // Provide more detailed error information
      let errorMessage = "Failed to send test email.";
      if (emailError instanceof Error) {
        if (emailError.message.includes("sandbox")) {
          errorMessage =
            "Email not sent: AWS SES is in sandbox mode. Please verify the recipient email address in AWS SES console.";
        } else if (emailError.message.includes("credentials")) {
          errorMessage =
            "Email not sent: AWS credentials are invalid or missing.";
        } else {
          errorMessage = `Email not sent: ${emailError.message}`;
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
