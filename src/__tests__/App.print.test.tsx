import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { pdfEditorService } from "@/services/pdfEditor";

// Mock pdfjs-dist
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn(() =>
        Promise.resolve({
          getViewport: vi.fn(() => ({
            width: 612,
            height: 792,
            scale: 1,
          })),
          render: vi.fn(() => ({
            promise: Promise.resolve(),
          })),
          getAnnotations: vi.fn(() => Promise.resolve([])),
        }),
      ),
    }),
  })),
}));

// Mock pdfEditor service
vi.mock("@/services/pdfEditor", () => ({
  pdfEditorService: {
    loadPDF: vi.fn(),
    fillFormField: vi.fn(),
    addText: vi.fn(),
    addImage: vi.fn(),
    getPassword: vi.fn(() => undefined),
    savePDF: vi.fn(() =>
      Promise.resolve(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55])),
    ), // %PDF-1.7
    downloadPDF: vi.fn(),
    reset: vi.fn(),
  },
}));

// Mock ThemeContext
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("App - Print Functionality", () => {
  let mockIframe: HTMLIFrameElement;
  let mockPrint: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL as any;
    window.URL.revokeObjectURL = mockRevokeObjectURL as any;

    // Mock iframe creation
    mockPrint = vi.fn();
    mockIframe = {
      style: {
        position: "",
        right: "",
        bottom: "",
        width: "",
        height: "",
        border: "",
      },
      src: "",
      onload: null,
      parentNode: null,
      contentWindow: {
        print: mockPrint,
      } as any,
    } as HTMLIFrameElement;

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      (tagName: string) => {
        if (tagName === "iframe") {
          return mockIframe;
        }
        return originalCreateElement(tagName);
      },
    );

    vi.spyOn(document.body, "appendChild");
    vi.spyOn(document.body, "removeChild");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Print Button Availability", () => {
    it("should show print button in MenuBar", async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeInTheDocument();
      });
    });

    it("should disable print button when no document is loaded", async () => {
      render(<App />);

      await waitFor(() => {
        const printButton = screen.getByTitle("Print PDF");
        expect(printButton).toBeDisabled();
      });
    });

    it("should enable print button when document is loaded", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const printButton = screen.getByTitle("Print PDF");
        expect(printButton).toBeEnabled();
      });
    });
  });

  describe("Print Functionality", () => {
    it("should call savePDF and create blob when print button is clicked", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      const printButton = screen.getByTitle("Print PDF");
      fireEvent.click(printButton);

      await waitFor(() => {
        // Verify savePDF was called
        expect(pdfEditorService.savePDF).toHaveBeenCalled();

        // Verify blob URL was created
        expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      });
    });

    it("should handle print with annotations applied", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);
      const mockPdfWithAnnotations = new Uint8Array([
        37, 80, 68, 70, 45, 49, 46, 55, 10, 37, 226, 227, 207, 211,
      ]);
      vi.mocked(pdfEditorService.savePDF).mockResolvedValueOnce(
        mockPdfWithAnnotations,
      );

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      const printButton = screen.getByTitle("Print PDF");
      fireEvent.click(printButton);

      await waitFor(() => {
        expect(pdfEditorService.savePDF).toHaveBeenCalled();
      });
    });
  });

  describe("Print Error Handling", () => {
    it("should show alert when savePDF throws error", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);
      vi.mocked(pdfEditorService.savePDF).mockImplementationOnce(() => {
        throw new Error("Failed to save PDF");
      });

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      const printButton = screen.getByTitle("Print PDF");
      fireEvent.click(printButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error printing PDF:",
          expect.any(Error),
        );
        expect(alertSpy).toHaveBeenCalledWith("Failed to print PDF");
      });

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe("Print Button Integration", () => {
    it("should work alongside save and export buttons", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      // Verify all buttons are present and enabled
      expect(screen.getByText("Save")).toBeEnabled();
      expect(screen.getByTitle("Print PDF")).toBeEnabled();
      expect(screen.getByText("Export")).toBeEnabled();
    });

    it("should maintain print button state after save operation", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);
      vi.mocked(pdfEditorService.downloadPDF).mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      // Click save button
      const saveButton = screen.getByText("Save");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(pdfEditorService.downloadPDF).toHaveBeenCalled();
      });

      // Print button should still be enabled
      expect(screen.getByTitle("Print PDF")).toBeEnabled();
    });

    it("should call savePDF for each print request", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      const printButton = screen.getByTitle("Print PDF");

      // Reset mock call count
      vi.mocked(pdfEditorService.savePDF).mockClear();

      // Click print button twice
      fireEvent.click(printButton);
      await waitFor(() => {
        expect(pdfEditorService.savePDF).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(printButton);
      await waitFor(() => {
        expect(pdfEditorService.savePDF).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Print with Different Document States", () => {
    it("should print newly loaded document", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      // Reset mock to count from here
      vi.mocked(pdfEditorService.savePDF).mockClear();

      fireEvent.click(screen.getByTitle("Print PDF"));

      await waitFor(() => {
        expect(pdfEditorService.savePDF).toHaveBeenCalledTimes(1);
      });
    });

    it("should disable print after starting new document", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValueOnce(undefined);
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<App />);

      const file = new File([new Uint8Array([37, 80, 68, 70])], "test.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeEnabled();
      });

      // Click New button
      const newButton = screen.getByText("New");
      fireEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByTitle("Print PDF")).toBeDisabled();
      });

      confirmSpy.mockRestore();
    });
  });
});
