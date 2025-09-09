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
    it("should fetch all contacts from the database", async () => {
      const mockContacts = [
        {
          id: 1,
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          company: "Test Co",
          tags: [],
          createdAt: new Date(),
        },
      ];
      (mockPrisma.contact.findMany as jest.Mock).mockResolvedValue(
        mockContacts
      );

      const contacts = await ContactService.getAll();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].firstName).toBe("Test");
      expect(mockPrisma.contact.findMany).toHaveBeenCalledTimes(1);
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
        data: newContactData,
      });
    });
  });

  // --- Test Suite for update (NEW) ---
  describe("update", () => {
    it("should update an existing contact with new data", async () => {
      // Arrange: Define the data for the update
      const contactId = 1;
      const updateData = {
        company: "Updated Corp",
        tags: ["Recruiter", "Updated"],
      };
      const updatedContact = {
        id: contactId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Updated Corp",
        tags: ["Recruiter", "Updated"],
        createdAt: new Date(),
      };
      (mockPrisma.contact.update as jest.Mock).mockResolvedValue(
        updatedContact
      );

      // Act: Call the update service method
      const result = await ContactService.update(contactId, updateData);

      // Assert: Check if the correct data was returned and the DB was called correctly
      expect(result.company).toBe("Updated Corp");
      expect(mockPrisma.contact.update).toHaveBeenCalledWith({
        where: { id: contactId },
        data: updateData,
      });
      expect(mockPrisma.contact.update).toHaveBeenCalledTimes(1);
    });
  });

  // --- Test Suite for delete (NEW) ---
  describe("delete", () => {
    it("should delete a contact by its ID", async () => {
      // Arrange
      const contactId = 1;
      const deletedContact = {
        id: contactId,
        firstName: "Deleted",
        lastName: "User",
        email: "deleted@example.com",
        company: "",
        tags: [],
        createdAt: new Date(),
      };
      (mockPrisma.contact.delete as jest.Mock).mockResolvedValue(
        deletedContact
      );

      // Act
      await ContactService.delete(contactId);

      // Assert
      expect(mockPrisma.contact.delete).toHaveBeenCalledWith({
        where: { id: contactId },
      });
      expect(mockPrisma.contact.delete).toHaveBeenCalledTimes(1);
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
          tags: ["Lead"],
        },
        {
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@example.com",
          company: "Tech Corp",
          tags: [],
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

    it("should return 0 when given an empty array and not call the database", async () => {
      // Arrange
      const csvData: {
        firstName: string;
        lastName: string | null;
        email: string;
        company: string | null;
        tags: string[];
      }[] = [];

      // Act
      const result = await ContactService.importFromCSV(csvData);

      // Assert
      expect(result).toBe(0);
      expect(mockPrisma.contact.createMany).not.toHaveBeenCalled();
    });

    it("should throw an error if the database operation fails", async () => {
      // Arrange
      const csvData = [
        {
          firstName: "Fail",
          lastName: "User",
          email: "fail@example.com",
          company: "Error Inc",
          tags: [],
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
});
