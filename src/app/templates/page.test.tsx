import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import TemplatesPage from "./page";
import { Template } from "@prisma/client";

// Mock the components
jest.mock("./components/TemplatesTable", () => ({
  __esModule: true,
  TemplatesTable: jest.fn(
    ({ templates, onEdit, onDuplicate, onPreview, onDelete, onArchive }) => (
      <div>
        <span>Mock Templates Table</span>
        {templates.map((template: Template) => (
          <div key={template.id}>
            <span>{template.name}</span>
            <button onClick={() => onEdit(template)}>Edit-{template.id}</button>
            <button onClick={() => onDuplicate(template)}>
              Duplicate-{template.id}
            </button>
            <button onClick={() => onPreview(template)}>
              Preview-{template.id}
            </button>
            <button onClick={() => onDelete(template.id)}>
              Delete-{template.id}
            </button>
            <button onClick={() => onArchive(template.id, !template.archived)}>
              Archive-{template.id}
            </button>
          </div>
        ))}
      </div>
    )
  ),
}));

jest.mock("./components/AddTemplateModal", () => ({
  __esModule: true,
  AddTemplateModal: jest.fn(({ isOpen, onClose, onTemplateAdded }) =>
    isOpen ? (
      <div>
        <span>Mock Add Template Modal</span>
        <button onClick={onClose}>Close Add Modal</button>
        <button onClick={onTemplateAdded}>Add Template</button>
      </div>
    ) : null
  ),
}));

jest.mock("./components/EditTemplateModal", () => ({
  __esModule: true,
  EditTemplateModal: jest.fn(
    ({ isOpen, onClose, template, onTemplateUpdated }) =>
      isOpen ? (
        <div>
          <span>Mock Edit Template Modal - {template?.name}</span>
          <button onClick={onClose}>Close Edit Modal</button>
          <button onClick={onTemplateUpdated}>Update Template</button>
        </div>
      ) : null
  ),
}));

jest.mock("./components/DuplicateTemplateModal", () => ({
  __esModule: true,
  DuplicateTemplateModal: jest.fn(
    ({ isOpen, onClose, template, onTemplateDuplicated }) =>
      isOpen ? (
        <div>
          <span>Mock Duplicate Template Modal - {template?.name}</span>
          <button onClick={onClose}>Close Duplicate Modal</button>
          <button onClick={onTemplateDuplicated}>Duplicate Template</button>
        </div>
      ) : null
  ),
}));

jest.mock("./components/TemplatePreviewModal", () => ({
  __esModule: true,
  TemplatePreviewModal: jest.fn(({ isOpen, onClose, template }) =>
    isOpen ? (
      <div>
        <span>Mock Preview Template Modal - {template?.name}</span>
        <button onClick={onClose}>Close Preview Modal</button>
      </div>
    ) : null
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("TemplatesPage", () => {
  const mockTemplates: Template[] = [
    {
      id: 1,
      name: "Welcome Email",
      subject: "Welcome to {{company}}",
      body: "Hello {{firstName}}, welcome to our platform!",
      archived: false,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
    {
      id: 2,
      name: "Follow Up",
      subject: "Following up on {{topic}}",
      body: "Hi {{firstName}}, just following up on our conversation about {{topic}}.",
      archived: false,
      createdAt: new Date("2023-01-02"),
      updatedAt: new Date("2023-01-02"),
    },
    {
      id: 3,
      name: "Archived Template",
      subject: "Old template",
      body: "This is an old template.",
      archived: true,
      createdAt: new Date("2023-01-03"),
      updatedAt: new Date("2023-01-03"),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTemplates.filter((t) => !t.archived),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render the templates page with header", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      expect(screen.getByText("Templates")).toBeInTheDocument();
      expect(
        screen.getByText("Create and manage your email templates")
      ).toBeInTheDocument();
    });

    it("should show loading state initially", async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => [],
                }),
              100
            )
          )
      );

      render(<TemplatesPage />);

      expect(
        screen.getByText(/loading templates/i) ||
          document.querySelector(".animate-spin")
      ).toBeInTheDocument();
    });

    it("should fetch and display templates after loading", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Mock Templates Table")).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/templates");
    });
  });

  describe("Search Functionality", () => {
    it("should update search term when typing in search input", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "welcome" } });
      });

      expect(searchInput).toHaveValue("welcome");
    });

    it("should fetch templates with search parameter when searching", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "welcome" } });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/templates?search=welcome"
        );
      });
    });

    it("should include archived templates when checkbox is checked", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      const includeArchivedCheckbox =
        screen.getByLabelText(/include archived/i);

      await act(async () => {
        fireEvent.click(includeArchivedCheckbox);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/templates?includeArchived=true"
        );
      });
    });
  });

  describe("Modal Management", () => {
    it("should open add template modal when add button is clicked", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      const addButton = screen.getByText("Add Template");

      await act(async () => {
        fireEvent.click(addButton);
      });

      expect(screen.getByText("Mock Add Template Modal")).toBeInTheDocument();
    });

    it("should close add template modal when close is clicked", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      // Open modal
      const addButton = screen.getByText("Add Template");
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Close modal
      const closeButton = screen.getByText("Close Add Modal");
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(
        screen.queryByText("Mock Add Template Modal")
      ).not.toBeInTheDocument();
    });

    it("should open edit modal when edit action is triggered", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const editButton = screen.getByText("Edit-1");

      await act(async () => {
        fireEvent.click(editButton);
      });

      expect(
        screen.getByText("Mock Edit Template Modal - Welcome Email")
      ).toBeInTheDocument();
    });

    it("should open duplicate modal when duplicate action is triggered", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const duplicateButton = screen.getByText("Duplicate-1");

      await act(async () => {
        fireEvent.click(duplicateButton);
      });

      expect(
        screen.getByText("Mock Duplicate Template Modal - Welcome Email")
      ).toBeInTheDocument();
    });

    it("should open preview modal when preview action is triggered", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const previewButton = screen.getByText("Preview-1");

      await act(async () => {
        fireEvent.click(previewButton);
      });

      expect(
        screen.getByText("Mock Preview Template Modal - Welcome Email")
      ).toBeInTheDocument();
    });
  });

  describe("Template Actions", () => {
    it("should handle template deletion with confirmation", async () => {
      // Mock window.confirm to return true
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates.filter((t) => !t.archived),
        })
        .mockResolvedValueOnce({ ok: true }) // Delete response
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            mockTemplates.filter((t) => t.id !== 1 && !t.archived),
        }); // Refetch

      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("Delete-1");

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this template?"
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/templates/1", {
          method: "DELETE",
        });
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it("should not delete template if confirmation is cancelled", async () => {
      // Mock window.confirm to return false
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => false);

      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("Delete-1");

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this template?"
      );

      // Should not make delete API call
      expect(global.fetch).not.toHaveBeenCalledWith("/api/templates/1", {
        method: "DELETE",
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });

    it("should handle template archiving", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates.filter((t) => !t.archived),
        })
        .mockResolvedValueOnce({ ok: true }) // Archive response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates.filter((t) => !t.archived),
        }); // Refetch

      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const archiveButton = screen.getByText("Archive-1");

      await act(async () => {
        fireEvent.click(archiveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/templates/1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: true }),
        });
      });
    });

    it("should refresh templates after adding a new template", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      // Open add modal - use the first Add Template button (the main one)
      const addButtons = screen.getAllByText("Add Template");
      await act(async () => {
        fireEvent.click(addButtons[0]);
      });

      // Wait for the modal to open and find the modal's Add Template button
      await waitFor(() => {
        expect(screen.getByText("Mock Add Template Modal")).toBeInTheDocument();
      });

      // Trigger template added - find the button inside the modal using getAllByText and selecting last one
      const allAddButtons = screen.getAllByText("Add Template");
      const modalAddButton = allAddButtons[allAddButtons.length - 1]; // The modal button should be the last one rendered
      await act(async () => {
        fireEvent.click(modalAddButton);
      });

      // Should fetch templates again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial fetch + refetch
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch error gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to fetch templates:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it("should handle delete error gracefully", async () => {
      const originalConfirm = window.confirm;
      const originalAlert = window.alert;
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTemplates.filter((t) => !t.archived),
        })
        .mockRejectedValueOnce(new Error("Delete failed"));

      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      });

      const deleteButton = screen.getByText("Delete-1");

      await act(async () => {
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Delete failed");
      });

      window.confirm = originalConfirm;
      window.alert = originalAlert;
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no templates exist", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("No templates found")).toBeInTheDocument();
        expect(
          screen.getByText("Get started by creating your first email template")
        ).toBeInTheDocument();
      });
    });

    it("should show search-specific empty state", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await act(async () => {
        render(<TemplatesPage />);
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "nonexistent" } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('No templates match your search "nonexistent"')
        ).toBeInTheDocument();
      });
    });
  });

  describe("Template Count Display", () => {
    it("should display correct template count", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      await waitFor(() => {
        expect(screen.getByText("Showing 2 templates")).toBeInTheDocument();
      });
    });

    it("should display search context in count", async () => {
      await act(async () => {
        render(<TemplatesPage />);
      });

      const searchInput = screen.getByPlaceholderText(/search templates/i);

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "welcome" } });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Showing 2 templates matching "welcome"')
        ).toBeInTheDocument();
      });
    });
  });
});
