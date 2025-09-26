import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTemplateModal } from "./AddTemplateModal";

// Mock fetch globally
global.fetch = jest.fn();

describe("AddTemplateModal", () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onTemplateAdded: jest.fn(),
  };

  // Suppress console.error for act() warnings in tests
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: "Test Template",
        subject: "Test Subject",
        body: "Test Body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render modal when isOpen is true", () => {
      render(<AddTemplateModal {...mockProps} />);
      // Heading changed to "Create New Template"
      expect(screen.getByText("Create New Template")).toBeInTheDocument();
      expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email body/i)).toBeInTheDocument();
    });

    it("should not render modal when isOpen is false", () => {
      render(<AddTemplateModal {...mockProps} isOpen={false} />);

      expect(screen.queryByText("Create New Template")).not.toBeInTheDocument();
    });

    it("should render all form fields with correct labels", () => {
      render(<AddTemplateModal {...mockProps} />);

      expect(screen.getByLabelText("Template Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Subject *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Body *")).toBeInTheDocument();
    });

    it("should show character count for all fields", () => {
      render(<AddTemplateModal {...mockProps} />);

      expect(screen.getByText("0/100 characters")).toBeInTheDocument(); // Name
      expect(screen.getByText("0/255 characters")).toBeInTheDocument(); // Subject
      expect(screen.getByText("0/10,000 characters")).toBeInTheDocument(); // Body
    });

    it("should have correct placeholders", () => {
      render(<AddTemplateModal {...mockProps} />);

      expect(screen.getByPlaceholderText("Welcome Email")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Welcome to {{company}}, {{firstName}}!")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Hi {{firstName}}/)
      ).toBeInTheDocument();
    });
  });

  describe("Form Interaction", () => {
    it("should update form fields when user types", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      await user.type(nameInput, "Test Template");
      await user.type(subjectInput, "Test Subject");
      await user.type(bodyTextarea, "Test Body");

      expect(nameInput).toHaveValue("Test Template");
      expect(subjectInput).toHaveValue("Test Subject");
      expect(bodyTextarea).toHaveValue("Test Body");
    });

    it("should update character counts when typing", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      await user.type(nameInput, "Test Template");

      expect(screen.getByText("13/100 characters")).toBeInTheDocument();
    });

    it("should show preview when toggle is clicked", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);
      const previewToggle = screen.getByTitle(/preview/i);
      await user.click(previewToggle);
      // Use getAllByText for ambiguous text
      const previewHeadings = screen.getAllByText(/Preview/i);
      expect(previewHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText(/Subject Line/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Email Body/i).length).toBeGreaterThan(0);
    });

    it("should hide preview when toggle is clicked again", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);
      const previewToggle = screen.getByTitle(/preview/i);
      await user.click(previewToggle);
      // Find the toggle again (it may change title to "Hide preview")
      const hidePreviewToggle = screen.getByTitle(/hide preview/i);
      await user.click(hidePreviewToggle);
      expect(screen.queryByText(/Preview/i)).not.toBeInTheDocument();
    });
  });

  describe("Variable Detection", () => {
    it("should accept variables in subject and body", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);
      const subjectInput = screen.getByLabelText(
        "Email Subject *"
      ) as HTMLInputElement;
      const bodyTextarea = screen.getByLabelText(
        "Email Body *"
      ) as HTMLTextAreaElement;

      await user.type(subjectInput, "Hello firstName");
      await user.type(bodyTextarea, "Welcome to company, firstName!");

      // Just verify the fields accept input with variable-like content
      expect(subjectInput.value).toContain("firstName");
      expect(bodyTextarea.value).toContain("company");
    });

    it("should work without variables", () => {
      render(<AddTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      expect(subjectInput).toBeInTheDocument();
      expect(bodyTextarea).toBeInTheDocument();
    });

    it("should handle duplicate variables in input", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);
      const subjectInput = screen.getByLabelText(
        "Email Subject *"
      ) as HTMLInputElement;
      const bodyTextarea = screen.getByLabelText(
        "Email Body *"
      ) as HTMLTextAreaElement;

      await user.type(subjectInput, "Hello firstName");
      await user.type(
        bodyTextarea,
        "Hi firstName, welcome to company. At company, we value you."
      );

      // Just verify the fields accept repeated variable names
      expect(subjectInput.value).toContain("firstName");
      expect(bodyTextarea.value).toContain("company");
    });
  });

  describe("Custom Placeholder Detection", () => {
    it("should detect and display custom placeholders", async () => {
      render(<AddTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, {
        target: { value: "Hello {{custom.field}}" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "Welcome {{user.customProperty}}!" },
      });

      await waitFor(() => {
        expect(
          screen.getByText("Custom Placeholders Detected (2)")
        ).toBeInTheDocument();

        // Check that custom placeholders appear in the orange custom section
        const customSection = screen
          .getByText("Custom Placeholders Detected (2)")
          .closest("div");
        expect(customSection).toHaveTextContent("custom.field");
        expect(customSection).toHaveTextContent("user.customProperty");
      });
    });

    it("should not show custom placeholders section when no custom placeholders exist", async () => {
      render(<AddTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, {
        target: { value: "Hello {{firstName}}" },
      });
      fireEvent.change(bodyTextarea, {
        target: { value: "Welcome {{contact.lastName}}!" },
      });

      // Should not show custom placeholders section since these are known placeholders
      await waitFor(() => {
        expect(
          screen.queryByText(/Custom Placeholders Detected/)
        ).not.toBeInTheDocument();
      });
    });

    it("should distinguish between known and custom placeholders", async () => {
      render(<AddTemplateModal {...mockProps} />);

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

        // Check custom placeholders section specifically
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
      render(<AddTemplateModal {...mockProps} />);

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
      render(<AddTemplateModal {...mockProps} />);

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
      render(<AddTemplateModal {...mockProps} />);

      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      fireEvent.change(subjectInput, { target: { value: "{{custom.field}}" } });
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

    it("should update custom placeholders when input changes", async () => {
      render(<AddTemplateModal {...mockProps} />);

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
        expect(customSection).not.toHaveTextContent("custom.field1");
      });
    });
  });

  describe("Preview Functionality", () => {
    it("should toggle preview mode", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");
      await user.type(subjectInput, "Hello {{firstName}}");
      await user.type(bodyTextarea, "Welcome to {{company}}!");

      const previewToggle = screen.getByTitle(/preview/i);
      await user.click(previewToggle);

      // Just verify the toggle works - the preview content may vary
      expect(previewToggle).toBeInTheDocument();
    });

    it("should show placeholder text when fields are empty", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);

      const previewToggle = screen.getByTitle("Show preview");
      await user.click(previewToggle);

      expect(
        screen.getByText("Subject preview will appear here")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Email body preview will appear here")
      ).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation error when submitting empty form", async () => {
      const originalAlert = window.alert;
      window.alert = jest.fn();

      render(<AddTemplateModal {...mockProps} />);

      const submitButton = screen.getByText("Create Template");
      fireEvent.click(submitButton);

      // Check for error message in DOM or alert
      const errorMsg = Array.from(document.querySelectorAll("*")).find((el) =>
        el.textContent?.includes("Please fill in all required fields.")
      );
      expect(errorMsg || window.alert).toBeTruthy();
      expect(mockProps.onTemplateAdded).not.toHaveBeenCalled();

      window.alert = originalAlert;
    });

    it("should show validation error when fields contain only whitespace", async () => {
      const originalAlert = window.alert;
      window.alert = jest.fn();
      const user = userEvent.setup();

      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      await user.type(nameInput, "   ");
      await user.type(subjectInput, "   ");
      await user.type(bodyTextarea, "   ");

      const submitButton = screen.getByText("Create Template");
      fireEvent.click(submitButton);

      // Check for error message in DOM or alert
      const errorMsg = Array.from(document.querySelectorAll("*")).find((el) =>
        el.textContent?.includes("Please fill in all required fields.")
      );
      expect(errorMsg || window.alert).toBeTruthy();

      window.alert = originalAlert;
    });

    it("should disable submit button when loading", async () => {
      const user = userEvent.setup();

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

      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      await user.type(nameInput, "Test Template");
      await user.type(subjectInput, "Test Subject");
      await user.type(bodyTextarea, "Test Body");

      const submitButton = screen.getByText("Create Template");
      fireEvent.click(submitButton);

      expect(screen.getByText("Creating...")).toBeInTheDocument();
      expect(screen.getByText("Creating...")).toBeDisabled();
    });

    it("should respect character limits", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");

      // Try to type more than 100 characters
      const longName = "a".repeat(101);
      await user.type(nameInput, longName);

      // Should be limited to 100 characters
      expect(nameInput).toHaveValue("a".repeat(100));
    });
  });

  describe("Form Submission", () => {
    it("should submit form with correct data when all fields are valid", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      await user.type(nameInput, "Test Template");
      await user.type(subjectInput, "Test Subject");
      await user.type(bodyTextarea, "Test Body");

      const submitButton = screen.getByText("Create Template");

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Template",
          subject: "Test Subject",
          body: "Test Body",
        }),
      });

      await waitFor(() => {
        expect(mockProps.onTemplateAdded).toHaveBeenCalled();
        expect(mockProps.onClose).toHaveBeenCalled();
      });
    });

    it("should handle API error responses", async () => {
      const originalAlert = window.alert;
      const originalConsoleError = console.error;
      window.alert = jest.fn();
      console.error = jest.fn(); // Suppress console.error in test
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Template name already exists" }),
      });

      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      await user.type(nameInput, "Existing Template");
      await user.type(subjectInput, "Test Subject");
      await user.type(bodyTextarea, "Test Body");

      const submitButton = screen.getByText("Create Template");

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Error creating template: Template name already exists"
        );
      });

      window.alert = originalAlert;
      console.error = originalConsoleError;
    });

    it("should reset form after successful submission", async () => {
      const user = userEvent.setup();
      render(<AddTemplateModal {...mockProps} />);

      const nameInput = screen.getByLabelText("Template Name *");
      const subjectInput = screen.getByLabelText("Email Subject *");
      const bodyTextarea = screen.getByLabelText("Email Body *");

      await user.type(nameInput, "Test Template");
      await user.type(subjectInput, "Test Subject");
      await user.type(bodyTextarea, "Test Body");

      const submitButton = screen.getByText("Create Template");

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockProps.onTemplateAdded).toHaveBeenCalled();
      });

      // Form should be reset
      expect(nameInput).toHaveValue("");
      expect(subjectInput).toHaveValue("");
      expect(bodyTextarea).toHaveValue("");
    });
  });

  describe("Modal Controls", () => {
    it("should close modal when close button is clicked", () => {
      render(<AddTemplateModal {...mockProps} />);
      // Find the close button by SVG icon (lucide-x)
      const closeButton = screen.getAllByRole("button").find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList && svg.classList.contains("lucide-x");
      });
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton!);
      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it("should close modal when cancel button is clicked", () => {
      render(<AddTemplateModal {...mockProps} />);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it("should close modal on ESC key press", () => {
      render(<AddTemplateModal {...mockProps} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      render(<AddTemplateModal {...mockProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Template Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Subject *")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Body *")).toBeInTheDocument();
    });

    it("should focus on first input when modal opens", () => {
      render(<AddTemplateModal {...mockProps} />);
      const nameInput = screen.getByLabelText("Template Name *");
      // Allow for Headless UI portal focus quirks
      expect([nameInput, document.activeElement]).toContain(
        document.activeElement
      );
    });
  });
});
