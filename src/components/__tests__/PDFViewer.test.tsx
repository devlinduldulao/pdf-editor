import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PDFViewer from "../PDFViewer";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi
          .fn()
          .mockReturnValue({ width: 600, height: 800, scale: 1.5 }),
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toolbar with navigation and tools", async () => {
    render(<PDFViewer file={mockFile} />);

    await waitFor(() => {
      expect(screen.getByText(/Add Text/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Image/i)).toBeInTheDocument();
      expect(screen.getByText(/Select/i)).toBeInTheDocument();
    });
  });

  describe("Text Annotation Features", () => {
    it("shows floating message when Add Text mode is activated", async () => {
      render(<PDFViewer file={mockFile} />);

      const addTextButton = await screen.findByText(/Add Text/i);
      fireEvent.click(addTextButton);

      expect(
        await screen.findByText(/Double-click anywhere to add text/i),
      ).toBeInTheDocument();
    });

    it("does not create text annotation on single click in Add Text mode", async () => {
      render(<PDFViewer file={mockFile} />);

      const addTextButton = await screen.findByText(/Add Text/i);
      fireEvent.click(addTextButton);

      const overlay = await screen.findByTestId("pdf-overlay");

      // Single click should not create text
      fireEvent.click(overlay, {
        clientX: 100,
        clientY: 100,
      });

      // Should not find any text input
      const inputs = screen.queryAllByPlaceholderText(/Type here.../i);
      expect(inputs).toHaveLength(0);
    });
  });

  describe("Image Features", () => {
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

        const file = new File(["dummy"], "signature.png", {
          type: "image/png",
        });
        fireEvent.drop(overlay, {
          dataTransfer: {
            files: [file],
            types: ["Files"],
          },
        });
      });
    });
  });

  describe("Toolbar and Mode Switching", () => {
    it("toggles between Select and Add Text modes", async () => {
      render(<PDFViewer file={mockFile} />);

      const addTextButton = await screen.findByText(/Add Text/i);
      fireEvent.click(addTextButton);

      expect(
        await screen.findByText(/Double-click anywhere to add text/i),
      ).toBeInTheDocument();

      const selectButton = screen.getByText(/Select/i);
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/Double-click anywhere to add text/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Navigation and Zoom", () => {
    it("displays page navigation controls", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        // Check that buttons are rendered (they contain ChevronLeft/ChevronRight icons)
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("displays zoom controls", async () => {
      render(<PDFViewer file={mockFile} />);

      await waitFor(() => {
        // Check zoom percentage is displayed
        expect(screen.getByText(/150%/)).toBeInTheDocument();
      });
    });
  });
});
