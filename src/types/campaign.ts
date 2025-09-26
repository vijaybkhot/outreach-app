// src/types/campaign.ts
import { Campaign, Template, CampaignRecipient } from "@prisma/client";

// Extended Campaign type including its Template and array of CampaignRecipients
export interface CampaignWithDetails extends Campaign {
  template: Template;
  recipients: CampaignRecipient[];
}

// Type for frontend form data when creating a campaign
export interface CreateCampaignFormData {
  name: string;
  templateId: number;
  contactIds: number[];
}

// Type for frontend form data when updating a campaign
export interface UpdateCampaignFormData {
  name?: string;
  templateId?: number;
  contactIds?: number[];
}
