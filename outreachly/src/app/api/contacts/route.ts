import { NextResponse, NextRequest } from "next/server";
import { ContactService } from "@/services/contactService";

// GET /api/contacts - Fetches all contacts with optional search and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const includeArchived = searchParams.get("includeArchived") === "true";
    const tag = searchParams.get("tag");

    let contacts;

    if (search) {
      contacts = await ContactService.search(search, includeArchived);
    } else if (tag) {
      contacts = await ContactService.getByTag(tag, includeArchived);
    } else {
      contacts = await ContactService.getAll(includeArchived);
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts from the database." },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Adds a new contact
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Basic validation - more detailed validation happens in the service layer
    if (!data.email || !data.firstName) {
      return NextResponse.json(
        { error: "Email and First Name are required." },
        { status: 400 }
      );
    }

    const newContact = await ContactService.create(data);
    return NextResponse.json(newContact, { status: 201 });
  } catch (error: unknown) {
    // Handle specific errors passed up from the service layer
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      // Prisma's unique constraint violation
      return NextResponse.json(
        { error: "A contact with this email already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    if (error instanceof Error) {
      // Handle validation errors from service layer
      if (
        error.message.includes("Invalid email") ||
        error.message.includes("validation")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact." },
      { status: 500 }
    );
  }
}
