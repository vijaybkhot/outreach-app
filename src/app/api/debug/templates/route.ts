import { NextResponse } from "next/server";
import { TemplateService } from "@/services/templateService";

// GET /api/debug/templates
export async function GET() {
  try {
    const templates = await TemplateService.getAll();
    console.log("Available templates:", templates);

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
