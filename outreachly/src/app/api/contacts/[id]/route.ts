import { NextResponse } from "next/server";
import { ContactService } from "@/services/contactService";

// DELETE /api/contacts/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);
    await ContactService.delete(contactId);
    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for a successful delete
  } catch (error) {
    console.error("Failed to delete contact:", error);
    // Handle cases where the contact is not found, etc.
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - For updating a contact
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);
    const data = await request.json();
    const updatedContact = await ContactService.update(contactId, data);
    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Failed to update contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
