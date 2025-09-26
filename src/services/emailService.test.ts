import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { EmailService } from "./emailService";

jest.mock("@aws-sdk/client-sesv2");

const mockSend = jest.fn();
SESv2Client.prototype.send = mockSend;

describe("EmailService.send", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should send an email successfully", async () => {
    mockSend.mockResolvedValueOnce({ MessageId: "test-id" });
    const result = await EmailService.send({
      to: "to@example.com",
      subject: "Subject",
      body: "<p>Body</p>",
    });
    expect(result).toEqual({ success: true, messageId: "test-id" });
    expect(mockSend).toHaveBeenCalledWith(expect.any(SendEmailCommand));
  });

  it("should handle errors", async () => {
    mockSend.mockRejectedValueOnce(new Error("Failed"));
    await expect(
      EmailService.send({
        to: "to@example.com",
        subject: "Subject",
        body: "<p>Body</p>",
      })
    ).rejects.toThrow("Failed to send email.");
  });
});
