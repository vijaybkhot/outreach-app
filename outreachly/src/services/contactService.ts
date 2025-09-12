import { prisma } from "@/lib/prisma";
import { Contact } from "@prisma/client";

// A type for the data we expect from the CSV parse
type CsvContactData = Omit<Contact, "id" | "tags"> & {
  tags?: string | string[];
};
type CreateContactData = Omit<Contact, "id" | "createdAt">;

export class ContactService {
  /**
   * Email validation regex - basic but covers most cases
   */
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validates email format
   */
  private static isValidEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email.trim());
  }

  /**
   * Validates and sanitizes contact data
   */
  private static validateContactData(
    data: CreateContactData | Partial<CreateContactData>
  ) {
    // Required field validations
    if (data.firstName !== undefined) {
      if (!data.firstName || data.firstName.trim() === "") {
        throw new Error("Contact first name cannot be empty.");
      }
      if (data.firstName.length > 50) {
        throw new Error("First name cannot exceed 50 characters.");
      }
    }

    if (data.email !== undefined) {
      if (!data.email || data.email.trim() === "") {
        throw new Error("Contact email cannot be empty.");
      }
      if (!this.isValidEmail(data.email)) {
        throw new Error("Please provide a valid email address.");
      }
      if (data.email.length > 255) {
        throw new Error("Email cannot exceed 255 characters.");
      }
    }

    // Optional field validations
    if (data.lastName && data.lastName.length > 50) {
      throw new Error("Last name cannot exceed 50 characters.");
    }

    if (data.company && data.company.length > 100) {
      throw new Error("Company name cannot exceed 100 characters.");
    }

    if (data.tags && Array.isArray(data.tags)) {
      if (data.tags.length > 10) {
        throw new Error("Cannot have more than 10 tags per contact.");
      }
      data.tags.forEach((tag) => {
        if (tag.length > 30) {
          throw new Error("Each tag cannot exceed 30 characters.");
        }
      });
    }
  }

  /**
   * Sanitizes contact data by trimming whitespace
   */
  private static sanitizeContactData(
    data: CreateContactData | Partial<CreateContactData>
  ) {
    return {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email?.trim().toLowerCase(), // Normalize email to lowercase
      company: data.company?.trim(),
      tags: data.tags?.map((tag) => tag.trim()).filter(Boolean),
    };
  }

  /**
   * Fetches all contacts from the database, ordered by creation date.
   * @param includeArchived - Whether to include archived contacts
   * @returns A promise that resolves to an array of contacts.
   */
  static async getAll(includeArchived: boolean = true): Promise<Contact[]> {
    try {
      return await prisma.contact.findMany({
        where: includeArchived ? {} : { archived: false },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: unknown) {
      console.error("Error fetching contacts:", error);
      throw new Error("Failed to fetch contacts.");
    }
  }

  /**
   * Fetches a single contact by ID.
   * @param id - The contact ID.
   * @returns A promise that resolves to the contact or null if not found.
   */
  static async getById(id: number): Promise<Contact | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid contact ID.");
    }

    try {
      return await prisma.contact.findUnique({
        where: { id },
      });
    } catch (error: unknown) {
      console.error("Error fetching contact:", error);
      throw new Error("Failed to fetch contact.");
    }
  }

  /**
   * Fetches contacts by email.
   * @param email - The email to search for.
   * @returns A promise that resolves to the contact or null if not found.
   */
  static async getByEmail(email: string): Promise<Contact | null> {
    if (!email || !this.isValidEmail(email)) {
      throw new Error("Invalid email address.");
    }

    try {
      return await prisma.contact.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    } catch (error: unknown) {
      console.error("Error fetching contact by email:", error);
      throw new Error("Failed to fetch contact.");
    }
  }

  /**
   * Creates a new contact in the database.
   * @param data - The data for the new contact.
   * @returns A promise that resolves to the newly created contact.
   */
  static async create(data: CreateContactData): Promise<Contact> {
    // Validate required fields for creation
    this.validateContactData(data);

    // Sanitize the data
    const sanitizedData = this.sanitizeContactData(data);

    try {
      // Check for existing contact with same email
      const existingContact = await prisma.contact.findUnique({
        where: { email: sanitizedData.email },
      });

      if (existingContact) {
        throw new Error(
          `A contact with email "${sanitizedData.email}" already exists.`
        );
      }

      return await prisma.contact.create({
        data: {
          firstName: sanitizedData.firstName!,
          lastName: sanitizedData.lastName || "",
          email: sanitizedData.email!,
          company: sanitizedData.company || "",
          tags: sanitizedData.tags || [],
        },
      });
    } catch (error: unknown) {
      // Handle Prisma unique constraint errors
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        throw new Error(
          `A contact with email "${sanitizedData.email}" already exists.`
        );
      }

      if (error instanceof Error) {
        throw error; // Re-throw our custom validation errors
      }

      console.error("Error creating contact:", error);
      throw new Error("Failed to create contact.");
    }
  }

  /**
   * Updates a contact by ID.
   * @param id - The contact ID to update.
   * @param data - The data to update.
   * @returns A promise that resolves to the updated contact.
   */
  static async update(
    id: number,
    data: Partial<CreateContactData>
  ): Promise<Contact> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid contact ID.");
    }

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided for update.");
    }

    // Validate the update data
    this.validateContactData(data);

    // Sanitize the data
    const sanitizedData = this.sanitizeContactData(data);

    try {
      // Check if contact exists
      const existingContact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!existingContact) {
        throw new Error("Contact not found.");
      }

      // If email is being updated, check for duplicates
      if (
        sanitizedData.email &&
        sanitizedData.email !== existingContact.email
      ) {
        const emailExists = await prisma.contact.findUnique({
          where: { email: sanitizedData.email },
        });

        if (emailExists) {
          throw new Error(
            `A contact with email "${sanitizedData.email}" already exists.`
          );
        }
      }

      return await prisma.contact.update({
        where: { id },
        data: sanitizedData,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error; // Re-throw our custom errors
      }

      console.error("Error updating contact:", error);
      throw new Error("Failed to update contact.");
    }
  }

  /**
   * Deletes a contact by ID.
   * @param id - The contact ID to delete.
   * @returns A promise that resolves to the deleted contact.
   */
  static async delete(id: number): Promise<Contact> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid contact ID.");
    }

    try {
      // Check if contact exists first
      const existingContact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!existingContact) {
        throw new Error("Contact not found.");
      }

      return await prisma.contact.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error; // Re-throw our custom errors
      }

      console.error("Error deleting contact:", error);
      throw new Error("Failed to delete contact.");
    }
  }

  /**
   * Archives or unarchives a contact.
   * @param id - The contact ID.
   * @param archived - Whether to archive or unarchive the contact.
   * @returns A promise that resolves to the updated contact.
   */
  static async setArchived(id: number, archived: boolean): Promise<Contact> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid contact ID.");
    }

    try {
      const existingContact = await prisma.contact.findUnique({
        where: { id },
      });

      if (!existingContact) {
        throw new Error("Contact not found.");
      }

      return await prisma.contact.update({
        where: { id },
        data: { archived },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      console.error("Error updating contact archive status:", error);
      throw new Error("Failed to update contact archive status.");
    }
  }

  /**
   * Searches contacts by name, email, or company.
   * @param query - The search query.
   * @param includeArchived - Whether to include archived contacts in search.
   * @returns A promise that resolves to an array of matching contacts.
   */
  static async search(
    query: string,
    includeArchived: boolean = true
  ): Promise<Contact[]> {
    if (!query || query.trim() === "") {
      return this.getAll(includeArchived);
    }

    const searchTerm = query.trim();

    try {
      return await prisma.contact.findMany({
        where: {
          AND: [
            includeArchived ? {} : { archived: false },
            {
              OR: [
                { firstName: { contains: searchTerm, mode: "insensitive" } },
                { lastName: { contains: searchTerm, mode: "insensitive" } },
                { email: { contains: searchTerm, mode: "insensitive" } },
                { company: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: unknown) {
      console.error("Error searching contacts:", error);
      throw new Error("Failed to search contacts.");
    }
  }

  /**
   * Gets contacts by tag.
   * @param tag - The tag to filter by.
   * @param includeArchived - Whether to include archived contacts.
   * @returns A promise that resolves to an array of contacts with the specified tag.
   */
  static async getByTag(
    tag: string,
    includeArchived: boolean = true
  ): Promise<Contact[]> {
    if (!tag || tag.trim() === "") {
      throw new Error("Tag cannot be empty.");
    }

    try {
      return await prisma.contact.findMany({
        where: {
          AND: [
            includeArchived ? {} : { archived: false },
            {
              tags: {
                has: tag.trim(),
              },
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: unknown) {
      console.error("Error fetching contacts by tag:", error);
      throw new Error("Failed to fetch contacts by tag.");
    }
  }

  /**
   * Imports a list of contacts from a parsed CSV file into the database.
   * @param contactData - An array of contact objects to be created.
   * @returns The number of contacts successfully created.
   */
  static async importFromCSV(contactData: CsvContactData[]): Promise<number> {
    if (!contactData || contactData.length === 0) {
      throw new Error("No contact data provided for import.");
    }

    if (contactData.length > 1000) {
      throw new Error("Cannot import more than 1000 contacts at once.");
    }

    // Validate and prepare the data
    const dataToCreate: CreateContactData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < contactData.length; i++) {
      const contact = contactData[i];
      try {
        // Basic validation
        if (!contact.firstName || !contact.email) {
          errors.push(
            `Row ${i + 1}: Missing required fields (firstName, email).`
          );
          continue;
        }

        if (!this.isValidEmail(contact.email)) {
          errors.push(`Row ${i + 1}: Invalid email format "${contact.email}".`);
          continue;
        }

        const sanitizedContact: CreateContactData = {
          firstName: contact.firstName.trim(),
          lastName: contact.lastName?.trim() || "",
          email: contact.email.trim().toLowerCase(),
          company: contact.company?.trim() || "",
          archived: false, // New contacts are not archived by default
          tags: Array.isArray(contact.tags)
            ? contact.tags.map((t) => t.trim()).filter(Boolean)
            : (contact.tags || "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        };

        // Additional validation
        this.validateContactData(sanitizedContact);
        dataToCreate.push(sanitizedContact);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    // If there are validation errors, report them
    if (errors.length > 0) {
      throw new Error(`Validation errors found:\n${errors.join("\n")}`);
    }

    try {
      const result = await prisma.contact.createMany({
        data: dataToCreate,
        skipDuplicates: true, // Skip contacts with duplicate emails
      });

      console.log(
        `Successfully created ${result.count} new contacts out of ${contactData.length} provided.`
      );

      if (result.count < contactData.length) {
        console.log(
          `${
            contactData.length - result.count
          } contacts were skipped due to duplicate emails.`
        );
      }

      return result.count;
    } catch (error) {
      console.error("Error during bulk import:", error);
      throw new Error("Database operation failed during CSV import.");
    }
  }
}
