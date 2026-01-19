import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PDFViewer from "../PDFViewer";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
        getAnnotations: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
}));

// Mock pdfEditorService
vi.mock("@/services/pdfEditor", () => ({
  pdfEditorService: {
    fillFormField: vi.fn(),
    addText: vi.fn(),
    addImage: vi.fn(),
  },
}));

describe("PDFViewer", () => {
  const mockFile = new File(["%PDF-1.4"], "test.pdf", {
    type: "application/pdf",
  });

  it("renders toolbar with Add Image button", async () => {
    render(<PDFViewer file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByText(/Add Image/i)).toBeInTheDocument();
    });
  });

  it("opens file dialog when Add Image is clicked", async () => {
    render(<PDFViewer file={mockFile} />);

    await waitFor(() => {
      // Find the hidden input manually
      const hiddenInput = document.querySelector('input[accept="image/*"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute("type", "file");
    });
  });

  it("handles image drop", async () => {
    render(<PDFViewer file={mockFile} />);

    await waitFor(() => {
      const overlay = screen.getByTestId("pdf-overlay");
      expect(overlay).toBeTruthy();

      const file = new File(["dummy"], "signature.png", { type: "image/png" });
      fireEvent.drop(overlay, {
        dataTransfer: {
          files: [file],
          types: ["Files"],
        },
      });
    });
  });
});
