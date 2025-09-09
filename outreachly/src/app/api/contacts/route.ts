import { NextResponse } from "next/server";
import { ContactService } from "@/services/contactService";

// GET /api/contacts - Fetches all contacts
export async function GET() {
  try {
    const contacts = await ContactService.getAll();
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

    // The controller's job is to validate input
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
    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact." },
      { status: 500 }
    );
  }
}
