import { NextResponse } from "next/server";

// Mock database from the other route file
const contacts = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    company: "Tech Corp",
    tags: ["Recruiter", "FAANG"],
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    company: "Innovate LLC",
    tags: ["Hiring Manager"],
  },
];

// POST /api/contacts/upload - Handles bulk import from CSV
export async function POST(request: Request) {
  try {
    const newContacts = await request.json();
    if (!Array.isArray(newContacts)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    let importedCount = 0;
    newContacts.forEach((contact) => {
      const newId = contacts.length + 1 + importedCount;
      contacts.push({ id: newId, ...contact });
      importedCount++;
    });

    return NextResponse.json(
      { message: `Successfully imported ${importedCount} contacts.` },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}
