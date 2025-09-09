"use client";
import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

type Contact = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  company: string | null;
  tags: string[];
};
interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: number) => void;
}

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = contacts.filter((contact) => {
    const search = searchTerm.toLowerCase();
    return (
      contact.firstName.toLowerCase().includes(search) ||
      (contact.lastName ?? "").toLowerCase().includes(search) ||
      contact.email.toLowerCase().includes(search) ||
      (contact.company ?? "").toLowerCase().includes(search) ||
      contact.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  return (
    <div>
      <div className="p-4 sm:p-6">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full py-2 pl-4 pr-10 rounded-md border-slate-300/70 bg-white/50 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-300/20">
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
            <tbody className="bg-transparent divide-y divide-slate-200/50">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="transition-colors duration-200 hover:bg-black/5"
                  >
                    <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap sm:pl-6">
                      <div className="font-medium text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-slate-500">{contact.email}</div>
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-slate-600">
                      {contact.company}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap">
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
                    <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                      <div className="flex justify-end gap-x-2">
                        <button
                          onClick={() => onEdit(contact)}
                          className="p-1 transition-colors rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(contact.id)}
                          className="p-1 transition-colors rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-200/50"
                        >
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
