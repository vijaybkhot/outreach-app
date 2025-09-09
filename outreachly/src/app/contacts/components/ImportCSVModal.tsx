"use client";
import { useState, ChangeEvent } from "react";
import Papa from "papaparse";
import { X, FileText } from "lucide-react"; // Added FileText icon

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export function ImportCSVModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      alert("Please select a file to import.");
      return;
    }

    setIsLoading(true);

    interface ContactCSVRow {
      firstName?: string;
      lastName?: string;
      email?: string;
      company?: string;
      tags?: string;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedData = (results.data as ContactCSVRow[]).map(
            (row) => ({
              firstName: row.firstName || "",
              lastName: row.lastName || "",
              email: row.email || "",
              company: row.company || "",
              tags: (row.tags || "")
                .split(",")
                .map((tag: string) => tag.trim())
                .filter(Boolean),
            })
          );

          const response = await fetch("/api/contacts/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to import contacts");
          }

          const result = await response.json();
          alert(result.message);
          onImportSuccess();
          onClose();
        } catch (error: unknown) {
          console.error(error);
          const errorMessage =
            typeof error === "object" && error !== null && "message" in error
              ? (error as { message?: string }).message
              : String(error);
          alert(`Error importing contacts: ${errorMessage}`);
        } finally {
          setIsLoading(false);
          setFile(null); // Clear file input
        }
      },
      error: (error: Error) => {
        setIsLoading(false);
        alert(`Error parsing CSV: ${error.message}`);
        console.error("CSV parsing error:", error);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 transition-opacity flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Import Contacts from CSV
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with the headers: `firstName`, `lastName`,
            `email`, `company`, `tags`. Tags should be comma-separated in the
            `tags` column.
            <a
              href="/sample.csv"
              download
              className="text-indigo-600 hover:underline ml-2 flex items-center gap-1"
            >
              <FileText size={16} /> Download Sample CSV
            </a>
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-700">
              Selected file: {file.name}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!file || isLoading}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
