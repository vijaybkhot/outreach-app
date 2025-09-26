import { NextResponse } from "next/server";
import { CampaignService } from "@/services/campaignService";

/**
 * POST handler for creating a new campaign.
 */
export async function POST(request: Request) {
  try {
    // Parse request.json() to get campaign data (name, templateId, contactIds).
    const body = await request.json();
    const { name, templateId, contactIds, status } = body;

    // Validate required fields
    if (!name || !templateId || !contactIds) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, templateId, and contactIds are required",
        },
        { status: 400 }
      );
    }

    // Validate name is not empty
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Campaign name must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate templateId is a number
    if (typeof templateId !== "number" || templateId <= 0) {
      return NextResponse.json(
        { error: "Template ID must be a valid positive number" },
        { status: 400 }
      );
    }

    // Validate contactIds is an array
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: "Contact IDs must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate all contactIds are numbers
    if (!contactIds.every((id) => typeof id === "number" && id > 0)) {
      return NextResponse.json(
        { error: "All contact IDs must be valid positive numbers" },
        { status: 400 }
      );
    }

    // Call CampaignService.create().
    const campaignData = {
      name: name.trim(),
      templateId,
      contactIds,
      status: status || "Draft",
    };

    const newCampaign = await CampaignService.create(campaignData);

    // Handle success (return 201 and new campaign)
    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      // Check for specific business logic errors
      if (
        error.message.includes("not found") ||
        error.message.includes("Template with ID") ||
        error.message.includes("Contacts not found")
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      // Check for validation errors
      if (
        error.message.includes("required") ||
        error.message.includes("cannot be empty") ||
        error.message.includes("must be")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Handle general errors (return 500)
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for fetching all campaigns.
 */
export async function GET(request: Request) {
  try {
    // Parse URL search params for any filters (e.g., status).
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    // Call CampaignService.getAll().
    const campaigns = await CampaignService.getAll();

    // Apply status filter if provided
    let filteredCampaigns = campaigns;
    if (statusFilter) {
      filteredCampaigns = campaigns.filter(
        (campaign) =>
          campaign.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Add summary statistics to each campaign
    const campaignsWithStats = filteredCampaigns.map((campaign) => ({
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
    }));

    // Handle success (return 200 and array of campaigns)
    return NextResponse.json(campaignsWithStats, { status: 200 });
  } catch (error) {
    console.error("Error fetching campaigns:", error);

    // Handle errors (return 500)
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}
