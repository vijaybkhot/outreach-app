"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { CampaignWithDetails } from "@/types/campaign";
import CampaignsTable from "./components/CampaignsTable";
import CreateCampaignModal from "./components/CreateCampaignModal";
import EditCampaignModal from "./components/EditCampaignModal";
import DeleteCampaignModal from "./components/DeleteCampaignModal";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignWithDetails | null>(null);

  // Fetch campaigns data
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/campaigns");
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleEditCampaign = (campaign: CampaignWithDetails) => {
    setSelectedCampaign(campaign);
    setEditModalOpen(true);
  };

  const handleDeleteCampaign = (campaign: CampaignWithDetails) => {
    setSelectedCampaign(campaign);
    setDeleteModalOpen(true);
  };

  const handleSendCampaign = async (campaignId: number) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to send campaign");
      }

      // Refresh campaigns to update status
      fetchCampaigns();
      alert("Campaign sent successfully!");
    } catch (error) {
      console.error("Error sending campaign:", error);
      alert("Failed to send campaign. Please try again.");
    }
  };

  const handleDuplicateCampaign = async (campaign: CampaignWithDetails) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate campaign");
      }

      // Refresh campaigns to show the new duplicate
      fetchCampaigns();
      alert("Campaign duplicated successfully!");
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      alert("Failed to duplicate campaign. Please try again.");
    }
  };

  const handleCampaignCreated = () => {
    fetchCampaigns(); // Refresh the campaigns list
    setCreateModalOpen(false);
  };

  const handleCampaignUpdated = () => {
    fetchCampaigns(); // Refresh the campaigns list
    setEditModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleCampaignDeleted = () => {
    fetchCampaigns(); // Refresh the campaigns list
    setDeleteModalOpen(false);
    setSelectedCampaign(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Create Campaign
        </button>
      </div>

      <CampaignsTable
        campaigns={campaigns}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
        onSend={handleSendCampaign}
        onDuplicate={handleDuplicateCampaign}
      />

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
      />

      {/* Edit Campaign Modal */}
      {selectedCampaign && (
        <EditCampaignModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
          onCampaignUpdated={handleCampaignUpdated}
        />
      )}

      {/* Delete Campaign Modal */}
      {selectedCampaign && (
        <DeleteCampaignModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaignId={selectedCampaign.id}
          campaignName={selectedCampaign.name}
          onCampaignDeleted={handleCampaignDeleted}
        />
      )}
    </div>
  );
}
