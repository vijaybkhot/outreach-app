// src/types/template.ts

export type Template = {
  id: number;
  name: string;
  subject: string;
  body: string;
  customPlaceholders: string[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Derived type for creating a template, omitting auto-generated fields
export type CreateTemplateData = Omit<
  Template,
  "id" | "createdAt" | "updatedAt" | "customPlaceholders"
> & {
  // Make customPlaceholders optional for creation since it will be auto-detected
  customPlaceholders?: string[];
};
// NOTE: I've also omitted 'updatedAt' and 'archived' from CreateTemplateData.
// 'updatedAt' is handled by Prisma.
// 'archived' defaults to false, so it's not strictly necessary for creation data unless you intend to override it.
