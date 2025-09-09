"use client";
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

// Define the Contact type for component props
type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  tags: string[];
};

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  // The filter logic remains the same
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div>
      {" "}
      {/* Parent container, no extra padding needed here */}
      <div className="p-4 sm:p-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // Styling the search bar to fit the theme
          className="block w-full rounded-md border-slate-300/70 bg-white/50 py-2 pl-4 pr-10 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-300/20">
            {/* The table header is now transparent to let the parent background show */}
            <thead className="bg-transparent">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-800 sm:pl-6"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-slate-800"
                >
                  Company
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-slate-800"
                >
                  Tags
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            {/* The table body is also transparent, with a subtle divider color */}
            <tbody className="divide-y divide-slate-200/50 bg-transparent">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-black/5 transition-colors duration-200"
                  >
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="font-medium text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-slate-500">{contact.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                      {contact.company}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-indigo-100/70 px-2 py-0.5 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-600/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end gap-x-2">
                        <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors">
                          <Edit size={18} />
                        </button>
                        <button className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
