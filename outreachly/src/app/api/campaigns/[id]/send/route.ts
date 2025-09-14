import { NextResponse } from "next/server";
import { CampaignService } from "@/services/campaignService";

// Define the RouteContext interface for dynamic routes
interface RouteContext {
  params: { id: string };
}

/**
 * POST handler for sending a campaign.
 * This endpoint will trigger the email sending process for all recipients of a campaign.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    // Parse campaignId from params.
    const campaignId = parseInt(params.id);

    // Add validation for id.
    if (isNaN(campaignId) || campaignId <= 0) {
      return NextResponse.json(
        { error: "Campaign ID must be a valid positive number" },
        { status: 400 }
      );
    }

    // Call a new method in CampaignService (e.g., CampaignService.sendCampaign(campaignId)).
    // This method in CampaignService should:
    //  - Fetch the campaign and its template.
    //  - Fetch all "Scheduled" or "Draft" recipients.
    //  - Iterate, personalize, and send email for each via EmailService.
    //  - Update recipient status (e.g., 'Sent', 'Failed').
    const result = await CampaignService.sendCampaign(campaignId);

    // Return a 200 OK or appropriate status with a message (e.g., "Campaign sending initiated").
    return NextResponse.json(
      {
        message: "Campaign sending completed successfully",
        details: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending campaign:", error);

    if (error instanceof Error) {
      // Handle errors (campaign not found, no recipients, SES errors).
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      if (error.message.includes("No scheduled recipients")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.message.includes("Template not found")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Handle validation errors
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
      { error: "Failed to send campaign" },
      { status: 500 }
    );
  }
}
