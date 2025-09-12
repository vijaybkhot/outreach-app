import { CreateTemplateData } from "@/types/template";
import { Template } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class TemplateService {
  /**
   * Creates a new template in the database.
   * @param data - The data for the new template.
   * @returns A promise that resolves to the newly created template.
   */
  static async create(data: CreateTemplateData): Promise<Template> {
    // Input Validation
    if (!data.name || data.name.trim() === "") {
      throw new Error("Template name cannot be empty.");
    }
    if (!data.subject || data.subject.trim() === "") {
      throw new Error("Template subject cannot be empty.");
    }
    if (!data.body || data.body.trim() === "") {
      throw new Error("Template body cannot be empty.");
    }

    // Additional validations
    if (data.name.length > 100) {
      throw new Error("Template name cannot exceed 100 characters.");
    }
    if (data.subject.length > 255) {
      throw new Error("Template subject cannot exceed 255 characters.");
    }
    if (data.body.length > 10000) {
      throw new Error("Template body cannot exceed 10,000 characters.");
    }

    try {
      const newTemplate = await prisma.template.create({
        data: {
          name: data.name.trim(),
          subject: data.subject.trim(),
          body: data.body.trim(),
        },
      });
      return newTemplate;
    } catch (error: unknown) {
      // Handle unique constraint violation
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002" &&
        "meta" in error &&
        (error as { meta?: { target?: string[] } }).meta?.target?.includes(
          "name"
        )
      ) {
        throw new Error(
          `A template with the name "${data.name}" already exists.`
        );
      }

      console.error("Error creating template:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : "Unknown error";
      throw new Error(`Failed to create template: ${errorMessage}`);
    }
  }

  /**
   * Fetches all templates from the database, ordered by creation date.
   * @returns A promise that resolves to an array of templates.
   */
  static async getAll(): Promise<Template[]> {
    try {
      return await prisma.template.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          // Exclude archived templates by default
          archived: false,
        },
      });
    } catch (error: unknown) {
      console.error("Error fetching templates:", error);
      throw new Error("Failed to fetch templates.");
    }
  }

  /**
   * Fetches a single template by ID.
   * @param id - The template ID.
   * @returns A promise that resolves to the template or null if not found.
   */
  static async getById(id: number): Promise<Template | null> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid template ID.");
    }

    try {
      return await prisma.template.findUnique({
        where: { id },
      });
    } catch (error: unknown) {
      console.error("Error fetching template:", error);
      throw new Error("Failed to fetch template.");
    }
  }

  /**
   * Deletes a template by ID.
   * @param id - The template ID to delete.
   * @returns A promise that resolves to the deleted template.
   */
  static async delete(id: number): Promise<Template> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid template ID.");
    }

    try {
      // Check if template exists first
      const existingTemplate = await prisma.template.findUnique({
        where: { id },
      });

      if (!existingTemplate) {
        throw new Error("Template not found.");
      }

      // Check if template is being used in campaigns
      const campaignsUsingTemplate = await prisma.campaign.count({
        where: { templateId: id },
      });

      if (campaignsUsingTemplate > 0) {
        throw new Error(
          "Cannot delete template that is being used in campaigns."
        );
      }

      return await prisma.template.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error; // Re-throw our custom errors
      }

      console.error("Error deleting template:", error);
      throw new Error("Failed to delete template.");
    }
  }

  /**
   * Updates a template by ID.
   * @param id - The template ID to update.
   * @param data - The data to update.
   * @returns A promise that resolves to the updated template.
   */
  static async update(
    id: number,
    data: Partial<CreateTemplateData>
  ): Promise<Template> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid template ID.");
    }

    // Validate update data
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === "") {
        throw new Error("Template name cannot be empty.");
      }
      if (data.name.length > 100) {
        throw new Error("Template name cannot exceed 100 characters.");
      }
    }

    if (data.subject !== undefined) {
      if (!data.subject || data.subject.trim() === "") {
        throw new Error("Template subject cannot be empty.");
      }
      if (data.subject.length > 255) {
        throw new Error("Template subject cannot exceed 255 characters.");
      }
    }

    if (data.body !== undefined) {
      if (!data.body || data.body.trim() === "") {
        throw new Error("Template body cannot be empty.");
      }
      if (data.body.length > 10000) {
        throw new Error("Template body cannot exceed 10,000 characters.");
      }
    }

    try {
      // Check if template exists
      const existingTemplate = await prisma.template.findUnique({
        where: { id },
      });

      if (!existingTemplate) {
        throw new Error("Template not found.");
      }

      // Prepare update data with trimmed values
      const updateData: Partial<CreateTemplateData> = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.subject !== undefined) updateData.subject = data.subject.trim();
      if (data.body !== undefined) updateData.body = data.body.trim();

      return await prisma.template.update({
        where: { id },
        data: updateData,
      });
    } catch (error: unknown) {
      // Handle unique constraint violation
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "P2002" &&
        "meta" in error &&
        (error as { meta?: { target?: string[] } }).meta?.target?.includes(
          "name"
        )
      ) {
        throw new Error(
          `A template with the name "${data.name}" already exists.`
        );
      }

      if (error instanceof Error) {
        throw error; // Re-throw our custom errors
      }

      console.error("Error updating template:", error);
      throw new Error("Failed to update template.");
    }
  }

  /**
   * Archives or unarchives a template.
   * @param id - The template ID.
   * @param archived - Whether to archive or unarchive.
   * @returns A promise that resolves to the updated template.
   */
  static async setArchived(id: number, archived: boolean): Promise<Template> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid template ID.");
    }

    try {
      const existingTemplate = await prisma.template.findUnique({
        where: { id },
      });

      if (!existingTemplate) {
        throw new Error("Template not found.");
      }

      return await prisma.template.update({
        where: { id },
        data: { archived },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      console.error("Error updating template archive status:", error);
      throw new Error("Failed to update template archive status.");
    }
  }
}
