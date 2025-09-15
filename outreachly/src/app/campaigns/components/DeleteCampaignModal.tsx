"use client";
import React, { useState } from "react";

// Local Modal component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) =>
  !isOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg p-6 min-w-[350px] relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );

interface DeleteCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  onCampaignDeleted: () => void;
}

const DeleteCampaignModal: React.FC<DeleteCampaignModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onCampaignDeleted,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete campaign");
      }
      setLoading(false);
      onCampaignDeleted();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Delete Campaign</h2>
      <p className="mb-4">
        Are you sure you want to delete{" "}
        <span className="font-semibold">&apos;{campaignName}&apos;</span>?
      </p>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex gap-2 mt-4">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Confirm Delete"}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default DeleteCampaignModal;
