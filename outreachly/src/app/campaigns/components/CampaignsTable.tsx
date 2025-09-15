"use client";
// app/campaigns/components/CampaignsTable.tsx
import React from "react";
import { CampaignWithDetails } from "@/types/campaign";

export interface CampaignsTableProps {
  campaigns: CampaignWithDetails[];
  onEdit: (campaign: CampaignWithDetails) => void;
  onDelete: (campaign: CampaignWithDetails) => void;
  onSend: (campaignId: number) => void;
  onDuplicate: (campaign: CampaignWithDetails) => void;
}

const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  onEdit,
  onDelete,
  onSend,
  onDuplicate,
}) => {
  return (
    <table className="min-w-full mt-4 border">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-4 py-2 text-left">Campaign Name</th>
          <th className="px-4 py-2 text-left">Template</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Created At</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map((c) => (
          <tr key={c.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-2 font-medium">{c.name}</td>
            <td className="px-4 py-2">{c.template?.name}</td>
            <td className="px-4 py-2">{c.status}</td>
            <td className="px-4 py-2">
              {new Date(c.createdAt).toLocaleString()}
            </td>
            <td className="flex gap-2 px-4 py-2">
              <button
                className="px-2 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                title="Edit"
                onClick={() => onEdit(c)}
              >
                ✏️
              </button>
              <button
                className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                title="Delete"
                onClick={() => onDelete(c)}
              >
                🗑️
              </button>
              <button
                className="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                title="Send"
                onClick={() => onSend(c.id)}
              >
                📤
              </button>
              <button
                className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
                title="Duplicate"
                onClick={() => onDuplicate(c)}
              >
                📄
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export { CampaignsTable };
export default CampaignsTable;
