import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { ImportCSVModal } from "./ImportCSVModal";

// Mock the global fetch function
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({ message: "Successfully imported 1 contacts." }),
  })
) as jest.Mock;

// Mock the papaparse library
jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));
import Papa from "papaparse";

describe("ImportCSVModal", () => {
  const mockOnClose = jest.fn();
  const mockOnImportSuccess = jest.fn();

  beforeEach(() => {
    // Reset all mocks before each test
    (global.fetch as jest.Mock).mockClear();
    (Papa.parse as jest.Mock).mockClear();
    mockOnClose.mockClear();
    mockOnImportSuccess.mockClear();
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("should render the modal correctly when open", () => {
    render(
      <ImportCSVModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );
    expect(screen.getByText("Import Contacts from CSV")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import/i })).toBeDisabled();
  });

  it("should enable the import button only after a file is selected", () => {
    render(
      <ImportCSVModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );

    const fileInput = screen.getByLabelText(/upload a csv file/i);
    const mockFile = new File([""], "test.csv", { type: "text/csv" });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByRole("button", { name: /Import/i })).toBeEnabled();
  });

  it("should parse the file and call the API on successful import", async () => {
    render(
      <ImportCSVModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );

    // Simulate successful parsing
    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.complete({ data: [{ firstName: "John", email: "john@doe.com" }] });
    });

    const fileInput = screen.getByLabelText(/upload a csv file/i);
    const mockFile = new File(
      ["firstName,email\nJohn,john@doe.com"],
      "test.csv",
      { type: "text/csv" }
    );

    // Simulate user selecting a file and clicking import
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.click(screen.getByRole("button", { name: /Import/i }));

    await waitFor(() => {
      expect(Papa.parse).toHaveBeenCalledWith(mockFile, expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contacts/upload",
        expect.any(Object)
      );
      expect(mockOnImportSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should show an alert if the CSV parsing fails", async () => {
    render(
      <ImportCSVModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );

    // Simulate a parsing error
    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.error(new Error("CSV parse error"));
    });

    const fileInput = screen.getByLabelText(/upload a csv file/i);
    const mockFile = new File(["invalid csv"], "test.csv", {
      type: "text/csv",
    });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.click(screen.getByRole("button", { name: /Import/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error parsing CSV: CSV parse error"
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("should show an alert if the API call fails", async () => {
    // Simulate a failed API call
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Server validation failed" }),
      })
    );

    render(
      <ImportCSVModal
        isOpen={true}
        onClose={mockOnClose}
        onImportSuccess={mockOnImportSuccess}
      />
    );

    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.complete({ data: [{ firstName: "John", email: "john@doe.com" }] });
    });

    const fileInput = screen.getByLabelText(/upload a csv file/i);
    const mockFile = new File(
      ["firstName,email\nJohn,john@doe.com"],
      "test.csv",
      { type: "text/csv" }
    );

    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    fireEvent.click(screen.getByRole("button", { name: /Import/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Error importing contacts: Server validation failed"
      );
      expect(mockOnImportSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
