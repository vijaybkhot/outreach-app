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
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTemplate = {
        id: 1,
        name: "Updated Template",
        subject: "Updated Subject",
        body: "Updated body with {{firstName}}",
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
        data: updateData,
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
});
