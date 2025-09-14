// src/services/campaignService.test.ts
import { PrismaClient, CampaignRecipient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { CampaignService } from "./campaignService";

// Mock the central prisma instance from `lib/prisma`
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// Mock the EmailService
jest.mock("./emailService", () => ({
  EmailService: {
    send: jest.fn(),
  },
}));

// We can now get a reference to the mocks for our tests
import { prisma as mockPrisma } from "@/lib/prisma";
import { EmailService } from "./emailService";

const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

describe("CampaignService", () => {
  beforeEach(() => {
    // Reset the mocks before each test to ensure test isolation
    mockReset(mockPrisma);
    jest.clearAllMocks();
  });

  // --- Test Suite for create ---
  describe("create", () => {
    it("should create a new campaign with recipients", async () => {
      const createData = {
        name: "Test Campaign",
        templateId: 1,
        contactIds: [1, 2],
        status: "Draft",
      };

      const mockTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test Body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContacts = [{ id: 1 }, { id: 2 }];

      const mockCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the transaction behavior
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return await callback({
          template: {
            findUnique: jest.fn().mockResolvedValue(mockTemplate),
          },
          contact: {
            findMany: jest.fn().mockResolvedValue(mockContacts),
          },
          campaign: {
            create: jest.fn().mockResolvedValue(mockCampaign),
          },
          campaignRecipient: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        });
      });

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        mockTransaction
      );

      const result = await CampaignService.create(createData);

      expect(result).toEqual(mockCampaign);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("should throw error when campaign name is empty", async () => {
      const createData = {
        name: "",
        templateId: 1,
        contactIds: [1, 2],
      };

      await expect(CampaignService.create(createData)).rejects.toThrow(
        "Campaign name is required and cannot be empty"
      );
    });

    it("should throw error when templateId is invalid", async () => {
      const createData = {
        name: "Test Campaign",
        templateId: 0,
        contactIds: [1, 2],
      };

      await expect(CampaignService.create(createData)).rejects.toThrow(
        "Valid templateId is required"
      );
    });

    it("should throw error when contactIds is empty", async () => {
      const createData = {
        name: "Test Campaign",
        templateId: 1,
        contactIds: [],
      };

      await expect(CampaignService.create(createData)).rejects.toThrow(
        "At least one contact ID is required"
      );
    });

    it("should throw error when template not found", async () => {
      const createData = {
        name: "Test Campaign",
        templateId: 999,
        contactIds: [1, 2],
      };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return await callback({
          template: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      });

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        mockTransaction
      );

      await expect(CampaignService.create(createData)).rejects.toThrow(
        "Template with ID 999 not found"
      );
    });

    it("should throw error when contacts not found", async () => {
      const createData = {
        name: "Test Campaign",
        templateId: 1,
        contactIds: [1, 2, 999],
      };

      const mockTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test Body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockContacts = [{ id: 1 }, { id: 2 }];

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return await callback({
          template: {
            findUnique: jest.fn().mockResolvedValue(mockTemplate),
          },
          contact: {
            findMany: jest.fn().mockResolvedValue(mockContacts),
          },
        });
      });

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        mockTransaction
      );

      await expect(CampaignService.create(createData)).rejects.toThrow(
        "Contacts not found: 999"
      );
    });
  });

  // --- Test Suite for getAll ---
  describe("getAll", () => {
    it("should fetch all campaigns with relations", async () => {
      const mockCampaigns = [
        {
          id: 1,
          name: "Campaign 1",
          status: "Draft",
          templateId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          template: {
            id: 1,
            name: "Template 1",
            subject: "Subject 1",
            body: "Body 1",
            archived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          recipients: [
            {
              id: 1,
              status: "Scheduled",
              sentAt: null,
              campaignId: 1,
              contactId: 1,
              contact: {
                id: 1,
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
                company: "Test Co",
                tags: [],
                archived: false,
                createdAt: new Date(),
              },
            },
          ],
        },
      ];

      (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValue(
        mockCampaigns
      );

      const result = await CampaignService.getAll();

      expect(result).toEqual(mockCampaigns);
      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
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
    });
  });

  // --- Test Suite for getById ---
  describe("getById", () => {
    it("should fetch a campaign by ID with relations", async () => {
      const mockCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        template: {
          id: 1,
          name: "Test Template",
          subject: "Test Subject",
          body: "Test Body",
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        recipients: [],
      };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      const result = await CampaignService.getById(1);

      expect(result).toEqual(mockCampaign);
      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          template: true,
          recipients: {
            include: {
              contact: true,
            },
          },
        },
      });
    });

    it("should return null when campaign not found", async () => {
      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await CampaignService.getById(999);

      expect(result).toBeNull();
    });

    it("should throw error for invalid ID", async () => {
      await expect(CampaignService.getById(-1)).rejects.toThrow(
        "Campaign ID must be a valid positive number"
      );
    });
  });

  // --- Test Suite for update ---
  describe("update", () => {
    it("should update campaign successfully", async () => {
      const updateData = {
        name: "Updated Campaign",
        status: "Active",
      };

      const mockUpdatedCampaign = {
        id: 1,
        name: "Updated Campaign",
        status: "Active",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.campaign.update as jest.Mock).mockResolvedValue(
        mockUpdatedCampaign
      );

      const result = await CampaignService.update(1, updateData);

      expect(result).toEqual(mockUpdatedCampaign);
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated Campaign",
          status: "Active",
        },
      });
    });

    it("should validate template exists when updating templateId", async () => {
      const updateData = {
        templateId: 2,
      };

      const mockTemplate = {
        id: 2,
        name: "Template 2",
        subject: "Subject 2",
        body: "Body 2",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate
      );
      (mockPrisma.campaign.update as jest.Mock).mockResolvedValue(
        mockUpdatedCampaign
      );

      const result = await CampaignService.update(1, updateData);

      expect(result).toEqual(mockUpdatedCampaign);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 2 },
      });
    });

    it("should throw error when template not found for update", async () => {
      const updateData = {
        templateId: 999,
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CampaignService.update(1, updateData)).rejects.toThrow(
        "Template with ID 999 not found"
      );
    });

    it("should throw error for invalid ID", async () => {
      await expect(
        CampaignService.update(-1, { name: "Test" })
      ).rejects.toThrow("Campaign ID must be a valid positive number");
    });

    it("should throw error for empty update data", async () => {
      await expect(CampaignService.update(1, {})).rejects.toThrow(
        "Update data cannot be empty"
      );
    });

    it("should throw error for empty campaign name", async () => {
      await expect(CampaignService.update(1, { name: "" })).rejects.toThrow(
        "Campaign name cannot be empty"
      );
    });
  });

  // --- Test Suite for delete ---
  describe("delete", () => {
    it("should delete campaign and its recipients", async () => {
      const mockDeletedCampaign = {
        id: 1,
        name: "Deleted Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return await callback({
          campaignRecipient: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          campaign: {
            delete: jest.fn().mockResolvedValue(mockDeletedCampaign),
          },
        });
      });

      (mockPrisma.$transaction as jest.Mock).mockImplementation(
        mockTransaction
      );

      const result = await CampaignService.delete(1);

      expect(result).toEqual(mockDeletedCampaign);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("should throw error for invalid ID", async () => {
      await expect(CampaignService.delete(-1)).rejects.toThrow(
        "Campaign ID must be a valid positive number"
      );
    });
  });

  // --- Test Suite for updateRecipientStatus ---
  describe("updateRecipientStatus", () => {
    it("should update recipient status with sentAt date", async () => {
      const sentAt = new Date();
      const mockUpdatedRecipient = {
        id: 1,
        status: "Sent",
        sentAt,
        campaignId: 1,
        contactId: 1,
      };

      (mockPrisma.campaignRecipient.update as jest.Mock).mockResolvedValue(
        mockUpdatedRecipient
      );

      const result = await CampaignService.updateRecipientStatus(
        1,
        1,
        "Sent",
        sentAt
      );

      expect(result).toEqual(mockUpdatedRecipient);
      expect(mockPrisma.campaignRecipient.update).toHaveBeenCalledWith({
        where: {
          campaignId_contactId: {
            campaignId: 1,
            contactId: 1,
          },
        },
        data: {
          status: "Sent",
          sentAt,
        },
      });
    });

    it("should update recipient status without sentAt date", async () => {
      const mockUpdatedRecipient = {
        id: 1,
        status: "Failed",
        sentAt: null,
        campaignId: 1,
        contactId: 1,
      };

      (mockPrisma.campaignRecipient.update as jest.Mock).mockResolvedValue(
        mockUpdatedRecipient
      );

      const result = await CampaignService.updateRecipientStatus(
        1,
        1,
        "Failed"
      );

      expect(result).toEqual(mockUpdatedRecipient);
      expect(mockPrisma.campaignRecipient.update).toHaveBeenCalledWith({
        where: {
          campaignId_contactId: {
            campaignId: 1,
            contactId: 1,
          },
        },
        data: {
          status: "Failed",
        },
      });
    });
  });

  // --- Test Suite for getStatistics ---
  describe("getStatistics", () => {
    it("should calculate campaign statistics correctly", async () => {
      const mockRecipients = [
        {
          id: 1,
          status: "Scheduled",
          campaignId: 1,
          contactId: 1,
          sentAt: null,
        },
        {
          id: 2,
          status: "Sent",
          campaignId: 1,
          contactId: 2,
          sentAt: new Date(),
        },
        {
          id: 3,
          status: "Sent",
          campaignId: 1,
          contactId: 3,
          sentAt: new Date(),
        },
        {
          id: 4,
          status: "Opened",
          campaignId: 1,
          contactId: 4,
          sentAt: new Date(),
        },
        { id: 5, status: "Failed", campaignId: 1, contactId: 5, sentAt: null },
        {
          id: 6,
          status: "Bounced",
          campaignId: 1,
          contactId: 6,
          sentAt: new Date(),
        },
      ];

      (mockPrisma.campaignRecipient.findMany as jest.Mock).mockResolvedValue(
        mockRecipients
      );

      const result = await CampaignService.getStatistics(1);

      expect(result).toEqual({
        total: 6,
        scheduled: 1,
        sent: 2,
        failed: 1,
        opened: 1,
        clicked: 0,
        bounced: 1,
        deliveryRate: "50.00", // (2 - 1) / 2 * 100 = 50.00
        openRate: "50.00", // 1 / 2 * 100 = 50.00
        clickRate: "0.00", // 0 / 2 * 100 = 0
      });
    });

    it("should handle empty recipients correctly", async () => {
      (mockPrisma.campaignRecipient.findMany as jest.Mock).mockResolvedValue(
        []
      );

      const result = await CampaignService.getStatistics(1);

      expect(result).toEqual({
        total: 0,
        scheduled: 0,
        sent: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        deliveryRate: "0",
        openRate: "0",
        clickRate: "0",
      });
    });
  });

  // --- Test Suite for sendCampaign ---
  describe("sendCampaign", () => {
    it("should send campaign successfully to all recipients", async () => {
      const mockCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        template: {
          id: 1,
          name: "Test Template",
          subject: "Hello {{firstName}}",
          body: "Hi {{firstName}} {{lastName}} from {{company}}!",
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        recipients: [
          {
            id: 1,
            status: "Scheduled",
            sentAt: null,
            campaignId: 1,
            contactId: 1,
            contact: {
              id: 1,
              email: "john@example.com",
              firstName: "John",
              lastName: "Doe",
              company: "Test Corp",
              tags: [],
              archived: false,
              createdAt: new Date(),
            },
          },
          {
            id: 2,
            status: "Scheduled",
            sentAt: null,
            campaignId: 1,
            contactId: 2,
            contact: {
              id: 2,
              email: "jane@example.com",
              firstName: "Jane",
              lastName: "Smith",
              company: "Example Inc",
              tags: [],
              archived: false,
              createdAt: new Date(),
            },
          },
        ],
      };

      // Mock campaign.findUnique
      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      // Mock campaign.update calls
      (mockPrisma.campaign.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockCampaign, status: "Sending" })
        .mockResolvedValueOnce({ ...mockCampaign, status: "Sent" });

      // Mock email service
      mockEmailService.send.mockResolvedValue({
        success: true,
        messageId: "test-message-id",
      });

      // Mock updateRecipientStatus method by spying on the class method
      const updateRecipientStatusSpy = jest
        .spyOn(CampaignService, "updateRecipientStatus")
        .mockResolvedValue({
          status: "Sent",
          sentAt: new Date(),
          campaignId: 1,
          contactId: 1,
        } as CampaignRecipient);

      const result = await CampaignService.sendCampaign(1);

      expect(result).toEqual({
        message: "Campaign sending completed. Sent: 2, Failed: 0",
        sent: 2,
        failed: 0,
        totalRecipients: 2,
      });

      // Verify emails were sent with personalization
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: "john@example.com",
        subject: "Hello John",
        body: "Hi John Doe from Test Corp!",
      });
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: "jane@example.com",
        subject: "Hello Jane",
        body: "Hi Jane Smith from Example Inc!",
      });

      // Verify recipient statuses were updated
      expect(updateRecipientStatusSpy).toHaveBeenCalledTimes(2);
      expect(updateRecipientStatusSpy).toHaveBeenCalledWith(
        1,
        1,
        "Sent",
        expect.any(Date)
      );
      expect(updateRecipientStatusSpy).toHaveBeenCalledWith(
        1,
        2,
        "Sent",
        expect.any(Date)
      );

      // Verify campaign status was updated
      expect(mockPrisma.campaign.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "Sending" },
      });
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "Sent" },
      });

      updateRecipientStatusSpy.mockRestore();
    });

    it("should handle email sending failures", async () => {
      const mockCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        template: {
          id: 1,
          name: "Test Template",
          subject: "Hello {{firstName}}",
          body: "Hi {{firstName}}!",
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        recipients: [
          {
            id: 1,
            status: "Scheduled",
            sentAt: null,
            campaignId: 1,
            contactId: 1,
            contact: {
              id: 1,
              email: "invalid@example.com",
              firstName: "John",
              lastName: "Doe",
              company: "Test Corp",
              tags: [],
              archived: false,
              createdAt: new Date(),
            },
          },
        ],
      };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(
        mockCampaign
      );
      (mockPrisma.campaign.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockCampaign, status: "Sending" })
        .mockResolvedValueOnce({ ...mockCampaign, status: "Failed" });

      // Mock email service to fail
      mockEmailService.send.mockRejectedValue(
        new Error("Email sending failed")
      );

      // Mock updateRecipientStatus method
      const updateRecipientStatusSpy = jest
        .spyOn(CampaignService, "updateRecipientStatus")
        .mockResolvedValue({
          status: "Failed",
          sentAt: null,
          campaignId: 1,
          contactId: 1,
        } as CampaignRecipient);

      const result = await CampaignService.sendCampaign(1);

      expect(result).toEqual({
        message: "Campaign sending completed. Sent: 0, Failed: 1",
        sent: 0,
        failed: 1,
        totalRecipients: 1,
      });

      expect(updateRecipientStatusSpy).toHaveBeenCalledWith(1, 1, "Failed");
      expect(mockPrisma.campaign.update).toHaveBeenLastCalledWith({
        where: { id: 1 },
        data: { status: "Failed" },
      });

      updateRecipientStatusSpy.mockRestore();
    });

    it("should throw error for invalid campaign ID", async () => {
      await expect(CampaignService.sendCampaign(-1)).rejects.toThrow(
        "Campaign ID must be a valid positive number"
      );
    });

    it("should throw error when campaign not found", async () => {
      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(CampaignService.sendCampaign(999)).rejects.toThrow(
        "Campaign with ID 999 not found"
      );
    });

    it("should throw error when template not found", async () => {
      const mockCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        template: null,
        recipients: [],
      };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      await expect(CampaignService.sendCampaign(1)).rejects.toThrow(
        "Template not found for campaign 1"
      );
    });

    it("should throw error when no scheduled recipients found", async () => {
      const mockCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Draft",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        template: {
          id: 1,
          name: "Test Template",
          subject: "Test Subject",
          body: "Test Body",
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        recipients: [],
      };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValue(
        mockCampaign
      );

      await expect(CampaignService.sendCampaign(1)).rejects.toThrow(
        "No scheduled recipients found for campaign 1"
      );
    });
  });

  // --- Test Suite for addRecipients ---
  describe("addRecipients", () => {
    it("should add recipients to campaign", async () => {
      const mockRecipients = [
        {
          id: 1,
          status: "Scheduled",
          sentAt: null,
          campaignId: 1,
          contactId: 1,
          contact: {
            id: 1,
            email: "test@example.com",
            firstName: "Test",
            lastName: "User",
            company: "Test Co",
            tags: [],
            archived: false,
            createdAt: new Date(),
          },
        },
      ];

      (mockPrisma.campaignRecipient.createMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (mockPrisma.campaignRecipient.findMany as jest.Mock).mockResolvedValue(
        mockRecipients
      );

      const result = await CampaignService.addRecipients(1, [1]);

      expect(result).toEqual(mockRecipients);
      expect(mockPrisma.campaignRecipient.createMany).toHaveBeenCalledWith({
        data: [
          {
            campaignId: 1,
            contactId: 1,
            status: "Scheduled",
          },
        ],
      });
    });
  });

  // --- Test Suite for removeRecipient ---
  describe("removeRecipient", () => {
    it("should remove recipient from campaign", async () => {
      (mockPrisma.campaignRecipient.delete as jest.Mock).mockResolvedValue({
        id: 1,
        status: "Scheduled",
        sentAt: null,
        campaignId: 1,
        contactId: 1,
      });

      await CampaignService.removeRecipient(1, 1);

      expect(mockPrisma.campaignRecipient.delete).toHaveBeenCalledWith({
        where: {
          campaignId_contactId: {
            campaignId: 1,
            contactId: 1,
          },
        },
      });
    });
  });

  // --- Test Suite for getByTemplateId ---
  describe("getByTemplateId", () => {
    it("should fetch campaigns by template ID", async () => {
      const mockCampaigns = [
        {
          id: 1,
          name: "Campaign 1",
          status: "Draft",
          templateId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValue(
        mockCampaigns
      );

      const result = await CampaignService.getByTemplateId(1);

      expect(result).toEqual(mockCampaigns);
      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
        where: { templateId: 1 },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  // --- Test Suite for updateStatus ---
  describe("updateStatus", () => {
    it("should update campaign status", async () => {
      const mockUpdatedCampaign = {
        id: 1,
        name: "Test Campaign",
        status: "Active",
        templateId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.campaign.update as jest.Mock).mockResolvedValue(
        mockUpdatedCampaign
      );

      const result = await CampaignService.updateStatus(1, "Active");

      expect(result).toEqual(mockUpdatedCampaign);
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "Active" },
      });
    });
  });
});
