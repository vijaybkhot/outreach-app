"use client";

import { useState, FormEvent, Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { X, Copy } from "lucide-react";
import { Template } from "@prisma/client";

interface DuplicateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onTemplateDuplicated: () => void;
}

export function DuplicateTemplateModal({
  isOpen,
  onClose,
  template,
  onTemplateDuplicated,
}: DuplicateTemplateModalProps) {
  const [name, setName] = useState(`${template.name} (Copy)`);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a name for the duplicated template.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to duplicate template");
      }

      onTemplateDuplicated();
      onClose();
      setName(`${template.name} (Copy)`); // Reset for next time
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error duplicating template: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  const allVariables = [
    ...extractVariables(template.subject),
    ...extractVariables(template.body),
  ];
  const uniqueVariables = Array.from(new Set(allVariables));

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
              <Dialog.Panel className="w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl bg-white/80 ring-1 ring-black ring-opacity-5 backdrop-blur-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Copy className="w-5 h-5 text-blue-600" />
                    </div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      Duplicate Template
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Template Preview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Template to Duplicate
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Original Name
                      </p>
                      <p className="text-sm text-gray-900">{template.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Subject
                      </p>
                      <p className="text-sm text-gray-900">
                        {template.subject}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Body Preview
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.body.length > 150
                          ? `${template.body.substring(0, 150)}...`
                          : template.body}
                      </p>
                    </div>
                    {uniqueVariables.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Variables ({uniqueVariables.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {uniqueVariables.map((variable) => (
                            <span
                              key={variable}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      New Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Template Name (Copy)"
                      maxLength={100}
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {name.length}/100 characters
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      What will be duplicated?
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Email subject line</li>
                      <li>• Email body content</li>
                      <li>• All variables and formatting</li>
                      <li>• Template structure</li>
                    </ul>
                    <p className="text-xs text-blue-700 mt-2">
                      The duplicated template will be independent and can be
                      modified without affecting the original.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !name.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Duplicating..." : "Duplicate Template"}
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
