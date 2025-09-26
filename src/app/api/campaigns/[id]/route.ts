import { NextResponse } from "next/server";
import { CampaignService } from "@/services/campaignService";

// Define the RouteContext interface for dynamic routes
interface RouteContext {
  params: { id: string };
}

/**
 * GET handler for fetching a single campaign by ID.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    // Parse id from params.
    const id = parseInt(params.id);

    // Validate ID is a valid number
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Campaign ID must be a valid positive number" },
        { status: 400 }
      );
    }

    // Call CampaignService.getById().
    const campaign = await CampaignService.getById(id);

    // Handle not found (return 404)
    if (!campaign) {
      return NextResponse.json(
        { error: `Campaign with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Add statistics to the campaign response
    const campaignWithStats = {
      ...campaign,
      _stats: {
        recipientCount: campaign.recipients.length,
        scheduledCount: campaign.recipients.filter(
          (r) => r.status === "Scheduled"
        ).length,
        sentCount: campaign.recipients.filter((r) => r.status === "Sent")
          .length,
        failedCount: campaign.recipients.filter((r) => r.status === "Failed")
          .length,
        openedCount: campaign.recipients.filter((r) => r.status === "Opened")
          .length,
        clickedCount: campaign.recipients.filter((r) => r.status === "Clicked")
          .length,
        bouncedCount: campaign.recipients.filter((r) => r.status === "Bounced")
          .length,
      },
    };

    // Handle success (return 200)
    return NextResponse.json(campaignWithStats, { status: 200 });
  } catch (error) {
    console.error("Error fetching campaign:", error);

    // Handle error (return 500)
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a campaign by ID.
 */
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    // Parse id from params and data from request.json().
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, status, templateId, contactIds } = body;

    // Validate ID is a valid number
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Campaign ID must be a valid positive number" },
        { status: 400 }
      );
    }

    // Validate that at least one field is provided for update
    if (!name && !status && !templateId && !contactIds) {
      return NextResponse.json(
        {
          error:
            "At least one field (name, status, templateId, contactIds) must be provided for update",
        },
        { status: 400 }
      );
    }

    // Validate individual fields if provided
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "Campaign name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (
      templateId !== undefined &&
      (typeof templateId !== "number" || templateId <= 0)
    ) {
      return NextResponse.json(
        { error: "Template ID must be a valid positive number" },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      (typeof status !== "string" || status.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "Status must be a non-empty string" },
        { status: 400 }
      );
    }

    if (
      contactIds !== undefined &&
      (!Array.isArray(contactIds) ||
        contactIds.some((id) => typeof id !== "number" || id <= 0))
    ) {
      return NextResponse.json(
        { error: "Contact IDs must be an array of valid positive numbers" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      status?: string;
      templateId?: number;
      contactIds?: number[];
    } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (status !== undefined) updateData.status = status.trim();
    if (templateId !== undefined) updateData.templateId = templateId;
    if (contactIds !== undefined) updateData.contactIds = contactIds;

    // Call CampaignService.update().
    const updatedCampaign = await CampaignService.update(id, updateData);

    // Handle success (return 200)
    return NextResponse.json(updatedCampaign, { status: 200 });
  } catch (error) {
    console.error("Error updating campaign:", error);

    if (error instanceof Error) {
      // Handle not found (return 404)
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      // Handle validation errors (return 400)
      if (
        error.message.includes("must be") ||
        error.message.includes("cannot be") ||
        error.message.includes("required")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Handle general error (return 500)
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a campaign by ID.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    // Parse id from params.
    const id = parseInt(params.id);

    // Validate ID is a valid number
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Campaign ID must be a valid positive number" },
        { status: 400 }
      );
    }

    // Call CampaignService.delete().
    const deletedCampaign = await CampaignService.delete(id);

    // Handle success (return 200)
    return NextResponse.json(
      {
        message: `Campaign "${deletedCampaign.name}" has been successfully deleted`,
        deletedCampaign,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);

    if (error instanceof Error) {
      // Handle not found (return 404)
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    // Handle general error (return 500)
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
