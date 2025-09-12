"use client";

import {
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
  Calendar,
} from "lucide-react";
import { Template } from "@prisma/client";

interface TemplatesTableProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDelete: (templateId: number) => void;
  onArchive: (templateId: number, archived: boolean) => void;
  onDuplicate: (template: Template) => void;
  onPreview: (template: Template) => void;
}

export function TemplatesTable({
  templates,
  onEdit,
  onDelete,
  onArchive,
  onDuplicate,
  onPreview,
}: TemplatesTableProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const getTemplateVariables = (template: Template): string[] => {
    const subjectVars = extractVariables(template.subject);
    const bodyVars = extractVariables(template.body);
    return Array.from(new Set([...subjectVars, ...bodyVars]));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-300/20">
            <thead className="bg-transparent">
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-800 sm:pl-6"
                >
                  Template
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-slate-800"
                >
                  Subject
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-slate-800"
                >
                  Variables
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-slate-800"
                >
                  Created
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-slate-800"
                >
                  Status
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-slate-200/50">
              {templates.length > 0 ? (
                templates.map((template) => {
                  const variables = getTemplateVariables(template);
                  return (
                    <tr
                      key={template.id}
                      className={`transition-colors duration-200 hover:bg-black/5 ${
                        template.archived ? "opacity-60" : ""
                      }`}
                    >
                      <td className="py-4 pl-4 pr-3 text-sm whitespace-nowrap sm:pl-6">
                        <div className="font-medium text-slate-900">
                          {template.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Updated {formatDate(template.updatedAt)}
                        </div>
                      </td>
                      <td className="max-w-xs px-3 py-4 text-sm text-slate-600">
                        <div className="truncate" title={template.subject}>
                          {template.subject}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap">
                        <div className="flex flex-wrap max-w-xs gap-1">
                          {variables.length > 0 ? (
                            variables.slice(0, 3).map((variable) => (
                              <span
                                key={variable}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full"
                              >
                                {variable}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">
                              No variables
                            </span>
                          )}
                          {variables.length > 3 && (
                            <span className="text-xs text-slate-400">
                              +{variables.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-slate-400" />
                          {formatDate(template.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            template.archived
                              ? "bg-gray-100 text-gray-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {template.archived ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td className="relative py-4 pl-3 pr-4 text-sm font-medium text-right whitespace-nowrap sm:pr-6">
                        <div className="flex justify-end gap-x-2">
                          <button
                            onClick={() => onPreview(template)}
                            className="p-1 transition-colors rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-200/50"
                            title="Preview template"
                            aria-label="Preview template"
                            type="button"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => onEdit(template)}
                            className="p-1 transition-colors rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50"
                            title="Edit template"
                            aria-label="Edit template"
                            type="button"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => onDuplicate(template)}
                            className="p-1 transition-colors rounded-full text-slate-400 hover:text-purple-600 hover:bg-slate-200/50"
                            title="Duplicate template"
                            aria-label="Duplicate template"
                            type="button"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() =>
                              onArchive(template.id, !template.archived)
                            }
                            className="p-1 transition-colors rounded-full text-slate-400 hover:text-orange-600 hover:bg-slate-200/50"
                            title={
                              template.archived
                                ? "Restore template"
                                : "Archive template"
                            }
                            aria-label={
                              template.archived
                                ? "Unarchive template"
                                : "Archive template"
                            }
                            type="button"
                          >
                            {template.archived ? (
                              <ArchiveRestore size={18} />
                            ) : (
                              <Archive size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => onDelete(template.id)}
                            className="p-1 transition-colors rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-200/50"
                            title="Delete template"
                            aria-label="Delete template"
                            type="button"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No templates found.
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
