import { NextResponse, NextRequest } from "next/server";
import { TemplateService } from "@/services/templateService";

// GET /api/templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const includeArchived = searchParams.get("includeArchived") === "true";

    let templates;

    if (search) {
      templates = await TemplateService.search(search, includeArchived);
    } else {
      templates = await TemplateService.getAll(includeArchived);
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, body: templateBody } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: "Name, subject, and body are required" },
        { status: 400 }
      );
    }

    const template = await TemplateService.create({
      name,
      subject,
      body: templateBody,
      archived: false,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
