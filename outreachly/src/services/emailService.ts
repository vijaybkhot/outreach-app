// services/emailService.ts

import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

// The SES client is initialized once and reused.
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

// This class encapsulates all email-sending behavior.
// It knows HOW to send an email, but doesn't care about HTTP requests.
export class EmailService {
  static async send(params: EmailParams) {
    const { to, subject, body } = params;

    const command = new SendEmailCommand({
      FromEmailAddress: process.env.AWS_SES_SOURCE_EMAIL!,
      Destination: {
        ToAddresses: [to],
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: body,
              Charset: "UTF-8",
            },
          },
        },
      },
    });

    try {
      const response = await sesClient.send(command);
      console.log("Email sent! Message ID:", response.MessageId);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      console.error("Error sending email via EmailService:", error);
      // Re-throw the error to be handled by the controller
      throw new Error("Failed to send email.");
    }
  }
}
