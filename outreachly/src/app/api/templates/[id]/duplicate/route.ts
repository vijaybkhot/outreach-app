import { NextResponse, NextRequest } from "next/server";
import { TemplateService } from "@/services/templateService";

// POST /api/templates/[id]/duplicate
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required for the duplicated template" },
        { status: 400 }
      );
    }

    const duplicatedTemplate = await TemplateService.duplicate(
      templateId,
      name.trim()
    );

    return NextResponse.json(duplicatedTemplate, { status: 201 });
  } catch (error) {
    console.error("Error duplicating template:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
