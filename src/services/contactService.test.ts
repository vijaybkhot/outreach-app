// src/services/contactService.test.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "jest-mock-extended";
import { ContactService } from "./contactService";

// Mock the central prisma instance from `lib/prisma`
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// We can now get a reference to the mock for our tests
import { prisma as mockPrisma } from "@/lib/prisma";

describe("ContactService", () => {
  beforeEach(() => {
    // Reset the mock before each test to ensure test isolation
    mockReset(mockPrisma);
  });

  // --- Test Suite for getAll ---
  describe("getAll", () => {
    it("should fetch all contacts including archived when includeArchived is true", async () => {
      const mockContacts = [
        {
          id: 1,
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          company: "Test Co",
          tags: [],
          archived: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          firstName: "Archived",
          lastName: "User",
          email: "archived@example.com",
          company: "Old Co",
          tags: [],
          archived: true,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockContacts
      );

      const contacts = await ContactService.getAll(true);

      expect(contacts).toHaveLength(2);
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: "desc" },
      });
    });

    it("should fetch only non-archived contacts when includeArchived is false", async () => {
      const mockContacts = [
        {
          id: 1,
          firstName: "Active",
          lastName: "User",
          email: "active@example.com",
          company: "Test Co",
          tags: [],
          archived: false,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockContacts
      );

      const contacts = await ContactService.getAll(false);

      expect(contacts).toHaveLength(1);
      expect(contacts[0].archived).toBe(false);
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: { archived: false },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  // --- Test Suite for getById ---
  describe("getById", () => {
    it("should fetch a contact by ID", async () => {
      const mockContact = {
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Co",
        tags: [],
        archived: false,
        createdAt: new Date(),
      };
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(
        mockContact
      );

      const contact = await ContactService.getById(1);

      expect(contact).toEqual(mockContact);
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return null when contact not found", async () => {
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(null);

      const contact = await ContactService.getById(999);

      expect(contact).toBeNull();
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it("should throw error for invalid ID", async () => {
      await expect(ContactService.getById(-1)).rejects.toThrow(
        "Invalid contact ID"
      );
    });
  });

  // --- Test Suite for getByEmail ---
  describe("getByEmail", () => {
    it("should fetch a contact by email", async () => {
      const mockContact = {
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Co",
        tags: [],
        archived: false,
        createdAt: new Date(),
      };
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(
        mockContact
      );

      const contact = await ContactService.getByEmail("test@example.com");

      expect(contact).toEqual(mockContact);
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });

    it("should return null when email not found", async () => {
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(null);

      const contact = await ContactService.getByEmail("notfound@example.com");

      expect(contact).toBeNull();
    });

    it("should throw error for invalid email format", async () => {
      await expect(ContactService.getByEmail("invalid-email")).rejects.toThrow(
        "Invalid email address."
      );
    });
  });

  // --- Test Suite for create ---
  describe("create", () => {
    it("should add a new contact to the database", async () => {
      const newContactData = {
        firstName: "New",
        lastName: "Contact",
        email: "new@example.com",
        company: "New Inc",
        tags: ["new"],
        archived: false,
      };
      const createdContact = {
        ...newContactData,
        id: 2,
        createdAt: new Date(),
      };
      (mockPrisma.contact.create as jest.Mock).mockResolvedValue(
        createdContact
      );

      const result = await ContactService.create(newContactData);

      expect(result.id).toBe(2);
      expect(result.firstName).toBe("New");
      expect(mockPrisma.contact.create).toHaveBeenCalledWith({
        data: {
          firstName: "New",
          lastName: "Contact",
          email: "new@example.com",
          company: "New Inc",
          tags: ["new"],
        },
      });
    });
  });

  // --- Test Suite for update ---
  describe("update", () => {
    it("should update an existing contact with new data", async () => {
      // Arrange: Define the data for the update
      const contactId = 1;
      const updateData = {
        company: "Updated Corp",
        tags: ["Recruiter", "Updated"],
      };
      const existingContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Original Corp",
        tags: ["Original"],
        archived: false,
        createdAt: new Date(),
      };
      const updatedContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Updated Corp",
        tags: ["Recruiter", "Updated"],
        archived: false,
        createdAt: new Date(),
      };

      // Mock both findUnique and update calls
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(
        existingContact
      );
      (mockPrisma.contact.update as jest.Mock).mockResolvedValue(
        updatedContact
      );

      // Act: Call the update service method
      const result = await ContactService.update(contactId, updateData);

      // Assert: Check if the correct data was returned and the DB was called correctly
      expect(result.company).toBe("Updated Corp");
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(mockPrisma.contact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: updateData,
      });
    });
  });

  // --- Test Suite for delete (NEW) ---
  describe("delete", () => {
    it("should delete a contact by its ID", async () => {
      // Arrange
      const contactId = 1;
      const existingContact = {
        id: contactId,
        firstName: "Deleted",
        lastName: "User",
        email: "deleted@example.com",
        company: "",
        tags: [],
        archived: false,
        createdAt: new Date(),
      };
      const deletedContact = {
        id: contactId,
        firstName: "Deleted",
        lastName: "User",
        email: "deleted@example.com",
        company: "",
        tags: [],
        archived: false,
        createdAt: new Date(),
      };

      // Mock both findUnique and delete calls
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(
        existingContact
      );
      (mockPrisma.contact.delete as jest.Mock).mockResolvedValue(
        deletedContact
      );

      // Act
      await ContactService.delete(contactId);

      // Assert
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(mockPrisma.contact.delete).toHaveBeenCalledWith({
        where: { id: contactId },
      });
    });
  });

  // --- Test Suite for importFromCSV (NEW) ---
  describe("importFromCSV", () => {
    it("should create multiple contacts and return the count of imported records", async () => {
      // Arrange
      const csvData = [
        {
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          company: "Innovate",
          archived: false,
          createdAt: new Date(),
          tags: "Lead",
        },
        {
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@example.com",
          company: "Tech Corp",
          archived: false,
          createdAt: new Date(),
          tags: "",
        },
      ];
      // The createMany operation returns an object with a 'count' property
      (mockPrisma.contact.createMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      // Act
      const result = await ContactService.importFromCSV(csvData);

      // Assert
      expect(result).toBe(2);
      expect(mockPrisma.contact.createMany).toHaveBeenCalledTimes(1);
    });

    it("should handle contacts that already exist during import", async () => {
      // Arrange
      const csvData = [
        {
          firstName: "Existing",
          lastName: "User",
          email: "existing@example.com",
          company: "Tech Corp",
          archived: false,
          createdAt: new Date(),
          tags: "Lead",
        },
      ];

      // Mock that the import completes with reduced count due to duplicates
      (mockPrisma.contact.createMany as jest.Mock).mockResolvedValue({
        count: 0, // No new records due to duplicates
      });

      // Act
      const result = await ContactService.importFromCSV(csvData);

      // Assert
      expect(result).toBe(0);
      expect(mockPrisma.contact.createMany).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if the database operation fails", async () => {
      // Arrange
      const csvData = [
        {
          firstName: "Fail",
          lastName: "User",
          email: "fail@example.com",
          company: "Error Inc",
          archived: false,
          createdAt: new Date(),
          tags: "",
        },
      ];
      (mockPrisma.contact.createMany as jest.Mock).mockRejectedValue(
        new Error("Database connection lost")
      );

      // Act & Assert
      // We expect the service to catch the raw DB error and throw its own, more specific error
      await expect(ContactService.importFromCSV(csvData)).rejects.toThrow(
        "Database operation failed during CSV import."
      );
    });
  });

  // --- Test Suite for setArchived (NEW) ---
  describe("setArchived", () => {
    it("should archive a contact when archive is true", async () => {
      const contactId = 1;
      const existingContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Co",
        tags: [],
        archived: false,
        createdAt: new Date(),
      };
      const mockArchivedContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Co",
        tags: [],
        archived: true,
        createdAt: new Date(),
      };

      // Mock both findUnique and update calls
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(
        existingContact
      );
      (mockPrisma.contact.update as jest.Mock).mockResolvedValue(
        mockArchivedContact
      );

      const result = await ContactService.setArchived(contactId, true);

      expect(result.archived).toBe(true);
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(mockPrisma.contact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: { archived: true },
      });
    });

    it("should unarchive a contact when archive is false", async () => {
      const contactId = 1;
      const existingContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Co",
        tags: [],
        archived: true,
        createdAt: new Date(),
      };
      const mockUnarchivedContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Co",
        tags: [],
        archived: false,
        createdAt: new Date(),
      };

      // Mock both findUnique and update calls
      (mockPrisma.contact.findUnique as jest.Mock).mockResolvedValue(
        existingContact
      );
      (mockPrisma.contact.update as jest.Mock).mockResolvedValue(
        mockUnarchivedContact
      );

      const result = await ContactService.setArchived(contactId, false);

      expect(result.archived).toBe(false);
      expect(mockPrisma.contact.findUnique).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(mockPrisma.contact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: { archived: false },
      });
    });

    it("should throw error for invalid contact ID", async () => {
      await expect(ContactService.setArchived(-1, true)).rejects.toThrow(
        "Invalid contact ID"
      );
    });
  });

  // --- Test Suite for search (NEW) ---
  describe("search", () => {
    it("should search contacts by query across multiple fields (non-archived)", async () => {
      const mockSearchResults = [
        {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          email: "john@example.com",
          company: "Smith Corp",
          tags: [],
          archived: false,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockSearchResults
      );

      const results = await ContactService.search("john", false);

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe("John");
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { archived: false },
            {
              OR: [
                { firstName: { contains: "john", mode: "insensitive" } },
                { lastName: { contains: "john", mode: "insensitive" } },
                { email: { contains: "john", mode: "insensitive" } },
                { company: { contains: "john", mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should search including archived contacts when includeArchived is true", async () => {
      const mockSearchResults = [
        {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          email: "john@example.com",
          company: "Smith Corp",
          tags: [],
          archived: true,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockSearchResults
      );

      const results = await ContactService.search("john", true);

      expect(results).toHaveLength(1);
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {},
            {
              OR: [
                { firstName: { contains: "john", mode: "insensitive" } },
                { lastName: { contains: "john", mode: "insensitive" } },
                { email: { contains: "john", mode: "insensitive" } },
                { company: { contains: "john", mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return all contacts when search query is empty", async () => {
      const mockAllContacts = [
        {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          email: "john@example.com",
          company: "Smith Corp",
          tags: [],
          archived: false,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockAllContacts
      );

      const results = await ContactService.search("", false);

      expect(results).toHaveLength(1);
      // Should call getAll method which calls findMany with different params
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: { archived: false },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when no matches found", async () => {
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([]);

      const results = await ContactService.search("nonexistent", false);

      expect(results).toHaveLength(0);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  // --- Test Suite for getByTag (NEW) ---
  describe("getByTag", () => {
    it("should fetch contacts with specific tag (non-archived)", async () => {
      const mockTaggedContacts = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          company: "Example Corp",
          tags: ["lead", "customer"],
          archived: false,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockTaggedContacts
      );

      const results = await ContactService.getByTag("lead", false);

      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain("lead");
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { archived: false },
            {
              tags: { has: "lead" },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should include archived contacts when includeArchived is true", async () => {
      const mockTaggedContacts = [
        {
          id: 1,
          firstName: "Archived",
          lastName: "User",
          email: "archived@example.com",
          company: "Old Corp",
          tags: ["lead"],
          archived: true,
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockTaggedContacts
      );

      const results = await ContactService.getByTag("lead", true);

      expect(results).toHaveLength(1);
      expect(results[0].archived).toBe(true);
      expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {},
            {
              tags: { has: "lead" },
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should throw error for empty tag", async () => {
      await expect(ContactService.getByTag("")).rejects.toThrow(
        "Tag cannot be empty."
      );
    });

    it("should return empty array when no contacts have the tag", async () => {
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue([]);

      const results = await ContactService.getByTag("nonexistent-tag", false);

      expect(results).toHaveLength(0);
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
