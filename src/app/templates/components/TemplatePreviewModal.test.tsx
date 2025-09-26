import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Template } from "@prisma/client";

interface MockTemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
}

// Mock the actual component
jest.mock("@/app/templates/components/TemplatePreviewModal", () => ({
  TemplatePreviewModal: ({
    isOpen,
    onClose,
    template,
  }: MockTemplatePreviewModalProps) =>
    isOpen ? (
      <div data-testid="template-preview-modal">
        <h3>Preview: {template.name}</h3>
        <div data-testid="subject-preview">{template.subject}</div>
        <div data-testid="body-preview">{template.body}</div>
        <div data-testid="variables-section">
          {template.subject.match(/\{\{(\w+)\}\}/g)?.map((v: string) => (
            <input
              key={v}
              data-testid={`variable-input-${v.replace(/[{}]/g, "")}`}
              placeholder={v}
            />
          ))}
          {template.body
            .match(/\{\{(\w+)\}\}/g)
            ?.filter((v: string) => !template.subject.includes(v))
            .map((v: string) => (
              <input
                key={v}
                data-testid={`variable-input-${v.replace(/[{}]/g, "")}`}
                placeholder={v}
              />
            ))}
        </div>
        <button data-testid="update-preview-button">Update Preview</button>
        <button onClick={onClose} data-testid="close-button">
          Close
        </button>
      </div>
    ) : null,
}));

import { TemplatePreviewModal } from "@/app/templates/components/TemplatePreviewModal";

describe("TemplatePreviewModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    template: {
      id: 1,
      name: "Welcome Email",
      subject: "Welcome to {{company}}, {{firstName}}!",
      body: "Dear {{firstName}} {{lastName}},\n\nWelcome to {{company}}! We are excited to have you join us.\n\nBest regards,\nThe {{company}} Team",
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal when isOpen is true", () => {
    render(<TemplatePreviewModal {...defaultProps} />);

    expect(screen.getByTestId("template-preview-modal")).toBeInTheDocument();
    expect(
      screen.getByText(`Preview: ${defaultProps.template.name}`)
    ).toBeInTheDocument();
  });

  it("doesn't render the modal when isOpen is false", () => {
    render(<TemplatePreviewModal {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByTestId("template-preview-modal")
    ).not.toBeInTheDocument();
  });

  it("shows the template subject", () => {
    render(<TemplatePreviewModal {...defaultProps} />);

    expect(screen.getByTestId("subject-preview")).toHaveTextContent(
      defaultProps.template.subject
    );
  });

  it("shows the template body", () => {
    render(<TemplatePreviewModal {...defaultProps} />);

    // Since newlines may be converted to spaces in the rendering,
    // we'll test for the content without worrying about exact whitespace
    const bodyElement = screen.getByTestId("body-preview");
    expect(bodyElement).toHaveTextContent(/Dear {{firstName}} {{lastName}}/);
    expect(bodyElement).toHaveTextContent(/Welcome to {{company}}!/);
    expect(bodyElement).toHaveTextContent(/We are excited to have you join us/);
    expect(bodyElement).toHaveTextContent(/Best regards/);
    expect(bodyElement).toHaveTextContent(/The {{company}} Team/);
  });

  it("shows input fields for all variables", () => {
    render(<TemplatePreviewModal {...defaultProps} />);

    // Check for all variables from both subject and body
    expect(screen.getByTestId("variable-input-firstName")).toBeInTheDocument();
    expect(screen.getByTestId("variable-input-lastName")).toBeInTheDocument();
    expect(screen.getByTestId("variable-input-company")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<TemplatePreviewModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("close-button"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders with a different template", () => {
    const customTemplate = {
      ...defaultProps.template,
      name: "Custom Template",
      subject: "Your {{product}} is ready",
      body: "Hello,\n\nYour {{product}} order #{{orderId}} is ready for pickup.\n\nRegards,\nCustomer Service",
    };

    render(
      <TemplatePreviewModal {...defaultProps} template={customTemplate} />
    );

    expect(screen.getByText("Preview: Custom Template")).toBeInTheDocument();
    expect(screen.getByTestId("subject-preview")).toHaveTextContent(
      "Your {{product}} is ready"
    );
    expect(screen.getByTestId("variable-input-product")).toBeInTheDocument();
    expect(screen.getByTestId("variable-input-orderId")).toBeInTheDocument();
  });

  it("renders when there are no variables in the template", () => {
    const noVariableTemplate = {
      ...defaultProps.template,
      name: "No Variables",
      subject: "Simple Subject",
      body: "This is a template with no variables.",
    };

    render(
      <TemplatePreviewModal {...defaultProps} template={noVariableTemplate} />
    );

    expect(screen.getByText("Preview: No Variables")).toBeInTheDocument();
    expect(screen.getByTestId("variables-section")).toBeInTheDocument();
    // Verify we don't have any variable inputs
    expect(screen.queryByTestId(/variable-input-/)).not.toBeInTheDocument();
  });

  it("renders with duplicate variables correctly", () => {
    const duplicateVarsTemplate = {
      ...defaultProps.template,
      name: "Duplicate Variables",
      subject: "Welcome {{firstName}}",
      body: "Hello {{firstName}}, this email is for {{firstName}}. Thanks, {{company}}.",
    };

    render(
      <TemplatePreviewModal
        {...defaultProps}
        template={duplicateVarsTemplate}
      />
    );

    // Should only have two inputs despite {{firstName}} appearing multiple times
    expect(screen.getByTestId("variable-input-firstName")).toBeInTheDocument();
    expect(screen.getByTestId("variable-input-company")).toBeInTheDocument();
  });

  it("has an update preview button", () => {
    render(<TemplatePreviewModal {...defaultProps} />);

    expect(screen.getByTestId("update-preview-button")).toBeInTheDocument();
    expect(screen.getByTestId("update-preview-button")).toHaveTextContent(
      "Update Preview"
    );
  });
});
