import { render, screen, fireEvent } from "@testing-library/react";
import { ContactsTable } from "./ContactsTable";
import { Contact } from "../page";

// Mock data for our tests, including a contact with null values
const mockContacts: Contact[] = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    company: "Innovate LLC",
    tags: ["Recruiter"],
  },
  {
    id: 2,
    firstName: "Bob",
    lastName: null,
    email: "bob@example.com",
    company: "Tech Corp",
    tags: ["Engineer"],
  },
  {
    id: 3,
    firstName: "Charlie",
    lastName: "Davis",
    email: "charlie@example.com",
    company: null,
    tags: ["Hiring Manager"],
  },
];

describe("ContactsTable", () => {
  // Mock handler functions
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it("should render all contacts when the search term is empty", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Check if all three contacts are rendered
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument(); // Checks for first name
    expect(screen.getByText("Charlie Davis")).toBeInTheDocument();
  });

  it('should display a "No contacts found" message when there are no contacts', () => {
    render(
      <ContactsTable
        contacts={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText("No contacts found.")).toBeInTheDocument();
  });

  it("should filter contacts by first name", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    const searchInput = screen.getByPlaceholderText("Search contacts...");

    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("should filter contacts by company, including those with null values", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    const searchInput = screen.getByPlaceholderText("Search contacts...");

    fireEvent.change(searchInput, { target: { value: "Tech Corp" } });

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument();
  });

  it("should call onEdit with the correct contact when the edit button is clicked", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Find the edit button in the row for Alice Johnson
    const aliceRow = screen.getByText("Alice Johnson").closest("tr");
    const editButton = aliceRow!.querySelector("button:nth-of-type(1)"); // The first button is Edit

    fireEvent.click(editButton!);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockContacts[0]); // Check it was called with Alice's data
  });

  it("should call onDelete with the correct contact ID when the delete button is clicked", () => {
    render(
      <ContactsTable
        contacts={mockContacts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const bobRow = screen.getByText("Bob").closest("tr");
    const deleteButton = bobRow!.querySelector("button:nth-of-type(2)"); // The second button is Delete

    fireEvent.click(deleteButton!);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(2); // Check it was called with Bob's ID (2)
  });
});
