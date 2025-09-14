import { Campaign, CampaignRecipient, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EmailService } from "./emailService";

// Use simpler, more practical types for the service layer
export type CreateCampaignData = {
  name: string;
  templateId: number;
  status?: string;
};

export type UpdateCampaignData = {
  name?: string;
  status?: string;
  templateId?: number;
};

// Use Prisma's generated types for relations - these are automatically typed!
export type CampaignWithTemplate = Prisma.CampaignGetPayload<{
  include: { template: true };
}>;

export type CampaignWithRecipients = Prisma.CampaignGetPayload<{
  include: {
    recipients: {
      include: { contact: true };
    };
  };
}>;

export type CampaignWithAll = Prisma.CampaignGetPayload<{
  include: {
    template: true;
    recipients: {
      include: { contact: true };
    };
  };
}>;

// Type for recipient with contact
export type CampaignRecipientWithContact = Prisma.CampaignRecipientGetPayload<{
  include: { contact: true };
}>;

export class CampaignService {
  /**
   * Creates a new campaign.
   * @param data - { name: string; templateId: number; contactIds: number[] }
   * @returns A promise that resolves to the newly created campaign including its recipients.
   */
  static async create(
    data: CreateCampaignData & { contactIds: number[] }
  ): Promise<Campaign> {
    // Validate input: name, templateId, and contactIds array must be present and valid.
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Campaign name is required and cannot be empty");
    }

    if (!data.templateId || typeof data.templateId !== "number") {
      throw new Error("Valid templateId is required");
    }

    if (
      !data.contactIds ||
      !Array.isArray(data.contactIds) ||
      data.contactIds.length === 0
    ) {
      throw new Error("At least one contact ID is required");
    }

    // Ensure all contactIds are valid numbers
    const invalidContactIds = data.contactIds.filter(
      (id) => typeof id !== "number" || id <= 0
    );
    if (invalidContactIds.length > 0) {
      throw new Error("All contact IDs must be valid positive numbers");
    }

    // Use a Prisma transaction to create campaign and recipients atomically
    return await prisma.$transaction(async (tx) => {
      // Verify that the template exists
      const template = await tx.template.findUnique({
        where: { id: data.templateId },
      });

      if (!template) {
        throw new Error(`Template with ID ${data.templateId} not found`);
      }

      // Verify that all contacts exist
      const existingContacts = await tx.contact.findMany({
        where: {
          id: { in: data.contactIds },
        },
        select: { id: true },
      });

      const existingContactIds = existingContacts.map((c) => c.id);
      const missingContactIds = data.contactIds.filter(
        (id) => !existingContactIds.includes(id)
      );

      if (missingContactIds.length > 0) {
        throw new Error(`Contacts not found: ${missingContactIds.join(", ")}`);
      }

      // 1. Create the Campaign record
      const campaign = await tx.campaign.create({
        data: {
          name: data.name.trim(),
          status: data.status || "Draft",
          templateId: data.templateId,
        },
      });

      // 2. For each contactId, create a CampaignRecipient record
      const recipients = data.contactIds.map((contactId) => ({
        campaignId: campaign.id,
        contactId,
        status: "Scheduled", // Default status for recipients
      }));

      await tx.campaignRecipient.createMany({
        data: recipients,
      });

      // Return the created campaign
      return campaign;
    });
  }

  /**
   * Fetches all campaigns.
   * @returns A promise that resolves to an array of campaigns.
   */
  static async getAll(): Promise<CampaignWithAll[]> {
    // Implement fetching all campaigns, ordered by createdAt desc.
    // Include the associated template and count of recipients.
    return await prisma.campaign.findMany({
      include: {
        template: true,
        recipients: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Fetches a single campaign by ID.
   * @param id - The ID of the campaign.
   * @returns A promise that resolves to the campaign, including its template and recipients.
   */
  static async getById(id: number): Promise<CampaignWithAll | null> {
    // Add validation for id (isNaN).
    if (isNaN(id) || id <= 0) {
      throw new Error("Campaign ID must be a valid positive number");
    }

    try {
      // Include the associated template and campaign recipients.
      return await prisma.campaign.findUnique({
        where: { id },
        include: {
          template: true,
          recipients: {
            include: {
              contact: true,
            },
          },
        },
      });
    } catch (error) {
      // Add error handling for 'P2025' (record not found).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Updates an existing campaign.
   * @param id - The ID of the campaign.
   * @param data - The partial data to update (name, templateId, status).
   * @returns A promise that resolves to the updated campaign.
   */
  static async update(id: number, data: UpdateCampaignData): Promise<Campaign> {
    // Add validation for id (isNaN) and data (not empty).
    if (isNaN(id) || id <= 0) {
      throw new Error("Campaign ID must be a valid positive number");
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Update data cannot be empty");
    }

    // Validate individual fields if provided
    if (
      data.name !== undefined &&
      (!data.name || data.name.trim().length === 0)
    ) {
      throw new Error("Campaign name cannot be empty");
    }

    if (
      data.templateId !== undefined &&
      (isNaN(data.templateId) || data.templateId <= 0)
    ) {
      throw new Error("Template ID must be a valid positive number");
    }

    try {
      // If templateId is being updated, verify the template exists
      if (data.templateId) {
        const template = await prisma.template.findUnique({
          where: { id: data.templateId },
        });

        if (!template) {
          throw new Error(`Template with ID ${data.templateId} not found`);
        }
      }

      return await prisma.campaign.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.status && { status: data.status }),
          ...(data.templateId && { templateId: data.templateId }),
        },
      });
    } catch (error) {
      // Add error handling for 'P2025' (record not found).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`Campaign with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Deletes a campaign.
   * @param id - The ID of the campaign.
   * @returns A promise that resolves to the deleted campaign.
   */
  static async delete(id: number): Promise<Campaign> {
    // Add validation for id (isNaN).
    if (isNaN(id) || id <= 0) {
      throw new Error("Campaign ID must be a valid positive number");
    }

    try {
      // This should also delete all associated CampaignRecipients. Use a transaction for this.
      return await prisma.$transaction(async (tx) => {
        // First, delete all associated CampaignRecipients
        await tx.campaignRecipient.deleteMany({
          where: { campaignId: id },
        });

        // Then delete the campaign
        return await tx.campaign.delete({
          where: { id },
        });
      });
    } catch (error) {
      // Add error handling for 'P2025' (record not found).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new Error(`Campaign with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Add recipients to campaign
   */
  static async addRecipients(
    campaignId: number,
    contactIds: number[]
  ): Promise<CampaignRecipientWithContact[]> {
    const recipients = contactIds.map((contactId) => ({
      campaignId,
      contactId,
      status: "Scheduled",
    }));

    return await prisma.campaignRecipient
      .createMany({
        data: recipients,
      })
      .then(() =>
        prisma.campaignRecipient.findMany({
          where: { campaignId },
          include: { contact: true },
        })
      );
  }

  /**
   * Remove recipient from campaign
   */
  static async removeRecipient(
    campaignId: number,
    contactId: number
  ): Promise<void> {
    await prisma.campaignRecipient.delete({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId,
        },
      },
    });
  }

  /**
   * Update recipient status
   */
  static async updateRecipientStatus(
    campaignId: number,
    contactId: number,
    status: string,
    sentAt?: Date
  ): Promise<CampaignRecipient> {
    const updateData: { status: string; sentAt?: Date } = { status };
    if (sentAt) {
      updateData.sentAt = sentAt;
    }

    return await prisma.campaignRecipient.update({
      where: {
        campaignId_contactId: {
          campaignId,
          contactId,
        },
      },
      data: updateData,
    });
  }

  /**
   * Get campaign statistics
   */
  static async getStatistics(campaignId: number) {
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId },
    });

    const total = recipients.length;
    const scheduled = recipients.filter(
      (r: CampaignRecipient) => r.status === "Scheduled"
    ).length;
    const sent = recipients.filter(
      (r: CampaignRecipient) => r.status === "Sent"
    ).length;
    const failed = recipients.filter(
      (r: CampaignRecipient) => r.status === "Failed"
    ).length;
    const opened = recipients.filter(
      (r: CampaignRecipient) => r.status === "Opened"
    ).length;
    const clicked = recipients.filter(
      (r: CampaignRecipient) => r.status === "Clicked"
    ).length;
    const bounced = recipients.filter(
      (r: CampaignRecipient) => r.status === "Bounced"
    ).length;

    return {
      total,
      scheduled,
      sent,
      failed,
      opened,
      clicked,
      bounced,
      deliveryRate:
        sent > 0 ? (((sent - bounced) / sent) * 100).toFixed(2) : "0",
      openRate: sent > 0 ? ((opened / sent) * 100).toFixed(2) : "0",
      clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(2) : "0",
    };
  }

  /**
   * Get campaigns by template
   */
  static async getByTemplateId(templateId: number): Promise<Campaign[]> {
    return await prisma.campaign.findMany({
      where: { templateId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update campaign status
   */
  static async updateStatus(id: number, status: string): Promise<Campaign> {
    return await prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Send a campaign to all scheduled recipients
   */
  static async sendCampaign(campaignId: number): Promise<{
    message: string;
    sent: number;
    failed: number;
    totalRecipients: number;
  }> {
    // Validate campaignId
    if (isNaN(campaignId) || campaignId <= 0) {
      throw new Error("Campaign ID must be a valid positive number");
    }

    // Fetch the campaign with template and recipients
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: true,
        recipients: {
          where: {
            status: { in: ["Scheduled", "Draft"] },
          },
          include: {
            contact: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    if (!campaign.template) {
      throw new Error(`Template not found for campaign ${campaignId}`);
    }

    if (campaign.recipients.length === 0) {
      throw new Error(
        `No scheduled recipients found for campaign ${campaignId}`
      );
    }

    let sentCount = 0;
    let failedCount = 0;
    const totalRecipients = campaign.recipients.length;

    // Update campaign status to "Sending"
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "Sending" },
    });

    // Process each recipient
    for (const recipient of campaign.recipients) {
      try {
        // Personalize the email content
        let personalizedSubject = campaign.template.subject;
        let personalizedBody = campaign.template.body;

        // Replace placeholders with contact data
        const contact = recipient.contact;
        personalizedSubject = personalizedSubject
          .replace(/{{firstName}}/g, contact.firstName || "")
          .replace(/{{lastName}}/g, contact.lastName || "")
          .replace(/{{email}}/g, contact.email || "")
          .replace(/{{company}}/g, contact.company || "");

        personalizedBody = personalizedBody
          .replace(/{{firstName}}/g, contact.firstName || "")
          .replace(/{{lastName}}/g, contact.lastName || "")
          .replace(/{{email}}/g, contact.email || "")
          .replace(/{{company}}/g, contact.company || "");

        // Send email via EmailService
        await EmailService.send({
          to: contact.email,
          subject: personalizedSubject,
          body: personalizedBody,
        });

        // Update recipient status to "Sent"
        await this.updateRecipientStatus(
          campaignId,
          recipient.contactId,
          "Sent",
          new Date()
        );

        sentCount++;
      } catch (error) {
        console.error(
          `Failed to send email to ${recipient.contact.email}:`,
          error
        );

        // Update recipient status to "Failed"
        await this.updateRecipientStatus(
          campaignId,
          recipient.contactId,
          "Failed"
        );

        failedCount++;
      }
    }

    // Update campaign status based on results
    const finalStatus =
      failedCount === totalRecipients
        ? "Failed"
        : sentCount === totalRecipients
        ? "Sent"
        : "Partially Sent";

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: finalStatus },
    });

    return {
      message: `Campaign sending completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      sent: sentCount,
      failed: failedCount,
      totalRecipients,
    };
  }
}
