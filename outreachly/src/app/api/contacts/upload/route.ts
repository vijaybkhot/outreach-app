import { NextResponse } from "next/server";
import { ContactService } from "@/services/contactService"; // Adjust the import path as needed

// POST /api/contacts/upload - Handles bulk import from CSV
export async function POST(request: Request) {
  try {
    const newContacts = await request.json();

    // 1. Validation (Controller's job)
    if (!Array.isArray(newContacts)) {
      return NextResponse.json(
        { error: "Invalid data format, expected an array." },
        { status: 400 }
      );
    }

    // 2. Call the Business Logic (Controller tells the Service what to do)
    const importedCount = await ContactService.importFromCSV(newContacts);

    // 3. Send the Response (Controller's job)
    return NextResponse.json(
      { message: `Successfully imported ${importedCount} new contacts.` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in contact upload route:", error);
    return NextResponse.json(
      { error: "Failed to import contacts due to a server error." },
      { status: 500 }
    );
  }
}
