"use client";
import { useState, useEffect, FormEvent, Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { X } from "lucide-react";
import { Contact } from "@prisma/client";

// Define the props for the modal
interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact; // The contact data to pre-fill the form
  onContactUpdated: () => void;
}

export function EditContactModal({
  isOpen,
  onClose,
  contact,
  onContactUpdated,
}: EditContactModalProps) {
  // Initialize state with the contact's current data
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email);
  const [company, setCompany] = useState(contact.company);
  const [tags, setTags] = useState(contact.tags.join(", ")); // Join tags array into a string for the input
  const [isLoading, setIsLoading] = useState(false);

  // This useEffect ensures the form updates if a different contact is selected
  // while the modal is already open (though unlikely in this UI, it's good practice).
  useEffect(() => {
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setEmail(contact.email);
    setCompany(contact.company);
    setTags(contact.tags.join(", "));
  }, [contact]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName || !email) {
      window.alert("First Name and Email are required fields.");
      return;
    }

    setIsLoading(true);

    const updatedData = {
      firstName,
      lastName,
      email,
      company,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update contact");
      }

      onContactUpdated(); // Signal parent to re-fetch and update the UI
      onClose(); // Close the modal
    } catch (error: unknown) {
      console.error(error);
      let message = "Error updating contact.";
      if (error instanceof Error) {
        message = `Error updating contact: ${error.message}`;
      }
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* The backdrop */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg p-6 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl bg-white/80 ring-1 ring-black ring-opacity-5 backdrop-blur-lg">
                <div className="flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold leading-6 text-slate-800"
                  >
                    Edit Contact
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="firstNameEdit"
                      className="block text-sm font-medium text-slate-700"
                    >
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="firstNameEdit"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full mt-1 rounded-md border-slate-300/70 bg-white/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastNameEdit"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastNameEdit"
                      value={lastName || ""}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full mt-1 rounded-md border-slate-300/70 bg-white/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="emailEdit"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Email*
                    </label>
                    <input
                      type="email"
                      id="emailEdit"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full mt-1 rounded-md border-slate-300/70 bg-white/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="companyEdit"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      id="companyEdit"
                      value={company || ""}
                      onChange={(e) => setCompany(e.target.value)}
                      className="block w-full mt-1 rounded-md border-slate-300/70 bg-white/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="tagsEdit"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      id="tagsEdit"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="block w-full mt-1 rounded-md border-slate-300/70 bg-white/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-300/50">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-md shadow-sm bg-slate-200/70 text-slate-800 hover:bg-slate-300/90"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
