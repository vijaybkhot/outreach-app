"use client";
import { useState, useEffect } from "react";
import { Plus, Upload } from "lucide-react";
import { ContactsTable } from "./components/ContactsTable";
import { AddContactModal } from "./components/AddContactModal";
import { ImportCSVModal } from "./components/ImportCSVModal";
import { EditContactModal } from "./components/EditContactModal";
import { Contact } from "@prisma/client";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State for the edit modal
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditModalOpen(true);
  };

  const handleDeleteContact = async (contactId: number) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete contact");
        }
        // Refresh contacts after deletion
        fetchContacts();
      } catch (error) {
        console.error(error);
        alert("Error deleting contact.");
      }
    }
  };

  const handleArchiveContact = async (contactId: number, archived: boolean) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!response.ok) {
        throw new Error("Failed to update contact archive status");
      }
      // Refresh contacts after archive status change
      fetchContacts();
    } catch (error) {
      console.error(error);
      alert("Error updating contact archive status.");
    }
  };

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeArchived) {
        params.set("includeArchived", "true");
      }
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const url = `/api/contacts${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const performFetch = async () => {
        setIsLoading(true);
        try {
          const params = new URLSearchParams();
          if (includeArchived) {
            params.set("includeArchived", "true");
          }
          if (searchTerm.trim()) {
            params.set("search", searchTerm.trim());
          }

          const url = `/api/contacts${
            params.toString() ? `?${params.toString()}` : ""
          }`;
          const response = await fetch(url);
          const data = await response.json();
          setContacts(data);
        } catch (error) {
          console.error("Failed to fetch contacts:", error);
        } finally {
          setIsLoading(false);
        }
      };
      performFetch();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, includeArchived]);

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
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
    initialFetch();
  }, []);

  const handleContactAdded = () => {
    fetchContacts();
  };

  const handleImportSuccess = () => {
    fetchContacts();
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-10 md:flex-row md:items-center md:justify-between">
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
          <div className="flex items-center flex-shrink-0 gap-x-3">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-gray-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Include archived
              </span>
            </label>
          </div>
        </div>

        {/* The main content container with the "glassmorphism" effect */}
        <div className="overflow-hidden shadow-xl bg-white/70 backdrop-blur-lg rounded-2xl ring-1 ring-black ring-opacity-5">
          {isLoading ? (
            // IMPROVED LOADING STATE: A centered spinner for better UX
            <div className="flex items-center justify-center p-12">
              <svg
                className="w-8 h-8 mr-3 -ml-1 text-indigo-500 animate-spin"
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
            <ContactsTable
              contacts={contacts}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              onArchive={handleArchiveContact}
            />
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

        {selectedContact && (
          <EditContactModal
            isOpen={isEditModalOpen}
            onClose={() => setEditModalOpen(false)}
            contact={selectedContact}
            onContactUpdated={fetchContacts} // Re-fetch all data on update
          />
        )}
      </div>
    </div>
  );
}
