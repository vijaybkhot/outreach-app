import { NextResponse, NextRequest } from "next/server";

// Placeholder for DELETE /api/templates/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // TODO: Implement template deletion logic
  // Example usage to avoid unused error:
  request;
  return new NextResponse(null, { status: 501 }); // Not Implemented
}
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // TODO: Implement template update logic
  // Example usage to avoid unused error:
  // request is intentionally unused
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
