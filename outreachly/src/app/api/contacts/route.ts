// src/app/api/contacts/route.ts

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/contacts - Fetches all contacts from the database
export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        createdAt: "desc", // Show newest contacts first
      },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Adds a new contact to the database
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newContact = await prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
        tags: data.tags,
      },
    });
    return NextResponse.json(newContact, { status: 201 });
  } catch (error: unknown) {
    // Handle specific errors, like a duplicate email
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      // Prisma's unique constraint violation code
      return NextResponse.json(
        { error: "A contact with this email already exists." },
        { status: 409 }
      ); // 409 Conflict
    }
    console.error("Failed to create contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
