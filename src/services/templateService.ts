import { CreateTemplateData } from "@/types/template";
import { Template, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class TemplateService {
  /**
   * Helper function to extract placeholder names from template text.
   * This function parses a string (email subject or body) and returns an array
   * of unique placeholder names found (e.g., ["contact.firstName", "product.name"]).
   * It supports dot notation for complex placeholders and differentiate between
   * known DB placeholders (contact., campaign., my.) and custom ones.
   * @param text - The text to parse for placeholders
   * @returns Array of unique placeholder names
   */
  static extractPlaceholderNames(text: string): string[] {
    const placeholders = new Set<string>();
    const regex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      placeholders.add(match[1]);
    }

    // Filter out known database-driven placeholders if desired, or keep all
    // For this feature, we want to store *all* detected placeholders for the template
    // and let the frontend/sending logic decide which are custom and which are DB-driven.
    return Array.from(placeholders);
  }

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
      // Add this line BEFORE prisma.template.create:
      const detectedPlaceholders = this.extractPlaceholderNames(
        data.subject + " " + data.body
      );

      const newTemplate = await prisma.template.create({
        data: {
          name: data.name.trim(),
          subject: data.subject.trim(),
          body: data.body.trim(),
          archived: data.archived ?? false,
          customPlaceholders: detectedPlaceholders,
        } as Prisma.TemplateCreateInput,
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
   * @param includeArchived - Whether to include archived templates
   * @returns A promise that resolves to an array of templates.
   */
  static async getAll(includeArchived: boolean = false): Promise<Template[]> {
    try {
      return await prisma.template.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: includeArchived ? {} : { archived: false },
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
      const updateData: {
        name?: string;
        subject?: string;
        body?: string;
        archived?: boolean;
        customPlaceholders?: string[];
      } = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.subject !== undefined) updateData.subject = data.subject.trim();
      if (data.body !== undefined) updateData.body = data.body.trim();
      if (data.archived !== undefined) updateData.archived = data.archived;

      // If subject or body are being updated, re-detect placeholders
      if (data.subject !== undefined || data.body !== undefined) {
        const currentSubject =
          data.subject !== undefined ? data.subject : existingTemplate.subject;
        const currentBody =
          data.body !== undefined ? data.body : existingTemplate.body;
        updateData.customPlaceholders = this.extractPlaceholderNames(
          currentSubject + " " + currentBody
        ); // <-- NEW
      }

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

  /**
   * Searches templates by name, subject, or body content.
   * @param query - The search query.
   * @param includeArchived - Whether to include archived templates.
   * @returns A promise that resolves to an array of matching templates.
   */
  static async search(
    query: string,
    includeArchived: boolean = false
  ): Promise<Template[]> {
    if (!query || query.trim() === "") {
      return this.getAll(includeArchived);
    }

    const searchTerm = query.trim();

    try {
      return await prisma.template.findMany({
        where: {
          AND: [
            includeArchived ? {} : { archived: false },
            {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { subject: { contains: searchTerm, mode: "insensitive" } },
                { body: { contains: searchTerm, mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (error: unknown) {
      console.error("Error searching templates:", error);
      throw new Error("Failed to search templates.");
    }
  }

  /**
   * Duplicates a template with a new name.
   * @param id - The template ID to duplicate.
   * @param newName - The name for the duplicated template.
   * @returns A promise that resolves to the newly created template.
   */
  static async duplicate(id: number, newName: string): Promise<Template> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid template ID.");
    }

    if (!newName || newName.trim() === "") {
      throw new Error("New template name cannot be empty.");
    }

    try {
      const originalTemplate = await prisma.template.findUnique({
        where: { id },
      });

      if (!originalTemplate) {
        throw new Error("Template not found.");
      }

      // Create a copy with the new name
      return await this.create({
        name: newName.trim(),
        subject: originalTemplate.subject,
        body: originalTemplate.body,
        archived: false, // New template should not be archived
        // customPlaceholders will be auto-detected by the create method
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      console.error("Error duplicating template:", error);
      throw new Error("Failed to duplicate template.");
    }
  }

  /**
   * Renders a template with contact data (variable substitution).
   * @param templateId - The template ID.
   * @param variables - Object containing variable substitutions.
   * @returns A promise that resolves to the rendered template.
   */
  static async render(
    templateId: number,
    variables: Record<string, string>
  ): Promise<{ subject: string; body: string }> {
    if (!Number.isInteger(templateId) || templateId <= 0) {
      throw new Error("Invalid template ID.");
    }

    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error("Template not found.");
      }

      // Simple variable substitution ({{variableName}})
      let renderedSubject = template.subject;
      let renderedBody = template.body;

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        renderedSubject = renderedSubject.replace(
          new RegExp(placeholder, "g"),
          value || ""
        );
        renderedBody = renderedBody.replace(
          new RegExp(placeholder, "g"),
          value || ""
        );
      });

      return {
        subject: renderedSubject,
        body: renderedBody,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }

      console.error("Error rendering template:", error);
      throw new Error("Failed to render template.");
    }
  }

  /**
   * Gets templates usage statistics.
   * @param templateId - Optional template ID to get stats for a specific template.
   * @returns A promise that resolves to usage statistics.
   */
  static async getUsageStats(templateId?: number): Promise<
    Array<{
      templateId: number;
      templateName: string;
      campaignCount: number;
      lastUsed: Date | null;
    }>
  > {
    try {
      const whereClause = templateId ? { id: templateId } : {};

      const templates = await prisma.template.findMany({
        where: whereClause,
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

      return templates.map((template) => ({
        templateId: template.id,
        templateName: template.name,
        campaignCount: template.campaigns.length,
        lastUsed: template.campaigns[0]?.createdAt || null,
      }));
    } catch (error: unknown) {
      console.error("Error fetching template usage stats:", error);
      throw new Error("Failed to fetch template usage statistics.");
    }
  }

  /**
   * Validates template variables in subject and body.
   * @param subject - The template subject.
   * @param body - The template body.
   * @returns Array of variable names found in the template.
   */
  static extractVariables(subject: string, body: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();

    // Extract from subject
    let match;
    while ((match = variableRegex.exec(subject)) !== null) {
      variables.add(match[1]);
    }

    // Extract from body
    variableRegex.lastIndex = 0; // Reset regex
    while ((match = variableRegex.exec(body)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}

// Create and export a singleton instance
export const templateService = new TemplateService();
