"use client";
import React, { useState, useEffect } from "react";
import { CreateCampaignFormData } from "@/types/campaign";
import { Template, Contact } from "@prisma/client";

// Simple Modal component (replace with your own if needed)
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) =>
  !isOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg p-6 min-w-[350px] relative">
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

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
}) => {
  const [form, setForm] = useState<CreateCampaignFormData>({
    name: "",
    templateId: 0,
    contactIds: [],
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates and contacts on mount
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const fetchData = async () => {
      try {
        const [templatesRes, contactsRes] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/contacts"),
        ]);
        if (!templatesRes.ok || !contactsRes.ok)
          throw new Error("Failed to fetch data");
        setTemplates(await templatesRes.json());
        setContacts(await contactsRes.json());
      } catch {
        setError("Failed to load templates or contacts.");
      }
    };
    fetchData();
  }, [isOpen]);

  // Form handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "templateId" ? Number(value) : value,
    }));
  };

  const handleContactSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) =>
      Number(opt.value)
    );
    setForm((prev) => ({
      ...prev,
      contactIds: selected,
    }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!form.name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    if (!form.templateId) {
      setError("Template selection is required.");
      return;
    }
    if (!form.contactIds.length) {
      setError("At least one contact must be selected.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create campaign");
      }
      setLoading(false);
      onCampaignCreated();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="mb-4 text-xl font-bold">Create New Campaign</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Campaign Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-2 py-1 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Select Template</label>
          <select
            name="templateId"
            value={form.templateId}
            onChange={handleChange}
            className="w-full px-2 py-1 border rounded"
            required
          >
            <option value={0}>-- Select Template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Select Contacts</label>
          <select
            multiple
            value={form.contactIds.map(String)}
            onChange={handleContactSelect}
            className="w-full h-32 px-2 py-1 border rounded"
            required
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email})
              </option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCampaignModal;
