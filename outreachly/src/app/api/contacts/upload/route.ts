import { NextResponse } from "next/server";
import { ContactService } from "@/services/contactService";

// POST /api/contacts/upload - Handles bulk import from CSV
export async function POST(request: Request) {
  try {
    const newContacts = await request.json();

    // Validation
    if (!Array.isArray(newContacts)) {
      return NextResponse.json(
        { error: "Invalid data format, expected an array." },
        { status: 400 }
      );
    }

    if (newContacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided for import." },
        { status: 400 }
      );
    }

    if (newContacts.length > 1000) {
      return NextResponse.json(
        { error: "Too many contacts. Maximum 1000 contacts per import." },
        { status: 400 }
      );
    }

    // Call the service layer for bulk import
    const importedCount = await ContactService.importFromCSV(newContacts);

    return NextResponse.json(
      {
        message: `Successfully imported ${importedCount} new contacts.`,
        importedCount,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error in contact upload route:", error);

    if (error instanceof Error) {
      // Handle validation errors from service layer
      if (
        error.message.includes("validation") ||
        error.message.includes("Invalid")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to import contacts due to a server error." },
      { status: 500 }
    );
  }
}
