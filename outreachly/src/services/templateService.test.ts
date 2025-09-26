// src/services/templateService.test.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { TemplateService } from "./templateService";

// Mock the central prisma instance from `lib/prisma`
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// We can now get a reference to the mock for our tests
import { prisma as mockPrisma } from "@/lib/prisma";

// Extended Template interface for testing with customPlaceholders
interface TemplateWithPlaceholders {
  id: number;
  name: string;
  subject: string;
  body: string;
  customPlaceholders: string[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

describe("TemplateService", () => {
  beforeEach(() => {
    // Reset the mock before each test to ensure test isolation
    mockReset(mockPrisma);
  });

  // --- Test Suite for getAll ---
  describe("getAll", () => {
    it("should fetch all non-archived templates by default", async () => {
      const mockTemplates = [
        {
          id: 1,
          name: "Welcome Email",
          subject: "Welcome to our platform",
          body: "Hello {{firstName}}, welcome!",
          customPlaceholders: ["firstName"],
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const templates = await TemplateService.getAll();

      expect(templates).toHaveLength(1);
      expect(templates[0].archived).toBe(false);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        where: { archived: false },
      });
    });

    it("should include archived templates when includeArchived is true", async () => {
      const mockTemplates = [
        {
          id: 1,
          name: "Template 1",
          subject: "Subject 1",
          body: "Body 1",
          customPlaceholders: [],
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Template 2",
          subject: "Subject 2",
          body: "Body 2",
          customPlaceholders: [],
          archived: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const templates = await TemplateService.getAll(true);

      expect(templates).toHaveLength(2);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        where: {},
      });
    });

    it("should handle empty template list", async () => {
      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue([]);

      const templates = await TemplateService.getAll();

      expect(templates).toHaveLength(0);
      expect(Array.isArray(templates)).toBe(true);
    });
  });

  // --- Test Suite for getById ---
  describe("getById", () => {
    it("should fetch a template by ID", async () => {
      const mockTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test body with {{firstName}}",
        customPlaceholders: ["firstName"],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      const template = await TemplateService.getById(1);

      expect(template).toEqual(mockTemplate);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null when template not found", async () => {
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      const template = await TemplateService.getById(999);

      expect(template).toBeNull();
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it("should throw error for invalid ID", async () => {
      await expect(TemplateService.getById(-1)).rejects.toThrow(
        "Invalid template ID"
      );
    });
  });

  // --- Test Suite for create ---
  describe("create", () => {
    it("should create a new template with valid data", async () => {
      const templateData = {
        name: "New Template",
        subject: "New Subject",
        body: "Hello {{firstName}}, this is a new template!",
        archived: false,
      };

      const mockCreatedTemplate = {
        id: 1,
        ...templateData,
        customPlaceholders: ["firstName"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (mockPrisma.template.create as jest.Mock).mockResolvedValue(
        mockCreatedTemplate
      );

      const result = await TemplateService.create(templateData);

      expect(result).toEqual(mockCreatedTemplate);
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          name: "New Template",
          subject: "New Subject",
          body: "Hello {{firstName}}, this is a new template!",
          archived: false,
          customPlaceholders: ["firstName"],
        },
      });
    });

    it("should throw error for empty template name", async () => {
      const invalidData = {
        name: "",
        subject: "Valid Subject",
        body: "Valid body",
        archived: false,
      };

      await expect(TemplateService.create(invalidData)).rejects.toThrow(
        "Template name cannot be empty."
      );
    });

    it("should throw error for empty template body", async () => {
      const invalidData = {
        name: "Valid Name",
        subject: "Valid Subject",
        body: "",
        archived: false,
      };

      await expect(TemplateService.create(invalidData)).rejects.toThrow(
        "Template body cannot be empty."
      );
    });

    it("should throw error for empty template subject", async () => {
      const invalidData = {
        name: "Valid Name",
        subject: "",
        body: "Valid body",
        archived: false,
      };

      await expect(TemplateService.create(invalidData)).rejects.toThrow(
        "Template subject cannot be empty."
      );
    });

    it("should throw error for template name too long", async () => {
      const invalidData = {
        name: "a".repeat(101), // 101 characters
        subject: "Valid Subject",
        body: "Valid body",
        archived: false,
      };

      await expect(TemplateService.create(invalidData)).rejects.toThrow(
        "Template name cannot exceed 100 characters."
      );
    });

    it("should throw error for template subject too long", async () => {
      const invalidData = {
        name: "Valid Name",
        subject: "a".repeat(256), // 256 characters
        body: "Valid body",
        archived: false,
      };

      await expect(TemplateService.create(invalidData)).rejects.toThrow(
        "Template subject cannot exceed 255 characters."
      );
    });

    it("should throw error for template body too long", async () => {
      const invalidData = {
        name: "Valid Name",
        subject: "Valid Subject",
        body: "a".repeat(10001), // 10001 characters
        archived: false,
      };

      await expect(TemplateService.create(invalidData)).rejects.toThrow(
        "Template body cannot exceed 10,000 characters."
      );
    });

    it("should handle Prisma unique constraint error", async () => {
      const templateData = {
        name: "Duplicate Name",
        subject: "Test Subject",
        body: "Test body",
        archived: false,
      };

      const prismaError = {
        code: "P2002",
        meta: { target: ["name"] },
        message: "Unique constraint failed",
      };

      (mockPrisma.template.create as jest.Mock).mockRejectedValue(prismaError);

      await expect(TemplateService.create(templateData)).rejects.toThrow(
        'A template with the name "Duplicate Name" already exists.'
      );
    });
  });

  // --- Test Suite for update ---
  describe("update", () => {
    it("should update a template with valid data", async () => {
      const updateData = {
        name: "Updated Template",
        subject: "Updated Subject",
        body: "Updated body with {{firstName}}",
      };

      const existingTemplate = {
        id: 1,
        name: "Original Template",
        subject: "Original Subject",
        body: "Original body",
        customPlaceholders: [],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTemplate = {
        id: 1,
        name: "Updated Template",
        subject: "Updated Subject",
        body: "Updated body with {{firstName}}",
        customPlaceholders: ["firstName"],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock both findUnique and update calls
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.template.update as jest.Mock).mockResolvedValue(
        mockUpdatedTemplate
      );

      const result = await TemplateService.update(1, updateData);

      expect(result).toEqual(mockUpdatedTemplate);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated Template",
          subject: "Updated Subject",
          body: "Updated body with {{firstName}}",
          customPlaceholders: ["firstName"],
        },
      });
    });

    it("should throw error for invalid ID", async () => {
      await expect(TemplateService.update(-1, {})).rejects.toThrow(
        "Invalid template ID"
      );
    });

    it("should throw error when trying to update with empty name", async () => {
      const invalidData = { name: "" };

      await expect(TemplateService.update(1, invalidData)).rejects.toThrow(
        "Template name cannot be empty."
      );
    });

    it("should throw error when trying to update with empty body", async () => {
      const invalidData = { body: "" };

      await expect(TemplateService.update(1, invalidData)).rejects.toThrow(
        "Template body cannot be empty."
      );
    });

    it("should throw error when trying to update with empty subject", async () => {
      const invalidData = { subject: "" };

      await expect(TemplateService.update(1, invalidData)).rejects.toThrow(
        "Template subject cannot be empty."
      );
    });

    it("should throw error when template not found for update", async () => {
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        TemplateService.update(999, { name: "New Name" })
      ).rejects.toThrow("Template not found");
    });

    it("should handle Prisma unique constraint error on update", async () => {
      const existingTemplate = {
        id: 1,
        name: "Original Template",
        subject: "Original Subject",
        body: "Original body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const prismaError = {
        code: "P2002",
        meta: { target: ["name"] },
        message: "Unique constraint failed",
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.template.update as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        TemplateService.update(1, { name: "Duplicate Name" })
      ).rejects.toThrow(
        'A template with the name "Duplicate Name" already exists.'
      );
    });
  });

  // --- Test Suite for delete ---
  describe("delete", () => {
    it("should delete a template by ID", async () => {
      const existingTemplate = {
        id: 1,
        name: "Deleted Template",
        subject: "Deleted Subject",
        body: "Deleted body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDeletedTemplate = {
        id: 1,
        name: "Deleted Template",
        subject: "Deleted Subject",
        body: "Deleted body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock findUnique, campaign count, and delete calls
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.campaign.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.template.delete as jest.Mock).mockResolvedValue(
        mockDeletedTemplate
      );

      const result = await TemplateService.delete(1);

      expect(result).toEqual(mockDeletedTemplate);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.campaign.count).toHaveBeenCalledWith({
        where: { templateId: 1 },
      });
      expect(mockPrisma.template.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should throw error for invalid ID", async () => {
      await expect(TemplateService.delete(-1)).rejects.toThrow(
        "Invalid template ID"
      );
    });

    it("should throw error when template not found", async () => {
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(TemplateService.delete(999)).rejects.toThrow(
        "Template not found"
      );
    });

    it("should throw error when template is used in campaigns", async () => {
      const existingTemplate = {
        id: 1,
        name: "Used Template",
        subject: "Used Subject",
        body: "Used body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.campaign.count as jest.Mock).mockResolvedValue(2); // 2 campaigns using this template

      await expect(TemplateService.delete(1)).rejects.toThrow(
        "Cannot delete template that is being used in campaigns."
      );
    });
  });

  // --- Test Suite for setArchived ---
  describe("setArchived", () => {
    it("should archive a template", async () => {
      const existingTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockArchivedTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test body",
        archived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock both findUnique and update calls
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.template.update as jest.Mock).mockResolvedValue(
        mockArchivedTemplate
      );

      const result = await TemplateService.setArchived(1, true);

      expect(result).toEqual(mockArchivedTemplate);
      expect(result.archived).toBe(true);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { archived: true },
      });
    });

    it("should unarchive a template", async () => {
      const existingTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test body",
        archived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUnarchivedTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock both findUnique and update calls
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.template.update as jest.Mock).mockResolvedValue(
        mockUnarchivedTemplate
      );

      const result = await TemplateService.setArchived(1, false);

      expect(result).toEqual(mockUnarchivedTemplate);
      expect(result.archived).toBe(false);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { archived: false },
      });
    });

    it("should throw error for invalid ID", async () => {
      await expect(TemplateService.setArchived(-1, true)).rejects.toThrow(
        "Invalid template ID"
      );
    });
  });

  // --- Test Suite for search ---
  describe("search", () => {
    it("should search templates by name", async () => {
      const mockTemplates = [
        {
          id: 1,
          name: "Welcome Email",
          subject: "Welcome Subject",
          body: "Welcome body",
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const result = await TemplateService.search("welcome");

      expect(result).toHaveLength(1);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { archived: false },
            {
              OR: [
                { name: { contains: "welcome", mode: "insensitive" } },
                { subject: { contains: "welcome", mode: "insensitive" } },
                { body: { contains: "welcome", mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return all templates when query is empty", async () => {
      const mockTemplates = [
        {
          id: 1,
          name: "Template 1",
          subject: "Subject 1",
          body: "Body 1",
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const result = await TemplateService.search("");

      expect(result).toHaveLength(1);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        where: { archived: false },
      });
    });

    it("should include archived templates when includeArchived is true", async () => {
      const mockTemplates = [
        {
          id: 1,
          name: "Welcome Email",
          subject: "Welcome Subject",
          body: "Welcome body",
          archived: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplates
      );

      const result = await TemplateService.search("welcome", true);

      expect(result).toHaveLength(1);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {},
            {
              OR: [
                { name: { contains: "welcome", mode: "insensitive" } },
                { subject: { contains: "welcome", mode: "insensitive" } },
                { body: { contains: "welcome", mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  // --- Test Suite for duplicate ---
  describe("duplicate", () => {
    it("should duplicate a template with a new name", async () => {
      const originalTemplate = {
        id: 1,
        name: "Original Template",
        subject: "Original Subject",
        body: "Original body with {{firstName}}",
        customPlaceholders: ["firstName"],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicatedTemplate = {
        id: 2,
        name: "Duplicated Template",
        subject: "Original Subject",
        body: "Original body with {{firstName}}",
        customPlaceholders: ["firstName"],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        originalTemplate
      );
      (mockPrisma.template.create as jest.Mock).mockResolvedValue(
        duplicatedTemplate
      );

      const result = await TemplateService.duplicate(1, "Duplicated Template");

      expect(result).toEqual(duplicatedTemplate);
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          name: "Duplicated Template",
          subject: "Original Subject",
          body: "Original body with {{firstName}}",
          archived: false,
          customPlaceholders: ["firstName"],
        },
      });
    });

    it("should throw error for invalid template ID", async () => {
      await expect(TemplateService.duplicate(-1, "New Name")).rejects.toThrow(
        "Invalid template ID"
      );
    });

    it("should throw error for empty new name", async () => {
      await expect(TemplateService.duplicate(1, "")).rejects.toThrow(
        "New template name cannot be empty"
      );
    });

    it("should throw error when original template not found", async () => {
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(TemplateService.duplicate(999, "New Name")).rejects.toThrow(
        "Template not found"
      );
    });
  });

  // --- Test Suite for render ---
  describe("render", () => {
    it("should render template with variables", async () => {
      const mockTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Hello {{firstName}}",
        body: "Dear {{firstName}} from {{company}}, welcome!",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      const result = await TemplateService.render(1, {
        firstName: "John",
        company: "Acme Corp",
      });

      expect(result).toEqual({
        subject: "Hello John",
        body: "Dear John from Acme Corp, welcome!",
      });
      expect(mockPrisma.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should handle missing variables gracefully", async () => {
      const mockTemplate = {
        id: 1,
        name: "Test Template",
        subject: "Hello {{firstName}}",
        body: "Dear {{firstName}} from {{company}}, welcome!",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate
      );

      const result = await TemplateService.render(1, {
        firstName: "John",
        // company is missing
      });

      expect(result).toEqual({
        subject: "Hello John",
        body: "Dear John from {{company}}, welcome!", // Missing variables are left as-is
      });
    });

    it("should throw error for invalid template ID", async () => {
      await expect(TemplateService.render(-1, {})).rejects.toThrow(
        "Invalid template ID"
      );
    });

    it("should throw error when template not found", async () => {
      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(TemplateService.render(999, {})).rejects.toThrow(
        "Template not found"
      );
    });
  });

  // --- Test Suite for getUsageStats ---
  describe("getUsageStats", () => {
    it("should get usage stats for all templates", async () => {
      const mockTemplatesWithCampaigns = [
        {
          id: 1,
          name: "Template 1",
          campaigns: [
            { id: 2, createdAt: new Date("2023-01-02") }, // Most recent first
            { id: 1, createdAt: new Date("2023-01-01") },
          ],
        },
        {
          id: 2,
          name: "Template 2",
          campaigns: [],
        },
      ];

      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplatesWithCampaigns
      );

      const result = await TemplateService.getUsageStats();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        templateId: 1,
        templateName: "Template 1",
        campaignCount: 2,
        lastUsed: new Date("2023-01-02"),
      });
      expect(result[1]).toEqual({
        templateId: 2,
        templateName: "Template 2",
        campaignCount: 0,
        lastUsed: null,
      });
    });

    it("should get usage stats for specific template", async () => {
      const mockTemplateWithCampaigns = [
        {
          id: 1,
          name: "Template 1",
          campaigns: [{ id: 1, createdAt: new Date("2023-01-01") }],
        },
      ];

      (mockPrisma.template.findMany as jest.Mock).mockResolvedValue(
        mockTemplateWithCampaigns
      );

      const result = await TemplateService.getUsageStats(1);

      expect(result).toHaveLength(1);
      expect(mockPrisma.template.findMany).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          campaigns: {
            select: {
              id: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
    });
  });

  // --- Test Suite for extractPlaceholderNames ---
  describe("extractPlaceholderNames", () => {
    it("should extract simple placeholders", () => {
      const text = "Hello {{firstName}} from {{company}}!";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual(["firstName", "company"]);
    });

    it("should extract dot notation placeholders", () => {
      const text = "Hi {{contact.firstName}}, welcome to {{company.name}}!";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual(["contact.firstName", "company.name"]);
    });

    it("should handle mixed simple and dot notation placeholders", () => {
      const text =
        "Dear {{contact.firstName}} {{lastName}}, {{product.name}} is ready at {{company.address}}!";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual([
        "contact.firstName",
        "lastName",
        "product.name",
        "company.address",
      ]);
    });

    it("should handle placeholders with underscores and numbers", () => {
      const text = "Hello {{user_name}} and {{contact_2}} from {{company_123}}";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual(["user_name", "contact_2", "company_123"]);
    });

    it("should handle placeholders with whitespace", () => {
      const text = "Hello {{ firstName }} from {{ company.name }}!";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual(["firstName", "company.name"]);
    });

    it("should remove duplicates", () => {
      const text =
        "Hello {{firstName}} and {{firstName}} from {{company}} at {{company}}!";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual(["firstName", "company"]);
    });

    it("should return empty array when no placeholders found", () => {
      const text = "This is a simple text with no placeholders.";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual([]);
    });

    it("should ignore invalid placeholder syntax", () => {
      const text = "Hello {firstName} and {{lastName}} and {{{company}}}";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual(["lastName", "company"]);
    });

    it("should handle complex nested dot notation", () => {
      const text =
        "Welcome {{user.profile.firstName}} to {{company.settings.name}}";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual([
        "user.profile.firstName",
        "company.settings.name",
      ]);
    });

    it("should handle multiple placeholders in same text", () => {
      const text =
        "{{contact.firstName}} {{contact.lastName}} from {{contact.company}} loves {{product.name}} at {{company.location}}";
      const result = TemplateService.extractPlaceholderNames(text);
      expect(result).toEqual([
        "contact.firstName",
        "contact.lastName",
        "contact.company",
        "product.name",
        "company.location",
      ]);
    });
  });

  // --- Test Suite for legacy extractVariables (kept for compatibility) ---
  describe("extractVariables", () => {
    it("should extract variables from subject and body", () => {
      const subject = "Hello {{firstName}}";
      const body =
        "Dear {{firstName}} from {{company}}, your {{product}} is ready!";

      const result = TemplateService.extractVariables(subject, body);

      expect(result).toEqual(["firstName", "company", "product"]);
    });

    it("should handle duplicate variables", () => {
      const subject = "Hello {{firstName}}";
      const body = "Dear {{firstName}}, welcome {{firstName}}!";

      const result = TemplateService.extractVariables(subject, body);

      expect(result).toEqual(["firstName"]);
    });

    it("should return empty array when no variables found", () => {
      const subject = "Hello there";
      const body = "This is a simple email with no variables.";

      const result = TemplateService.extractVariables(subject, body);

      expect(result).toEqual([]);
    });

    it("should handle invalid variable syntax", () => {
      const subject = "Hello {firstName}"; // Single braces
      const body = "Dear {{firstName}} and {lastName}!"; // Mixed syntax

      const result = TemplateService.extractVariables(subject, body);

      expect(result).toEqual(["firstName"]);
    });
  });

  // --- Integration Tests for Placeholder Detection ---
  describe("Placeholder Detection Integration", () => {
    it("should auto-detect placeholders when creating template", async () => {
      const templateData = {
        name: "Complex Template",
        subject: "Welcome {{contact.firstName}} to {{company.name}}!",
        body: "Dear {{contact.firstName}}, your {{product.type}} from {{vendor.name}} is ready!",
        archived: false,
      };

      const mockCreatedTemplate = {
        id: 1,
        ...templateData,
        customPlaceholders: [
          "contact.firstName",
          "company.name",
          "product.type",
          "vendor.name",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.create as jest.Mock).mockResolvedValue(
        mockCreatedTemplate
      );

      const result = await TemplateService.create(templateData);

      expect((result as TemplateWithPlaceholders).customPlaceholders).toEqual([
        "contact.firstName",
        "company.name",
        "product.type",
        "vendor.name",
      ]);
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          name: "Complex Template",
          subject: "Welcome {{contact.firstName}} to {{company.name}}!",
          body: "Dear {{contact.firstName}}, your {{product.type}} from {{vendor.name}} is ready!",
          archived: false,
          customPlaceholders: [
            "contact.firstName",
            "company.name",
            "product.type",
            "vendor.name",
          ],
        },
      });
    });

    it("should re-detect placeholders when updating template content", async () => {
      const existingTemplate = {
        id: 1,
        name: "Original Template",
        subject: "Hello {{firstName}}",
        body: "Welcome {{firstName}}!",
        customPlaceholders: ["firstName"],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        subject: "Hi {{contact.firstName}} from {{company.name}}!",
        body: "Welcome to {{product.category}} at {{company.location}}!",
      };

      const mockUpdatedTemplate = {
        ...existingTemplate,
        ...updateData,
        customPlaceholders: [
          "contact.firstName",
          "company.name",
          "product.category",
          "company.location",
        ],
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.template.update as jest.Mock).mockResolvedValue(
        mockUpdatedTemplate
      );

      const result = await TemplateService.update(1, updateData);

      expect((result as TemplateWithPlaceholders).customPlaceholders).toEqual([
        "contact.firstName",
        "company.name",
        "product.category",
        "company.location",
      ]);
      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          subject: "Hi {{contact.firstName}} from {{company.name}}!",
          body: "Welcome to {{product.category}} at {{company.location}}!",
          customPlaceholders: [
            "contact.firstName",
            "company.name",
            "product.category",
            "company.location",
          ],
        },
      });
    });

    it("should not update placeholders when only name is changed", async () => {
      const existingTemplate = {
        id: 1,
        name: "Original Template",
        subject: "Hello {{firstName}}",
        body: "Welcome {{firstName}}!",
        customPlaceholders: ["firstName"],
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        name: "Updated Template Name",
      };

      const mockUpdatedTemplate = {
        ...existingTemplate,
        ...updateData,
      };

      (mockPrisma.template.findUnique as jest.Mock).mockResolvedValue(
        existingTemplate
      );
      (mockPrisma.template.update as jest.Mock).mockResolvedValue(
        mockUpdatedTemplate
      );

      await TemplateService.update(1, updateData);

      expect(mockPrisma.template.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated Template Name",
        },
      });
    });

    it("should handle templates with no placeholders", async () => {
      const templateData = {
        name: "Simple Template",
        subject: "Welcome to our platform!",
        body: "Thank you for joining us. We appreciate your business.",
        archived: false,
      };

      const mockCreatedTemplate = {
        id: 1,
        ...templateData,
        customPlaceholders: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.template.create as jest.Mock).mockResolvedValue(
        mockCreatedTemplate
      );

      const result = await TemplateService.create(templateData);

      expect((result as TemplateWithPlaceholders).customPlaceholders).toEqual(
        []
      );
      expect(mockPrisma.template.create).toHaveBeenCalledWith({
        data: {
          name: "Simple Template",
          subject: "Welcome to our platform!",
          body: "Thank you for joining us. We appreciate your business.",
          archived: false,
          customPlaceholders: [],
        },
      });
    });
  });
});
