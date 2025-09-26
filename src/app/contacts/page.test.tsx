import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ContactsPage from "./page";
import { Contact } from "@prisma/client";

// --- ROBUST MOCK SETUP ---
// This new syntax ensures that the named exports are correctly mocked.
jest.mock("./components/ContactsTable", () => ({
  __esModule: true, // This is important for ES Modules
  ContactsTable: jest.fn(({ contacts, onEdit, onDelete, onArchive }) => (
    <div>
      <span>Mock Contacts Table</span>
      {contacts.map((contact: Contact) => (
        <div key={contact.id}>
          <span>{contact.firstName}</span>
          <button onClick={() => onEdit(contact)}>Edit-{contact.id}</button>
          <button onClick={() => onDelete(contact.id)}>
            Delete-{contact.id}
          </button>
          <button onClick={() => onArchive(contact.id, !contact.archived)}>
            Archive-{contact.id}
          </button>
        </div>
      ))}
    </div>
  )),
}));

jest.mock("./components/AddContactModal", () => ({
  __esModule: true,
  AddContactModal: jest.fn(() => <div>Mock Add Modal</div>),
}));

jest.mock("./components/EditContactModal", () => ({
  __esModule: true,
  EditContactModal: jest.fn(({ contact }) => (
    <div>Mock Edit Modal for {contact.firstName}</div>
  )),
}));

jest.mock("./components/ImportCSVModal", () => ({
  __esModule: true,
  ImportCSVModal: jest.fn(() => <div>Mock Import Modal</div>),
}));
// --- END OF MOCK SETUP ---

// Mock data
const mockContacts: Contact[] = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com",
    company: "Innovate",
    tags: ["Recruiter"],
    archived: false,
    createdAt: new Date(),
  },
];

// Mock window.confirm
jest.spyOn(window, "confirm").mockImplementation(() => true);

// A more robust fetch mock
let deletedContactIds: number[] = [];

global.fetch = jest.fn((url, options) => {
  if (
    url.toString().includes("/api/contacts/") &&
    options?.method === "DELETE"
  ) {
    const contactId = parseInt(url.toString().split("/").pop() || "0");
    deletedContactIds.push(contactId);
    return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
  }
  if (
    url.toString().endsWith("/api/contacts") &&
    options?.method !== "DELETE"
  ) {
    // Return contacts excluding deleted ones
    const remainingContacts = mockContacts.filter(
      (contact) => !deletedContactIds.includes(contact.id)
    );
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(remainingContacts),
    });
  }
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error: `Unhandled request: ${url}` }),
  });
}) as jest.Mock;

describe("ContactsPage", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    (window.confirm as jest.Mock).mockClear();
    deletedContactIds = []; // Reset deleted contacts list
  });

  it("should show a loading state initially and then render the contacts table", async () => {
    render(<ContactsPage />);
    expect(screen.getByText(/Loading contacts.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mock Contacts Table")).toBeInTheDocument();
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText(/Loading contacts.../i)).not.toBeInTheDocument();
  });

  it("should open the Add Contact modal when the button is clicked", async () => {
    render(<ContactsPage />);
    await waitFor(() =>
      expect(screen.getByText("Mock Contacts Table")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Add Contact/i }));

    await waitFor(() => {
      expect(screen.getByText("Mock Add Modal")).toBeInTheDocument();
    });
  });

  it("should open the Edit Contact modal when an edit button is clicked", async () => {
    render(<ContactsPage />);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Edit-1" }));

    await waitFor(() => {
      expect(screen.getByText("Mock Edit Modal for Alice")).toBeInTheDocument();
    });
  });

  it("should call the DELETE API and remove the contact from the list when delete is confirmed", async () => {
    render(<ContactsPage />);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());

    expect(screen.getByText("Alice")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: "Delete-1" });

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/contacts/1", {
      method: "DELETE",
    });

    await waitFor(() => {
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });
  });
});
