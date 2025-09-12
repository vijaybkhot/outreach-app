"use client";

import { useState, useEffect, FormEvent, Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { X, FileText, Eye, EyeOff } from "lucide-react";
import { Template } from "@prisma/client";

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onTemplateUpdated: () => void;
}

export function EditTemplateModal({
  isOpen,
  onClose,
  template,
  onTemplateUpdated,
}: EditTemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Update form when template changes
  useEffect(() => {
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !subject.trim() || !body.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    const templateData = {
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
    };

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      onTemplateUpdated();
      onClose();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error updating template: ${errorMessage}`);
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

  const renderPreview = (text: string): string => {
    // Replace variables with sample data for preview
    const sampleData: Record<string, string> = {
      firstName: "John",
      lastName: "Doe",
      company: "Acme Corp",
      email: "john@example.com",
      product: "Product Name",
    };

    let rendered = text;
    Object.entries(sampleData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, "g"), value);
    });
    return rendered;
  };

  const allVariables = [
    ...extractVariables(subject),
    ...extractVariables(body),
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
              <Dialog.Panel className="w-full max-w-4xl p-6 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl bg-white/80 ring-1 ring-black ring-opacity-5 backdrop-blur-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      Edit Template: {template.name}
                    </Dialog.Title>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      title={showPreview ? "Hide preview" : "Show preview"}
                    >
                      {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      onClick={onClose}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div
                  className={`grid gap-6 ${
                    showPreview ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {/* Form */}
                  <div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Template Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Welcome Email"
                          maxLength={100}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {name.length}/100 characters
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="subject"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Welcome to {{company}}, {{firstName}}!"
                          maxLength={255}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {subject.length}/255 characters
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="body"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email Body <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="body"
                          rows={12}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Hi {{firstName}},&#10;&#10;Welcome to {{company}}! We're excited to have you on board.&#10;&#10;Best regards,&#10;The Team"
                          maxLength={10000}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {body.length}/10,000 characters
                        </p>
                      </div>

                      {/* Variables */}
                      {uniqueVariables.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">
                            Detected Variables ({uniqueVariables.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {uniqueVariables.map((variable) => (
                              <span
                                key={variable}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {variable}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-blue-700 mt-2">
                            These variables will be replaced with actual contact
                            data when sending emails.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isLoading ||
                            !name.trim() ||
                            !subject.trim() ||
                            !body.trim()
                          }
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Preview */}
                  {showPreview && (
                    <div className="border-l border-gray-200 pl-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Preview
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject Line
                          </label>
                          <div className="p-3 bg-gray-50 rounded-md text-sm">
                            {subject ? (
                              renderPreview(subject)
                            ) : (
                              <span className="text-gray-400">
                                Subject preview will appear here
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Body
                          </label>
                          <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap min-h-[200px]">
                            {body ? (
                              renderPreview(body)
                            ) : (
                              <span className="text-gray-400">
                                Email body preview will appear here
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
