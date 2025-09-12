// src/app/contacts/components/EditContactModal.test.tsx
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { EditContactModal } from "./EditContactModal";
import { Contact } from "../page";

// Mock the global fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1, company: "New Company Inc." }),
  })
) as jest.Mock;

const mockContact: Contact = {
  id: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@example.com",
  company: "Old Company",
  tags: ["Recruiter"],
};

describe("EditContactModal", () => {
  let alertSpy: jest.SpyInstance; // Declare it here so it's accessible in beforeEach/afterEach

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllMocks(); // Clears all mocks, including spied on functions
    // Spy on alert and mock its implementation before each test
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore(); // Restore the original window.alert after each test
  });

  it("should render the form pre-filled with contact data", () => {
    render(
      <EditContactModal
        isOpen={true}
        onClose={jest.fn()}
        contact={mockContact}
        onContactUpdated={jest.fn()}
      />
    );

    expect(screen.getByLabelText(/First Name/i)).toHaveValue(
      mockContact.firstName
    );
    expect(screen.getByLabelText(/Email/i)).toHaveValue(mockContact.email);
    expect(screen.getByLabelText(/Company/i)).toHaveValue(mockContact.company);
  });

  it("should submit updated data correctly", async () => {
    const mockOnClose = jest.fn();
    const mockOnContactUpdated = jest.fn();
    render(
      <EditContactModal
        isOpen={true}
        onClose={mockOnClose}
        contact={mockContact}
        onContactUpdated={mockOnContactUpdated}
      />
    );

    const companyInput = screen.getByLabelText(/Company/i);
    await act(async () => {
      fireEvent.change(companyInput, { target: { value: "New Company Inc." } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/contacts/${mockContact.id}`,
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            firstName: mockContact.firstName,
            lastName: mockContact.lastName,
            email: mockContact.email,
            company: "New Company Inc.",
            tags: mockContact.tags,
          }),
        })
      );
      expect(mockOnContactUpdated).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
    // alertSpy is not called here, which is expected for a successful submission.
    // The spy is still active but not asserted for this specific test.
  });

  it("should prevent submission if a required field is cleared", async () => {
    // alertSpy is already defined and active from beforeEach
    render(
      <EditContactModal
        isOpen={true}
        onClose={jest.fn()}
        contact={mockContact}
        onContactUpdated={jest.fn()}
      />
    );

    const firstNameInput = screen.getByLabelText(/First Name/i);
    const emailInput = screen.getByLabelText(/Email/i);

    await act(async () => {
      fireEvent.change(firstNameInput, { target: { value: "" } });
      fireEvent.change(emailInput, { target: { value: "" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "First Name and Email are required fields."
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
    // No need to call alertSpy.mockRestore() here; afterEach will handle it.
  });
});
