"use client";
import { useState, useEffect } from "react";
import { Plus, Upload } from "lucide-react";
import { ContactsTable } from "./components/ContactsTable";
import { AddContactModal } from "./components/AddContactModal";
import { ImportCSVModal } from "./components/ImportCSVModal";

export type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  tags: string[];
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/contacts");
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleContactAdded = () => {
    fetchContacts();
  };

  const handleImportSuccess = () => {
    fetchContacts();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          {/* Increased bottom margin */}
          <div className="flex-auto">
            {/* REFINED HEADING: Darker text and tighter tracking for more impact */}
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Contacts
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Manage your professional network for outreach campaigns.
            </p>
          </div>
          <div className="flex items-center gap-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Upload
                className="-ml-0.5 mr-2 h-4 w-4 text-gray-500" // Slightly smaller icon
                aria-hidden="true"
              />
              <span>Import CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              // Primary button style: Solid, eye-catching color
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* The main content container with the "glassmorphism" effect */}
        <div className="bg-white/70 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden ring-1 ring-black ring-opacity-5">
          {isLoading ? (
            // IMPROVED LOADING STATE: A centered spinner for better UX
            <div className="flex items-center justify-center p-12">
              <svg
                className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-lg text-gray-600">Loading contacts...</span>
            </div>
          ) : (
            <ContactsTable contacts={contacts} />
          )}
        </div>

        <AddContactModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onContactAdded={handleContactAdded}
        />
        <ImportCSVModal
          isOpen={isImportModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      </div>
    </div>
  );
}
