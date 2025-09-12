"use client";

import { useState, useEffect } from "react";
import { Template } from "@prisma/client";
import { TemplatesTable } from "./components/TemplatesTable";
import { AddTemplateModal } from "./components/AddTemplateModal";
import { EditTemplateModal } from "./components/EditTemplateModal";
import { DuplicateTemplateModal } from "./components/DuplicateTemplateModal";
import { TemplatePreviewModal } from "./components/TemplatePreviewModal";
import { Plus, FileText, Search } from "lucide-react";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);

  // Modal states
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDuplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [isPreviewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (includeArchived) {
        params.set("includeArchived", "true");
      }
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      const url = `/api/templates${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
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

          const url = `/api/templates${
            params.toString() ? `?${params.toString()}` : ""
          }`;
          const response = await fetch(url);
          const data = await response.json();
          setTemplates(data);
        } catch (error) {
          console.error("Failed to fetch templates:", error);
        } finally {
          setIsLoading(false);
        }
      };
      performFetch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, includeArchived]);

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/templates");
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initialFetch();
  }, []);

  const handleTemplateAdded = () => {
    fetchTemplates();
  };

  const handleTemplateUpdated = () => {
    fetchTemplates();
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditModalOpen(true);
  };

  const handleDuplicateTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setDuplicateModalOpen(true);
  };

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewModalOpen(true);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        const response = await fetch(`/api/templates/${templateId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete template");
        }
        fetchTemplates();
      } catch (error) {
        console.error(error);
        alert(
          error instanceof Error ? error.message : "Error deleting template."
        );
      }
    }
  };

  const handleArchiveTemplate = async (
    templateId: number,
    archived: boolean
  ) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!response.ok) {
        throw new Error("Failed to update template archive status");
      }
      fetchTemplates();
    } catch (error) {
      console.error(error);
      alert("Error updating template archive status.");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Templates</h1>
              <p className="text-slate-600">
                Create and manage your email templates
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              <Plus size={20} />
              Add Template
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates by name, subject, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
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

        {/* Templates Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {isLoading ? (
              "Loading templates..."
            ) : (
              <>
                Showing {templates.length} template
                {templates.length !== 1 ? "s" : ""}
                {searchTerm && ` matching "${searchTerm}"`}
              </>
            )}
          </p>
        </div>

        {/* Main Content */}
        <div className="overflow-hidden shadow-xl bg-white/70 backdrop-blur-lg rounded-2xl ring-1 ring-black ring-opacity-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? `No templates match your search "${searchTerm}"`
                  : "Get started by creating your first email template"}
              </p>
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                <Plus size={20} />
                Create Template
              </button>
            </div>
          ) : (
            <TemplatesTable
              templates={templates}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              onArchive={handleArchiveTemplate}
              onDuplicate={handleDuplicateTemplate}
              onPreview={handlePreviewTemplate}
            />
          )}
        </div>

        {/* Modals */}
        <AddTemplateModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onTemplateAdded={handleTemplateAdded}
        />

        {selectedTemplate && (
          <>
            <EditTemplateModal
              isOpen={isEditModalOpen}
              onClose={() => setEditModalOpen(false)}
              template={selectedTemplate}
              onTemplateUpdated={handleTemplateUpdated}
            />

            <DuplicateTemplateModal
              isOpen={isDuplicateModalOpen}
              onClose={() => setDuplicateModalOpen(false)}
              template={selectedTemplate}
              onTemplateDuplicated={handleTemplateAdded}
            />

            <TemplatePreviewModal
              isOpen={isPreviewModalOpen}
              onClose={() => setPreviewModalOpen(false)}
              template={selectedTemplate}
            />
          </>
        )}
      </div>
    </div>
  );
}
