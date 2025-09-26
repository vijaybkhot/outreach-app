import { NextResponse, NextRequest } from "next/server";
import { TemplateService } from "@/services/templateService";

// POST /api/templates/[id]/render
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
    const { variables } = body;

    if (!variables || typeof variables !== "object") {
      return NextResponse.json(
        { error: "Variables object is required" },
        { status: 400 }
      );
    }

    const renderedTemplate = await TemplateService.render(
      templateId,
      variables
    );

    return NextResponse.json(renderedTemplate);
  } catch (error) {
    console.error("Error rendering template:", error);
    return NextResponse.json(
      { error: "Failed to render template" },
      { status: 500 }
    );
  }
}
