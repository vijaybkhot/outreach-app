"use client";
import React, { useState, useEffect } from "react";
import { UpdateCampaignFormData, CampaignWithDetails } from "@/types/campaign";
import { Template, Contact } from "@prisma/client";

// Local Modal component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) =>
  !isOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg p-6 min-w-[600px] max-w-[700px] max-h-[90vh] overflow-y-auto relative">
        <button
          className="absolute text-gray-500 top-2 right-2 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: CampaignWithDetails;
  onCampaignUpdated: () => void;
}

const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onCampaignUpdated,
}) => {
  const [form, setForm] = useState<UpdateCampaignFormData>({
    name: campaign?.name || "",
    templateId: campaign?.templateId || undefined,
    contactIds: campaign?.recipients?.map((r) => r.contactId) || [],
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when campaign changes
  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name,
        templateId: campaign.templateId,
        contactIds: campaign.recipients?.map((r) => r.contactId) || [],
      });
    }
  }, [campaign]);

  // Fetch templates and contacts for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch templates
        const templatesResponse = await fetch("/api/templates");
        if (!templatesResponse.ok) {
          throw new Error("Failed to fetch templates");
        }
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);

        // Fetch contacts
        const contactsResponse = await fetch("/api/contacts");
        if (!contactsResponse.ok) {
          throw new Error("Failed to fetch contacts");
        }
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load templates and contacts");
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update campaign");
      }

      // Success - close modal and refresh parent
      onCampaignUpdated();
    } catch (error) {
      console.error("Error updating campaign:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "templateId" ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  const handleContactToggle = (contactId: number) => {
    setForm((prev) => {
      const currentContactIds = prev.contactIds || [];
      const isSelected = currentContactIds.includes(contactId);

      return {
        ...prev,
        contactIds: isSelected
          ? currentContactIds.filter((id) => id !== contactId)
          : [...currentContactIds, contactId],
      };
    });
  };

  const getSelectedContacts = () => {
    const selectedIds = form.contactIds || [];
    return contacts.filter((contact) => selectedIds.includes(contact.id));
  };

  const getAvailableContacts = () => {
    const selectedIds = form.contactIds || [];
    return contacts.filter((contact) => !selectedIds.includes(contact.id));
  };

  if (!campaign) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold">Edit Campaign</h2>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Campaign Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="templateId"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Template
          </label>
          <select
            id="templateId"
            name="templateId"
            value={form.templateId || ""}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Management Section */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Campaign Recipients
          </label>

          {/* Selected Contacts */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Selected Contacts ({getSelectedContacts().length})
            </h4>
            <div className="min-h-[100px] max-h-[150px] overflow-y-auto border border-gray-300 rounded-md p-2">
              {getSelectedContacts().length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  No contacts selected
                </p>
              ) : (
                getSelectedContacts().map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 mb-1 bg-blue-50 border border-blue-200 rounded"
                  >
                    <span className="text-sm">
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleContactToggle(contact.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Contacts */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">
              Add Contacts ({getAvailableContacts().length} available)
            </h4>
            <div className="max-h-[150px] overflow-y-auto border border-gray-300 rounded-md p-2">
              {getAvailableContacts().length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  All contacts are already selected
                </p>
              ) : (
                getAvailableContacts().map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 mb-1 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                  >
                    <span className="text-sm">
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleContactToggle(contact.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Update Campaign"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCampaignModal;
