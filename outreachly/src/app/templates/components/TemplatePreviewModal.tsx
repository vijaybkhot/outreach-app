"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
import { X, Eye, Download, Send, RotateCcw } from "lucide-react";
import { Template } from "@prisma/client";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
}: TemplatePreviewModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [renderedTemplate, setRenderedTemplate] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Memoize variables to prevent infinite re-renders
  const uniqueVariables = useMemo(() => {
    const allVariables = [
      ...extractVariables(template.subject),
      ...extractVariables(template.body),
    ];
    return Array.from(new Set(allVariables));
  }, [template.subject, template.body]);

  // Initialize with sample values
  useEffect(() => {
    console.log("Initializing variables for template:", template.id);
    const sampleData: Record<string, string> = {
      firstName: "John",
      lastName: "Doe",
      company: "Acme Corp",
      email: "john@example.com",
      product: "Product Name",
      position: "Software Engineer",
      industry: "Technology",
      website: "acme.com",
    };

    // Create a fresh object for each template change
    const initialValues: Record<string, string> = {};
    uniqueVariables.forEach((variable) => {
      initialValues[variable] = sampleData[variable] || `[${variable}]`;
    });

    console.log("Setting initial variable values:", initialValues);
    // Clear any previous values and set new ones
    setVariableValues(initialValues);

    // Clear rendered template when template changes
    setRenderedTemplate(null);
    setError(null);
  }, [template.id, uniqueVariables]); // Added template.id to ensure proper re-initialization

  const handleRenderTemplate = useCallback(async () => {
    console.log("Starting template render...");
    setIsLoading(true);
    setError(null);
    try {
      // Log the variables being sent to ensure they're correct
      console.log("Rendering template with variables:", variableValues);
      console.log("Template ID:", template.id, "Type:", typeof template.id);

      const response = await fetch(`/api/templates/${template.id}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: variableValues }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response data:", errorData);
        const errorMessage = errorData.error || "Failed to render template";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Rendered template data:", data);
      setRenderedTemplate(data);
    } catch (error) {
      console.error("Error rendering template:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoading(false);
      console.log("Template render finished");
    }
  }, [template.id, variableValues]);

  const handleVariableChange = (variable: string, value: string) => {
    console.log(
      `Changing variable ${variable} from "${variableValues[variable]}" to: "${value}"`
    );
    setVariableValues((prev) => {
      const updated = {
        ...prev,
        [variable]: value,
      };
      console.log("Previous variable values:", prev);
      console.log("Updated variable values:", updated);
      return updated;
    });

    // Clear rendered template to force re-render
    // This helps ensure the UI updates properly
    setRenderedTemplate(null);
    setError(null);
  };

  const resetToSampleData = () => {
    const sampleData: Record<string, string> = {
      firstName: "John",
      lastName: "Doe",
      company: "Acme Corp",
      email: "john@example.com",
      product: "Product Name",
      position: "Software Engineer",
      industry: "Technology",
      website: "acme.com",
    };

    const resetValues: Record<string, string> = {};
    uniqueVariables.forEach((variable) => {
      resetValues[variable] = sampleData[variable] || `[${variable}]`;
    });
    setVariableValues(resetValues);
  };

  const handleSendTestEmail = async () => {
    if (!renderedTemplate) {
      alert("Please generate a preview first before sending a test email.");
      return;
    }

    if (!testEmail || !isValidEmail(testEmail)) {
      alert("⚠️ Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(`/api/templates/${template.id}/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail.trim(),
          renderedTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send test email");
      }

      const data = await response.json();
      alert(`✅ ${data.message}`);
    } catch (error) {
      console.error("Error sending test email:", error);
      alert(
        `❌ Error: ${
          error instanceof Error ? error.message : "Failed to send test email"
        }`
      );
    } finally {
      setIsSending(false);
    }
  };

  const downloadAsText = () => {
    if (!renderedTemplate) return;

    const content = `Subject: ${renderedTemplate.subject}\n\n${renderedTemplate.body}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_preview.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto-render when variables change
  useEffect(() => {
    // Skip rendering if we have no variables or no values
    if (
      uniqueVariables.length === 0 ||
      Object.keys(variableValues).length === 0
    ) {
      console.log("Skipping auto-render: no variables or values", {
        uniqueVariablesLength: uniqueVariables.length,
        variableValuesLength: Object.keys(variableValues).length,
      });
      return;
    }

    console.log("Auto-rendering after variable change...", variableValues);
    const timer = setTimeout(() => {
      handleRenderTemplate();
    }, 500);

    return () => clearTimeout(timer);
  }, [variableValues, handleRenderTemplate, uniqueVariables.length]); // Added uniqueVariables.length to dependency array

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
              <Dialog.Panel className="w-full max-w-6xl p-6 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl bg-white/80 ring-1 ring-black ring-opacity-5 backdrop-blur-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      Preview: {template.name}
                    </Dialog.Title>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderedTemplate && (
                      <>
                        <button
                          type="button"
                          onClick={downloadAsText}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Download size={16} />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={handleSendTestEmail}
                          disabled={
                            isSending ||
                            !renderedTemplate ||
                            !isValidEmail(testEmail)
                          }
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={16} />
                          {isSending ? "Sending..." : "Send Test Email"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="p-2 text-gray-400 rounded-lg hover:text-gray-600 hover:bg-gray-100"
                      onClick={onClose}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Variables Panel */}
                  {uniqueVariables.length > 0 && (
                    <div className="lg:col-span-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          Variables ({uniqueVariables.length})
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRenderTemplate()}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200"
                            title="Refresh preview"
                          >
                            <Eye size={12} />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={resetToSampleData}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                            title="Reset to sample data"
                          >
                            <RotateCcw size={12} />
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 overflow-y-auto max-h-96">
                        {uniqueVariables.map((variable) => (
                          <div key={variable}>
                            <label className="block mb-1 text-xs font-medium text-gray-700">
                              {variable}
                            </label>
                            <input
                              type="text"
                              value={variableValues[variable] || ""}
                              onChange={(e) => {
                                console.log(
                                  `Input onChange triggered for ${variable}:`,
                                  e.target.value
                                );
                                handleVariableChange(variable, e.target.value);
                              }}
                              onFocus={() =>
                                console.log(`Input focused: ${variable}`)
                              }
                              onBlur={() =>
                                console.log(`Input blurred: ${variable}`)
                              }
                              className="block w-full px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:border-green-500 focus:ring-green-500"
                              placeholder={`Enter ${variable}`}
                              data-testid={`variable-input-${variable}`}
                            />
                            <div className="mt-1 text-xs text-gray-500">
                              Current value: &quot;
                              {variableValues[variable] || ""}&quot;
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 mt-4 rounded-lg bg-yellow-50">
                        <p className="mb-2 text-xs text-yellow-800">
                          <strong>Tip:</strong> Edit the variables above to see
                          how your template will look with different data.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleRenderTemplate}
                            className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700"
                          >
                            Force Render
                          </button>
                          <button
                            onClick={() => {
                              console.log("Current state:", {
                                variableValues,
                                uniqueVariables,
                                renderedTemplate,
                                isLoading,
                                error,
                              });
                            }}
                            title="Log current component state to browser console for debugging"
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Debug State
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Email Input */}
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-medium text-gray-900">
                      Test Email
                    </h3>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter email address for test"
                      className={`w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:outline-none ${
                        testEmail && !isValidEmail(testEmail)
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : testEmail && isValidEmail(testEmail)
                          ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                          : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                      }`}
                    />
                    {testEmail && !isValidEmail(testEmail) && (
                      <p className="mt-1 text-xs text-red-600">
                        Please enter a valid email address
                      </p>
                    )}
                  </div>

                  {/* Preview Panel */}
                  <div
                    className={
                      uniqueVariables.length > 0
                        ? "lg:col-span-2"
                        : "lg:col-span-3"
                    }
                  >
                    <h3 className="mb-4 text-sm font-medium text-gray-900">
                      Email Preview
                    </h3>

                    {isLoading ? (
                      <div className="flex items-center justify-center rounded-lg h-96 bg-gray-50">
                        <div className="text-center">
                          <div className="w-8 h-8 mx-auto mb-2 border-b-2 border-green-600 rounded-full animate-spin"></div>
                          <p className="text-sm text-gray-600">
                            Rendering template...
                          </p>
                        </div>
                      </div>
                    ) : error ? (
                      <div className="flex items-center justify-center rounded-lg h-96 bg-red-50">
                        <div className="p-6 text-center">
                          <div className="mb-2 text-red-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="48"
                              height="48"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mx-auto"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-red-700">
                            Error rendering template
                          </p>
                          <p className="mt-2 text-sm text-red-600">{error}</p>
                          <button
                            onClick={() => {
                              setError(null);
                              handleRenderTemplate();
                            }}
                            className="mt-4 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    ) : renderedTemplate ? (
                      <div className="space-y-4">
                        {/* Subject */}
                        <div>
                          <label className="block mb-2 text-xs font-medium text-gray-700">
                            Subject Line
                          </label>
                          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                            <p className="text-sm font-medium text-blue-900">
                              {renderedTemplate.subject}
                            </p>
                          </div>
                        </div>

                        {/* Body */}
                        <div>
                          <label className="block mb-2 text-xs font-medium text-gray-700">
                            Email Body
                          </label>
                          <div className="p-4 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm min-h-96 max-h-96">
                            <div className="prose-sm prose max-w-none">
                              <pre className="font-sans text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                                {renderedTemplate.body}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg h-96 bg-gray-50">
                        <div className="text-center">
                          <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="mb-4 text-sm text-gray-600">
                            {uniqueVariables.length > 0
                              ? "Fill in the variables to see the preview"
                              : "Template preview will appear here"}
                          </p>
                          <button
                            onClick={handleRenderTemplate}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Eye size={16} />
                            Generate Preview
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
