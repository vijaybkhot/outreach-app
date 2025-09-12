import { render, screen, fireEvent } from "@testing-library/react";
import { TemplatesTable } from "./TemplatesTable";
import { Template } from "@prisma/client";

describe("TemplatesTable", () => {
  const mockTemplates: Template[] = [
    {
      id: 1,
      name: "Welcome Email",
      subject: "Welcome to {{company}}",
      body: "Hello {{firstName}}, welcome to our platform! We're excited to have you at {{company}}.",
      archived: false,
      createdAt: new Date("2023-01-01T10:00:00Z"),
      updatedAt: new Date("2023-01-01T10:00:00Z"),
    },
    {
      id: 2,
      name: "Follow Up",
      subject: "Following up on {{topic}}",
      body: "Hi {{firstName}}, just following up on our conversation about {{topic}}. Let me know if you have any questions about {{product}}.",
      archived: false,
      createdAt: new Date("2023-01-02T10:00:00Z"),
      updatedAt: new Date("2023-01-02T10:00:00Z"),
    },
    {
      id: 3,
      name: "Archived Template",
      subject: "Old template",
      body: "This is an old template with no variables.",
      archived: true,
      createdAt: new Date("2023-01-03T10:00:00Z"),
      updatedAt: new Date("2023-01-03T10:00:00Z"),
    },
  ];

  const mockHandlers = {
    onEdit: jest.fn(),
    onDuplicate: jest.fn(),
    onPreview: jest.fn(),
    onDelete: jest.fn(),
    onArchive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render table with correct headers", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      expect(screen.getByText("Template")).toBeInTheDocument();
      expect(screen.getByText("Subject")).toBeInTheDocument();
      expect(screen.getByText("Variables")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("should render all templates", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      expect(screen.getByText("Welcome Email")).toBeInTheDocument();
      expect(screen.getByText("Follow Up")).toBeInTheDocument();
      expect(screen.getByText("Archived Template")).toBeInTheDocument();
    });

    it("should show template subjects", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      expect(screen.getByText("Welcome to {{company}}")).toBeInTheDocument();
      expect(screen.getByText("Following up on {{topic}}")).toBeInTheDocument();
      expect(screen.getByText("Old template")).toBeInTheDocument();
    });

    it("should show correct status badges", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      const activeStatuses = screen.getAllByText("Active");
      expect(activeStatuses).toHaveLength(2);

      expect(screen.getByText("Archived")).toBeInTheDocument();
    });

    it("should show formatted dates", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      // Check that dates are formatted (exact format may vary by locale)
      // Use getAllByText since dates appear multiple times
      const jan1Dates = screen.getAllByText(
        /Jan.*1.*2023|1.*Jan.*2023|2023.*Jan.*1/
      );
      expect(jan1Dates.length).toBeGreaterThan(0);

      const jan2Dates = screen.getAllByText(
        /Jan.*2.*2023|2.*Jan.*2023|2023.*Jan.*2/
      );
      expect(jan2Dates.length).toBeGreaterThan(0);
    });
  });

  describe("Variable Detection", () => {
    it("should extract and display variables correctly", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      // Check for variables from Welcome Email (company, firstName)
      // Use getAllByText since variables might appear multiple times across templates
      const companyElements = screen.getAllByText("company");
      expect(companyElements.length).toBeGreaterThan(0);

      const firstNameElements = screen.getAllByText("firstName");
      expect(firstNameElements.length).toBeGreaterThan(0);

      // Check for variables from Follow Up (topic, product)
      expect(screen.getByText("topic")).toBeInTheDocument();
      expect(screen.getByText("product")).toBeInTheDocument();
    });

    it("should show no variables message when template has no variables", () => {
      render(
        <TemplatesTable
          templates={[mockTemplates[2]]} // Archived template with no variables
          {...mockHandlers}
        />
      );

      expect(screen.getByText("No variables")).toBeInTheDocument();
    });

    it("should handle duplicate variables correctly", () => {
      const templateWithDuplicates: Template = {
        id: 4,
        name: "Duplicate Variables",
        subject: "Hello {{firstName}}",
        body: "Hi {{firstName}}, welcome to {{company}}. At {{company}}, we value you.",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <TemplatesTable
          templates={[templateWithDuplicates]}
          {...mockHandlers}
        />
      );

      // Should only show unique variables
      const firstNameElements = screen.getAllByText("firstName");
      const companyElements = screen.getAllByText("company");

      // Each variable should appear only once in the variables column
      expect(firstNameElements).toHaveLength(1);
      expect(companyElements).toHaveLength(1);
    });
  });

  describe("Action Buttons", () => {
    it("should render all action buttons for active templates", () => {
      render(
        <TemplatesTable
          templates={[mockTemplates[0]]} // Active template
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText("Edit template")).toBeInTheDocument();
      expect(screen.getByLabelText("Duplicate template")).toBeInTheDocument();
      expect(screen.getByLabelText("Preview template")).toBeInTheDocument();
      expect(screen.getByLabelText("Archive template")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete template")).toBeInTheDocument();
    });

    it("should show unarchive button for archived templates", () => {
      render(
        <TemplatesTable
          templates={[mockTemplates[2]]} // Archived template
          {...mockHandlers}
        />
      );

      expect(screen.getByLabelText("Unarchive template")).toBeInTheDocument();
    });

    it("should call onEdit when edit button is clicked", () => {
      render(
        <TemplatesTable templates={[mockTemplates[0]]} {...mockHandlers} />
      );

      const editButton = screen.getByLabelText("Edit template");
      fireEvent.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it("should call onDuplicate when duplicate button is clicked", () => {
      render(
        <TemplatesTable templates={[mockTemplates[0]]} {...mockHandlers} />
      );

      const duplicateButton = screen.getByLabelText("Duplicate template");
      fireEvent.click(duplicateButton);

      expect(mockHandlers.onDuplicate).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it("should call onPreview when preview button is clicked", () => {
      render(
        <TemplatesTable templates={[mockTemplates[0]]} {...mockHandlers} />
      );

      const previewButton = screen.getByLabelText("Preview template");
      fireEvent.click(previewButton);

      expect(mockHandlers.onPreview).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it("should call onArchive with correct parameters when archive button is clicked", () => {
      render(
        <TemplatesTable
          templates={[mockTemplates[0]]} // Active template
          {...mockHandlers}
        />
      );

      const archiveButton = screen.getByLabelText("Archive template");
      fireEvent.click(archiveButton);

      expect(mockHandlers.onArchive).toHaveBeenCalledWith(1, true);
    });

    it("should call onArchive with correct parameters when unarchive button is clicked", () => {
      render(
        <TemplatesTable
          templates={[mockTemplates[2]]} // Archived template
          {...mockHandlers}
        />
      );

      const unarchiveButton = screen.getByLabelText("Unarchive template");
      fireEvent.click(unarchiveButton);

      expect(mockHandlers.onArchive).toHaveBeenCalledWith(3, false);
    });

    it("should call onDelete when delete button is clicked", () => {
      render(
        <TemplatesTable templates={[mockTemplates[0]]} {...mockHandlers} />
      );

      const deleteButton = screen.getByLabelText("Delete template");
      fireEvent.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(1);
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no templates provided", () => {
      render(<TemplatesTable templates={[]} {...mockHandlers} />);

      // Should still render table structure but may show empty rows
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle templates with very long names", () => {
      const longNameTemplate: Template = {
        id: 5,
        name: "This is a very long template name that might overflow the table cell and should be handled gracefully",
        subject: "Short subject",
        body: "Short body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <TemplatesTable templates={[longNameTemplate]} {...mockHandlers} />
      );

      expect(screen.getByText(longNameTemplate.name)).toBeInTheDocument();
    });

    it("should handle templates with very long subjects", () => {
      const longSubjectTemplate: Template = {
        id: 6,
        name: "Normal Name",
        subject:
          "This is a very long subject line that might overflow and should be truncated or handled gracefully in the UI to maintain good UX",
        body: "Normal body",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <TemplatesTable templates={[longSubjectTemplate]} {...mockHandlers} />
      );

      // Check that the subject is rendered (it may be truncated in CSS)
      expect(screen.getByText(longSubjectTemplate.subject)).toBeInTheDocument();
    });

    it("should handle templates with many variables", () => {
      const manyVariablesTemplate: Template = {
        id: 7,
        name: "Many Variables",
        subject: "Hello {{firstName}} {{lastName}}",
        body: "Dear {{title}} {{firstName}} {{lastName}}, welcome to {{company}}! Your {{position}} role at {{department}} starts on {{startDate}}. Contact {{manager}} for questions.",
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <TemplatesTable templates={[manyVariablesTemplate]} {...mockHandlers} />
      );

      // Check that first 3 variables are displayed (only first 3 are shown)
      expect(screen.getByText("firstName")).toBeInTheDocument();
      expect(screen.getByText("lastName")).toBeInTheDocument();
      expect(screen.getByText("title")).toBeInTheDocument();

      // Check that there's a "+X more" indicator for the remaining variables
      expect(screen.getByText("+5 more")).toBeInTheDocument();
    });

    it("should handle invalid date objects gracefully", () => {
      const invalidDateTemplate: Template = {
        id: 8,
        name: "Invalid Date",
        subject: "Subject",
        body: "Body",
        archived: false,
        createdAt: new Date("invalid"),
        updatedAt: new Date("invalid"),
      };

      render(
        <TemplatesTable templates={[invalidDateTemplate]} {...mockHandlers} />
      );

      // Should not crash and should render the template
      // Should show Invalid Date in both the updated and created date fields
      const invalidDates = screen.getAllByText("Invalid Date");
      expect(invalidDates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for action buttons", () => {
      render(
        <TemplatesTable templates={[mockTemplates[0]]} {...mockHandlers} />
      );

      expect(screen.getByLabelText("Edit template")).toBeInTheDocument();
      expect(screen.getByLabelText("Duplicate template")).toBeInTheDocument();
      expect(screen.getByLabelText("Preview template")).toBeInTheDocument();
      expect(screen.getByLabelText("Archive template")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete template")).toBeInTheDocument();
    });

    it("should have proper table structure", () => {
      render(<TemplatesTable templates={mockTemplates} {...mockHandlers} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")).toHaveLength(6);
      expect(screen.getAllByRole("row")).toHaveLength(4); // 1 header + 3 data rows
    });

    it("should have keyboard accessible buttons", () => {
      render(
        <TemplatesTable templates={[mockTemplates[0]]} {...mockHandlers} />
      );

      const editButton = screen.getByLabelText("Edit template");
      expect(editButton).toHaveAttribute("type", "button");

      // Test that button is focusable
      editButton.focus();
      expect(editButton).toHaveFocus();

      // Test click interaction (keyboard accessibility is ensured by button semantics)
      fireEvent.click(editButton);
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTemplates[0]);
    });
  });
});
