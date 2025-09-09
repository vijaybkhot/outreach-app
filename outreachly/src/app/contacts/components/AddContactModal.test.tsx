// src/app/contacts/components/AddContactModal.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddContactModal } from "./AddContactModal";

// Mock the global fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 1, firstName: "John" }),
  })
) as jest.Mock;

describe("AddContactModal", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    jest.clearAllMocks();
  });

  it("should render the form and submit data correctly", async () => {
    // Arrange: Mock the callback functions
    const mockOnClose = jest.fn();
    const mockOnContactAdded = jest.fn();

    render(
      <AddContactModal
        isOpen={true}
        onClose={mockOnClose}
        onContactAdded={mockOnContactAdded}
      />
    );

    // Act: Simulate a user filling out the form
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Contact/i }));

    // Assert: Check if the API was called and callbacks were triggered
    await waitFor(() => {
      // Check if fetch was called with the correct data
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contacts",
        expect.any(Object)
      );
      // Check if the success callbacks were called
      expect(mockOnContactAdded).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
  it("should prevent submission if required fields are empty", async () => {
    // Arrange
    const mockOnClose = jest.fn();
    const mockOnContactAdded = jest.fn();
    render(
      <AddContactModal
        isOpen={true}
        onClose={mockOnClose}
        onContactAdded={mockOnContactAdded}
      />
    );

    // Act: Click the save button immediately without filling the form
    const saveButton = screen.getByRole("button", { name: /Save Contact/i });
    fireEvent.click(saveButton);

    // Assert: Check that the API was NOT called
    // We wait briefly to ensure no async operations are pending
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });

    expect(mockOnContactAdded).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  it("should handle API errors gracefully", async () => {
    // Arrange: Override the global fetch mock for just this test to simulate an error
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    );

    // Mock window.alert
    jest.spyOn(window, "alert").mockImplementation(() => {});

    const mockOnClose = jest.fn();
    const mockOnContactAdded = jest.fn();
    render(
      <AddContactModal
        isOpen={true}
        onClose={mockOnClose}
        onContactAdded={mockOnContactAdded}
      />
    );

    // Act
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Contact/i }));

    // Assert
    await waitFor(() => {
      // Check that the alert was called with an error message
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("Error adding contact")
      );
      // Check that the modal did NOT close on failure
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
