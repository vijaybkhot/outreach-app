import { render, screen, fireEvent } from "@testing-library/react";
import { ContactsTable } from "./ContactsTable";
import { Contact } from "@prisma/client";

// Mock data for our tests, including a contact with null values
const mockContacts: Contact[] = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    company: "Innovate LLC",
    tags: ["Recruiter"],
    archived: false,
    createdAt: new Date(),
  },
  {
    id: 2,
    firstName: "Bob",
    lastName: null,
    email: "bob@example.com",
    company: "Tech Corp",
    tags: ["Engineer"],
    archived: false,
    createdAt: new Date(),
  },
  {
    id: 3,
    firstName: "Charlie",
    lastName: "Davis",
    email: "charlie@example.com",
    company: null,
    tags: ["Hiring Manager"],
    archived: true,
    createdAt: new Date(),
  },
];

describe("ContactsTable", () => {
  // Mock handler functions
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnArchive = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
    mockOnArchive.mockClear();
  });

  it("should render all contacts", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    // Check if contacts are rendered (using more flexible matchers)
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument(); // Only first name since lastName is null
    expect(screen.getByText("Charlie Davis")).toBeInTheDocument();
  });

  it('should display a "No contacts found" message when there are no contacts', () => {
    render(
      <ContactsTable
        contacts={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );
    expect(screen.getByText("No contacts found.")).toBeInTheDocument();
  });

  it("should call onEdit with the correct contact when the edit button is clicked", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    // Find the edit button by title attribute
    const editButtons = screen.getAllByTitle("Edit contact");
    fireEvent.click(editButtons[0]); // Click the first edit button (Alice's)

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockContacts[0]); // Check it was called with Alice's data
  });

  it("should call onDelete with the correct contact ID when the delete button is clicked", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    // Find the delete button by title attribute
    const deleteButtons = screen.getAllByTitle("Delete contact");
    fireEvent.click(deleteButtons[1]); // Click the second delete button (Bob's)

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(2); // Check it was called with Bob's ID (2)
  });

  it("should call onArchive with the correct parameters when archive button is clicked", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    // Find the archive button by title attribute
    const archiveButtons = screen.getAllByTitle("Archive contact");
    fireEvent.click(archiveButtons[0]); // Click the first archive button (Alice's)

    expect(mockOnArchive).toHaveBeenCalledTimes(1);
    expect(mockOnArchive).toHaveBeenCalledWith(1, true); // Archive Alice (id: 1, archived: true)
  });

  it("should show restore button for archived contacts", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onArchive={mockOnArchive}
      />
    );

    // Charlie is archived, so should show restore button
    expect(screen.getByTitle("Restore contact")).toBeInTheDocument();
  });
});
