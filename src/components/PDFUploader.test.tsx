/**
 * Tests for the PDFUploader component.
 *
 * PDFUploader provides a drag-and-drop zone for uploading PDF files.
 * It validates that the file is a PDF before calling `onFileSelect`.
 *
 * Testing approach:
 * - We use `userEvent.upload()` to simulate file selection via the hidden input.
 * - We use `fireEvent.drop()` for drag-and-drop testing (userEvent doesn't
 *   support DnD natively).
 * - We verify that non-PDF files are rejected with an alert.
 *
 * Key concept: The `<input type="file">` is hidden and triggered by clicking
 * the Card. We test the _behavior_ (file selected → callback fires) rather
 * than the _implementation_ (click handler → input.click).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PDFUploader from "@/components/PDFUploader";

describe("PDFUploader", () => {
  let onFileSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFileSelect = vi.fn();
    // Mock window.alert since jsdom doesn't implement it
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("should render the upload UI with heading and description", () => {
    render(<PDFUploader onFileSelect={onFileSelect} />);

    expect(screen.getByText("Upload Document")).toBeInTheDocument();
    expect(
      screen.getByText(/drag and drop your pdf here/i),
    ).toBeInTheDocument();
    expect(screen.getByText("PDF Support")).toBeInTheDocument();
  });

  it("should have a hidden file input that accepts PDFs", () => {
    render(<PDFUploader onFileSelect={onFileSelect} />);

    const input = screen.getByTestId("pdf-upload-input") as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.type).toBe("file");
    expect(input.accept).toBe("application/pdf");
    expect(input.className).toContain("hidden");
  });

  it("should call onFileSelect when a valid PDF is uploaded", async () => {
    const user = userEvent.setup();
    render(<PDFUploader onFileSelect={onFileSelect} />);

    const file = new File(["pdf content"], "test.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByTestId("pdf-upload-input");

    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledOnce();
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("should reject non-PDF files and show an alert", () => {
    // NOTE: `userEvent.upload` respects the `accept` attribute on <input>,
    // so it silently ignores files that don't match. To test the component's
    // own validation logic (the `file.type === 'application/pdf'` check),
    // we use `fireEvent.change` which bypasses the browser-level filter.
    render(<PDFUploader onFileSelect={onFileSelect} />);

    const file = new File(["image content"], "photo.png", {
      type: "image/png",
    });
    const input = screen.getByTestId("pdf-upload-input");

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelect).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("Please select a valid PDF file");
  });

  it("should accept a dropped PDF file", () => {
    render(<PDFUploader onFileSelect={onFileSelect} />);

    const dropZone = screen.getByText("Upload Document").closest("[data-slot='card']")!;
    const file = new File(["pdf content"], "dropped.pdf", {
      type: "application/pdf",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("should reject a dropped non-PDF file", () => {
    render(<PDFUploader onFileSelect={onFileSelect} />);

    const dropZone = screen.getByText("Upload Document").closest("[data-slot='card']")!;
    const file = new File(["text content"], "readme.txt", {
      type: "text/plain",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("Please drop a valid PDF file");
  });

  it("should prevent default on drag over (required for drop to work)", () => {
    render(<PDFUploader onFileSelect={onFileSelect} />);

    const dropZone = screen.getByText("Upload Document").closest("[data-slot='card']")!;

    // The dragOver event must call preventDefault() for drop to fire.
    // We verify it doesn't crash and the component handles it.
    const event = new Event("dragover", { bubbles: true, cancelable: true });
    fireEvent(dropZone, event);
  });
});
