/**
 * Tests for the App root component.
 *
 * The App component is the top-level orchestrator. It manages:
 * - File loading (PDFUploader → pdfEditorService.loadPDF)
 * - Password prompt flow for encrypted PDFs
 * - Save / Save As / Print / New actions via the MenuBar
 * - Conditional rendering: upload screen vs. PDF viewer
 *
 * Testing approach:
 * - We mock `pdfEditorService` to avoid real PDF processing.
 * - We mock the lazy-loaded `PDFViewer` because it's a heavy component that
 *   depends on pdfjs-dist (which doesn't work in jsdom).
 * - We test the integration between components: uploading → viewing, errors, etc.
 *
 * Why mock the service and viewer?
 * The service tests (pdfEditor.test.ts) already verify the PDF logic with real
 * pdf-lib documents. Here in App tests, we verify the UI orchestration — that
 * the correct screens appear, buttons trigger the right service calls, and
 * errors are displayed. We don't need real PDFs for that.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the pdfEditorService module
vi.mock("@/services/pdfEditor", () => ({
  pdfEditorService: {
    loadPDF: vi.fn(),
    downloadPDF: vi.fn(),
    savePDF: vi.fn(),
    reset: vi.fn(),
  },
}));

// Mock the PDFViewer lazy import (heavy component with canvas/pdfjs)
vi.mock("@/components/PDFViewer", () => ({
  default: () => <div data-testid="pdf-viewer">Mock PDF Viewer</div>,
}));

// Import AFTER mocking so the mocks take effect
import App from "@/App";
import { pdfEditorService } from "@/services/pdfEditor";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementations to their defaults
    vi.mocked(pdfEditorService.loadPDF).mockResolvedValue(undefined);
    vi.mocked(pdfEditorService.downloadPDF).mockResolvedValue(undefined);
    vi.mocked(pdfEditorService.savePDF).mockResolvedValue(new Uint8Array());
  });

  describe("initial render", () => {
    it("should render the app title", () => {
      render(<App />);

      expect(screen.getByText("PDF Editor")).toBeInTheDocument();
    });

    it("should render the subtitle", () => {
      render(<App />);

      expect(
        screen.getByText(/securely edit, sign, and annotate/i),
      ).toBeInTheDocument();
    });

    it("should show the upload area when no file is loaded", () => {
      render(<App />);

      expect(screen.getByText("Upload Document")).toBeInTheDocument();
    });

    it("should NOT show the PDF viewer initially", () => {
      render(<App />);

      expect(screen.queryByTestId("pdf-viewer")).not.toBeInTheDocument();
    });
  });

  describe("file upload flow", () => {
    it("should show PDF viewer after successful file upload", async () => {
      const user = userEvent.setup();
      render(<App />);

      const file = new File(["pdf content"], "test.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByTestId("pdf-upload-input");

      await user.upload(input, file);

      // Wait for the async loadPDF + lazy PDFViewer to resolve
      await waitFor(() => {
        expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
      });

      // Upload area should be hidden once a file is loaded
      expect(screen.queryByText("Upload Document")).not.toBeInTheDocument();
    });

    it("should call pdfEditorService.loadPDF with the uploaded file", async () => {
      const user = userEvent.setup();
      render(<App />);

      const file = new File(["pdf content"], "report.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByTestId("pdf-upload-input");

      await user.upload(input, file);

      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(file, undefined);
      });
    });
  });

  describe("password-protected PDF flow", () => {
    it("should show password prompt when PDF requires a password", async () => {
      const user = userEvent.setup();

      // First call fails with password required
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      render(<App />);

      const file = new File(["encrypted pdf"], "secret.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByTestId("pdf-upload-input");

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText("Protected PDF")).toBeInTheDocument();
      });
    });

    it("should load PDF with password after prompt submission", async () => {
      const user = userEvent.setup();

      // First call (no password) → fails; second call (with password) → succeeds
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      render(<App />);

      const file = new File(["encrypted pdf"], "secret.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByTestId("pdf-upload-input");

      await user.upload(input, file);

      // Wait for password prompt to appear
      await waitFor(() => {
        expect(screen.getByText("Protected PDF")).toBeInTheDocument();
      });

      // Enter password and submit
      await user.type(screen.getByPlaceholderText("Enter password"), "mypassword");
      await user.click(screen.getByRole("button", { name: /unlock document/i }));

      // Should call loadPDF again with the password
      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(
          file,
          "mypassword",
        );
      });
    });
  });

  describe("error handling", () => {
    it("should display error message when PDF loading fails", async () => {
      const user = userEvent.setup();

      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("Something went wrong"),
      );

      render(<App />);

      const file = new File(["bad pdf"], "broken.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByTestId("pdf-upload-input");

      await user.upload(input, file);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to load pdf/i),
        ).toBeInTheDocument();
      });
    });

    it("should show specific error for invalid PDF structure", async () => {
      const user = userEvent.setup();

      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("Invalid object ref at position 123"),
      );

      render(<App />);

      const file = new File(["invalid"], "corrupted.pdf", {
        type: "application/pdf",
      });
      const input = screen.getByTestId("pdf-upload-input");

      await user.upload(input, file);

      await waitFor(() => {
        expect(
          screen.getByText(/pdf file structure is invalid/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("MenuBar actions", () => {
    it("should call reset and show uploader when New is clicked", async () => {
      const user = userEvent.setup();

      // Mock window.confirm to return true
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<App />);

      // First upload a file so we're in the "viewer" state
      const file = new File(["pdf"], "test.pdf", { type: "application/pdf" });
      await user.upload(screen.getByTestId("pdf-upload-input"), file);

      await waitFor(() => {
        expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
      });

      // Click New
      await user.click(screen.getByTitle("New document"));

      expect(window.confirm).toHaveBeenCalled();
      expect(pdfEditorService.reset).toHaveBeenCalled();

      // Should show the uploader again
      await waitFor(() => {
        expect(screen.getByText("Upload Document")).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });

    it("should call downloadPDF when Save is clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Upload a file
      const file = new File(["pdf"], "report.pdf", { type: "application/pdf" });
      await user.upload(screen.getByTestId("pdf-upload-input"), file);

      await waitFor(() => {
        expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
      });

      // Click Save
      await user.click(screen.getByTitle("Save (download)"));

      await waitFor(() => {
        expect(pdfEditorService.downloadPDF).toHaveBeenCalledWith("report.pdf");
      });
    });
  });
});
