import { NextResponse, NextRequest } from "next/server";
import { ContactService } from "@/services/contactService";

// GET /api/contacts/[id] - Get a specific contact by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const contactId = parseInt(id, 10);

    // Validate ID format
    if (isNaN(contactId) || contactId <= 0) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 }
      );
    }

    const contact = await ContactService.getById(contactId);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to fetch contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete a contact (soft delete by setting archived=true)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const contactId = parseInt(id, 10);

    // Validate ID format
    if (isNaN(contactId) || contactId <= 0) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 }
      );
    }

    const deletedContact = await ContactService.delete(contactId);
    return NextResponse.json(deletedContact);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    console.error("Failed to delete contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const contactId = parseInt(id, 10);

    // Validate ID format
    if (isNaN(contactId) || contactId <= 0) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Basic validation - detailed validation happens in service layer
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No data provided for update" },
        { status: 400 }
      );
    }

    const updatedContact = await ContactService.update(contactId, data);
    return NextResponse.json(updatedContact);
  } catch (error: unknown) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }

      if (
        error.message.includes("Invalid email") ||
        error.message.includes("validation")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Handle Prisma unique constraint violation (email already exists)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A contact with this email already exists." },
        { status: 409 }
      );
    }

    console.error("Failed to update contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// PATCH /api/contacts/[id] - Partially update a contact (archive/unarchive)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const contactId = parseInt(id, 10);

    // Validate ID format
    if (isNaN(contactId) || contactId <= 0) {
      return NextResponse.json(
        { error: "Invalid contact ID format" },
        { status: 400 }
      );
    }

    const { archived } = await request.json();

    // Validate archived field
    if (typeof archived !== "boolean") {
      return NextResponse.json(
        { error: "archived field must be a boolean" },
        { status: 400 }
      );
    }

    const updatedContact = await ContactService.setArchived(
      contactId,
      archived
    );
    return NextResponse.json(updatedContact);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    console.error("Failed to update contact archive status:", error);
    return NextResponse.json(
      { error: "Failed to update contact archive status" },
      { status: 500 }
    );
  }
}
