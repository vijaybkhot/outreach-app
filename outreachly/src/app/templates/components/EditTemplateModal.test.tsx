import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { EditTemplateModal } from "./EditTemplateModal";
import { Template } from "../../../types/template";

// Mock fetch globally
global.fetch = jest.fn();

describe("EditTemplateModal", () => {
  const mockTemplate: Template = {
    id: 1,
    name: "Welcome Email",
    subject: "Welcome to {{company}}",
    body: "Hello {{firstName}}, welcome to our platform!",
    archived: false,
    customPlaceholders: [],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  };

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    template: mockTemplate,
    onTemplateUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockTemplate,
        name: "Updated Template",
        subject: "Updated Subject",
        body: "Updated Body",
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render modal when isOpen is true", () => {
      render(<EditTemplateModal {...mockProps} />);

      expect(
        screen.getByText("Edit Template: Welcome Email")
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email body/i)).toBeInTheDocument();
    });

    it("should not render modal when isOpen is false", () => {
      render(<EditTemplateModal {...mockProps} isOpen={false} />);

      expect(
        screen.queryByText("Edit Template: Welcome Email")
      ).not.toBeInTheDocument();
    });

    it("should pre-populate form fields with template data", () => {
      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      expect(nameInput).toHaveValue("Welcome Email");
      expect(subjectInput).toHaveValue("Welcome to {{company}}");
      expect(bodyTextarea).toHaveValue(
        "Hello {{firstName}}, welcome to our platform!"
      );
    });

    it("should update form fields when template prop changes", () => {
      const { rerender } = render(<EditTemplateModal {...mockProps} />);

      const newTemplate: Template = {
        ...mockTemplate,
        id: 2,
        name: "Different Template",
        subject: "Different Subject",
        body: "Different Body",
        customPlaceholders: [],
      };

      rerender(<EditTemplateModal {...mockProps} template={newTemplate} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      expect(nameInput).toHaveValue("Different Template");
      expect(subjectInput).toHaveValue("Different Subject");
      expect(bodyTextarea).toHaveValue("Different Body");
    });

    it("should show character count for all fields", () => {
      render(<EditTemplateModal {...mockProps} />);

      expect(screen.getByText("13/100 characters")).toBeInTheDocument(); // Name length
      expect(screen.getByText("22/255 characters")).toBeInTheDocument(); // Subject length
      expect(screen.getByText("45/10,000 characters")).toBeInTheDocument(); // Body length (corrected count)
    });
  });

  describe("Form Interaction", () => {
    it("should update form fields when user types", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");

      fireEvent.change(nameInput, { target: { value: "" } });
      fireEvent.change(nameInput, { target: { value: "Updated Template" } });

      expect(nameInput).toHaveValue("Updated Template");
    });

    it("should update character counts when typing", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");

      fireEvent.change(nameInput, { target: { value: "New Name" } });

      expect(screen.getByText("8/100 characters")).toBeInTheDocument();
    });

    it("should show preview when toggle is clicked", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const previewToggle = screen.getByTitle("Show preview");
      fireEvent.click(previewToggle);

      expect(screen.getByText("Preview")).toBeInTheDocument();
      expect(screen.getByText("Subject Line")).toBeInTheDocument();
      // Use getAllByText to handle multiple "Email Body" labels and check that the preview section exists
      const emailBodyLabels = screen.getAllByText("Email Body");
      expect(emailBodyLabels.length).toBeGreaterThan(1); // Form label + preview label
    });

    it("should hide preview when toggle is clicked again", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const previewToggle = screen.getByTitle("Show preview");
      fireEvent.click(previewToggle);

      const hidePreviewToggle = screen.getByTitle("Hide preview");
      fireEvent.click(hidePreviewToggle);

      expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    });
  });

  describe("Variable Detection", () => {
    it("should detect and display variables from subject and body", () => {
      render(<EditTemplateModal {...mockProps} />);

      expect(screen.getByText("Detected Variables (2)")).toBeInTheDocument();
      expect(screen.getByText("company")).toBeInTheDocument();
      expect(screen.getByText("firstName")).toBeInTheDocument();
    });

    it("should update variables when form fields change", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");

      fireEvent.change(subjectInput, {
        target: { value: "Hello {{lastName}} and {{title}}" },
      });

      expect(screen.getByText("Detected Variables (3)")).toBeInTheDocument();
      const variablesSection = screen
        .getByText("Detected Variables (3)")
        .closest("div");
      expect(variablesSection).toHaveTextContent("lastName");
      expect(variablesSection).toHaveTextContent("title");
      expect(variablesSection).toHaveTextContent("firstName"); // From body
    });

    it("should not show variables section when no variables detected", async () => {
      const templateWithoutVariables: Template = {
        ...mockTemplate,
        subject: "Simple subject",
        body: "Simple body without variables",
        customPlaceholders: [],
      };

      render(
        <EditTemplateModal {...mockProps} template={templateWithoutVariables} />
      );

      expect(screen.queryByText(/Detected Variables/)).not.toBeInTheDocument();
    });
  });

  describe("Custom Placeholder Detection", () => {
    it("should detect and display custom placeholders on initial load", () => {
      const templateWithCustomPlaceholders: Template = {
        ...mockTemplate,
        subject: "Welcome {{custom.field}}",
        body: "Hello {{user.customProperty}}, welcome!",
        customPlaceholders: ["custom.field", "user.customProperty"],
      };

      render(
        <EditTemplateModal
          {...mockProps}
          template={templateWithCustomPlaceholders}
        />
      );

      expect(
        screen.getByText("Custom Placeholders Detected (2)")
      ).toBeInTheDocument();
      const customSection = screen
        .getByText("Custom Placeholders Detected (2)")
        .closest("div");
      expect(customSection).toHaveTextContent("custom.field");
      expect(customSection).toHaveTextContent("user.customProperty");
    });

    it("should not show custom placeholders section when no custom placeholders exist", () => {
      render(<EditTemplateModal {...mockProps} />);

      // The default template uses only known placeholders (company, firstName)
      expect(
        screen.queryByText(/Custom Placeholders Detected/)
      ).not.toBeInTheDocument();
    });

    it("should distinguish between known and custom placeholders", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, {
        target: { value: "Hello {{firstName}} and {{custom.field}}" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "Welcome {{contact.email}} - {{unknownField}}!" },
      });

      await waitFor(() => {
        // Should show detected variables section with both known and custom
        expect(screen.getByText("Detected Variables (4)")).toBeInTheDocument();

        // Should show custom placeholders section only with custom ones
        expect(
          screen.getByText("Custom Placeholders Detected (2)")
        ).toBeInTheDocument();
        const customSection = screen
          .getByText("Custom Placeholders Detected (2)")
          .closest("div");
        expect(customSection).toHaveTextContent("custom.field");
        expect(customSection).toHaveTextContent("unknownField");

        // Known placeholders should not appear in custom section
        expect(customSection).not.toHaveTextContent("firstName");
        expect(customSection).not.toHaveTextContent("contact.email");
      });
    });

    it("should handle dot notation placeholders correctly", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, {
        target: { value: "{{user.profile.name}}" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "{{organization.settings.theme}}" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Custom Placeholders Detected (2)")
        ).toBeInTheDocument();
        const customSection = screen
          .getByText("Custom Placeholders Detected (2)")
          .closest("div");
        expect(customSection).toHaveTextContent("user.profile.name");
        expect(customSection).toHaveTextContent("organization.settings.theme");
      });
    });

    it("should handle placeholders with whitespace", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, {
        target: { value: "{{ custom.field }}" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "{{  user.name  }}" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Custom Placeholders Detected (2)")
        ).toBeInTheDocument();
        const customSection = screen
          .getByText("Custom Placeholders Detected (2)")
          .closest("div");
        expect(customSection).toHaveTextContent("custom.field");
        expect(customSection).toHaveTextContent("user.name");
      });
    });

    it("should remove duplicates from custom placeholders", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, {
        target: { value: "{{custom.field}}" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "{{custom.field}} appears twice {{custom.field}}" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Custom Placeholders Detected (1)")
        ).toBeInTheDocument();
        const customSection = screen
          .getByText("Custom Placeholders Detected (1)")
          .closest("div");
        expect(customSection).toHaveTextContent("custom.field");
      });
    });

    it("should update custom placeholders when template prop changes", () => {
      const { rerender } = render(<EditTemplateModal {...mockProps} />);

      const newTemplate: Template = {
        ...mockTemplate,
        subject: "{{newCustom.field}}",
        body: "Different {{another.custom}} placeholder",
        customPlaceholders: ["newCustom.field", "another.custom"],
      };

      rerender(<EditTemplateModal {...mockProps} template={newTemplate} />);

      expect(
        screen.getByText("Custom Placeholders Detected (2)")
      ).toBeInTheDocument();
      const customSection = screen
        .getByText("Custom Placeholders Detected (2)")
        .closest("div");
      expect(customSection).toHaveTextContent("newCustom.field");
      expect(customSection).toHaveTextContent("another.custom");
    });

    it("should update custom placeholders when input changes", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");

      // Start with one custom placeholder
      fireEvent.change(subjectInput, {
        target: { value: "{{custom.field1}}" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Custom Placeholders Detected (1)")
        ).toBeInTheDocument();
        const customSection = screen
          .getByText("Custom Placeholders Detected (1)")
          .closest("div");
        expect(customSection).toHaveTextContent("custom.field1");
      });

      // Change to different placeholder
      fireEvent.change(subjectInput, {
        target: { value: "{{custom.field2}}" },
      });

      await waitFor(() => {
        const customSection = screen
          .getByText("Custom Placeholders Detected (1)")
          .closest("div");
        expect(customSection).toHaveTextContent("custom.field2");
        expect(screen.queryByText("custom.field1")).not.toBeInTheDocument();
      });
    });
  });

  describe("Preview Functionality", () => {
    it("should show rendered preview with sample data", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const previewToggle = screen.getByTitle("Show preview");
      fireEvent.click(previewToggle);

      expect(screen.getByText("Welcome to Acme Corp")).toBeInTheDocument();
      expect(
        screen.getByText("Hello John, welcome to our platform!")
      ).toBeInTheDocument();
    });

    it("should update preview when form fields change", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const previewToggle = screen.getByTitle("Show preview");

      fireEvent.click(previewToggle);
      fireEvent.change(subjectInput, {
        target: { value: "New subject for {{firstName}}" },
      });

      expect(screen.getByText("New subject for John")).toBeInTheDocument();
    });

    it("should show placeholder text when fields are empty", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");
      const previewToggle = screen.getByTitle("Show preview");

      fireEvent.change(subjectInput, { target: { value: "" } });
      fireEvent.change(bodyTextarea, { target: { value: "" } });
      fireEvent.click(previewToggle);

      expect(
        screen.getByText("Subject preview will appear here")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Email body preview will appear here")
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when loading", async () => {
      // Mock a slow API response
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ id: 1 }),
                }),
              1000
            )
          )
      );

      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      fireEvent.change(nameInput, { target: { value: "Updated Template" } });

      const submitButton = screen.getByText("Save Changes");
      fireEvent.click(submitButton);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(screen.getByText("Saving...")).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("should submit form with correct data when all fields are valid", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(nameInput, { target: { value: "Updated Template" } });
      fireEvent.change(subjectInput, { target: { value: "Updated Subject" } });
      fireEvent.change(bodyTextarea, { target: { value: "Updated Body" } });

      const submitButton = screen.getByText("Save Changes");

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/templates/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated Template",
          subject: "Updated Subject",
          body: "Updated Body",
        }),
      });

      await waitFor(() => {
        expect(mockProps.onTemplateUpdated).toHaveBeenCalled();
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    it("should handle API errors gracefully", async () => {
      const originalAlert = window.alert;
      window.alert = jest.fn();

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      fireEvent.change(nameInput, { target: { value: "Updated Template" } });

      const submitButton = screen.getByText("Save Changes");

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Error updating template: Network error"
        );
      });

      expect(mockProps.onTemplateUpdated).not.toHaveBeenCalled();
      expect(mockProps.onClose).not.toHaveBeenCalled();

      window.alert = originalAlert;
    });
  });

  describe("Modal Controls", () => {
    it("should close modal when close button is clicked", () => {
      render(<EditTemplateModal {...mockProps} />);

      // Find the close button by its position - it's the second button in the header controls
      const buttons = screen.getAllByRole("button");
      const closeButton = buttons.find(
        (button) => button.querySelector("svg") && !button.getAttribute("title") // Close button doesn't have a title, unlike preview button
      );

      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it("should close modal when cancel button is clicked", () => {
      render(<EditTemplateModal {...mockProps} />);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      render(<EditTemplateModal {...mockProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Template Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Subject *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Body *")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle template with empty values", () => {
      const templateWithEmptyValues: Template = {
        ...mockTemplate,
        name: "",
        subject: "",
        body: "",
        customPlaceholders: [],
      };

      render(
        <EditTemplateModal {...mockProps} template={templateWithEmptyValues} />
      );

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      expect(nameInput).toHaveValue("");
      expect(subjectInput).toHaveValue("");
      expect(bodyTextarea).toHaveValue("");
    });

    it("should handle special characters in templates", async () => {
      render(<EditTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(nameInput, {
        target: { value: "Template with émojis 🎉" },
      });
      fireEvent.change(subjectInput, {
        target: { value: "Subject with <script>alert('xss')</script>" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "Body with & special chars < > \" '" },
      });

      const submitButton = screen.getByText("Save Changes");

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/templates/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Template with émojis 🎉",
          subject: "Subject with <script>alert('xss')</script>",
          body: "Body with & special chars < > \" '",
        }),
      });
    });
  });
});
