import { prisma } from "@/lib/prisma";
import { Contact } from "@/app/contacts/page";

// A type for the data we expect from the CSV parse
type CsvContactData = Omit<Contact, "id" | "tags"> & {
  tags?: string | string[];
};
type CreateContactData = Omit<Contact, "id" | "createdAt">;

export class ContactService {
  /**
   * Fetches all contacts from the database, ordered by creation date.
   * @returns A promise that resolves to an array of contacts.
   */
  static async getAll() {
    return prisma.contact.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Creates a new contact in the database.
   * @param data - The data for the new contact.
   * @returns A promise that resolves to the newly created contact.
   */
  static async create(data: CreateContactData) {
    return prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
        tags: data.tags,
      },
    });
  }
  static async delete(id: number) {
    return prisma.contact.delete({
      where: { id },
    });
  }
  static async update(id: number, data: Partial<CreateContactData>) {
    return prisma.contact.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }
  /**
   * Imports a list of contacts from a parsed CSV file into the database.
   * @param contactData - An array of contact objects to be created.
   * @returns The number of contacts successfully created.
   */
  static async importFromCSV(contactData: CsvContactData[]): Promise<number> {
    if (!contactData || contactData.length === 0) {
      return 0;
    }

    // Prepare the data for Prisma's createMany method
    const dataToCreate = contactData.map((contact) => ({
      firstName: contact.firstName,
      lastName: contact.lastName || "",
      email: contact.email,
      company: contact.company || "",
      // Ensure tags are always an array of strings
      tags: Array.isArray(contact.tags)
        ? contact.tags
        : (contact.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
    }));

    try {
      const result = await prisma.contact.createMany({
        data: dataToCreate,
        skipDuplicates: true, // This will skip any contacts with an email that already exists
      });

      console.log(`Successfully created ${result.count} new contacts.`);
      return result.count;
    } catch (error) {
      console.error("Error during bulk import:", error);
      throw new Error("Database operation failed during CSV import.");
    }
  }
}
