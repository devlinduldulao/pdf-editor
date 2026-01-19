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
vi.mock("@/services/pdfEditor", () => {
  const mockService = {
    loadPDF: vi.fn(),
    fillFormField: vi.fn(),
    addText: vi.fn(),
    addImage: vi.fn(),
    getPassword: vi.fn(() => undefined),
    savePDF: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
  };

  return {
    pdfEditorService: mockService,
  };
});

// Mock ThemeContext
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * Note: These tests verify password-protected PDF handling using browser prompt().
 * The current implementation uses window.prompt() and window.alert() which are mocked here.
 */
describe("App - Password Protected PDF Features", () => {
  let originalPrompt: typeof window.prompt;
  let originalAlert: typeof window.alert;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original functions
    originalPrompt = window.prompt;
    originalAlert = window.alert;
    // Mock by default to avoid hanging tests
    window.prompt = vi.fn(() => null);
    window.alert = vi.fn();
  });

  afterEach(() => {
    // Restore original functions
    window.prompt = originalPrompt;
    window.alert = originalAlert;
  });

  describe("Password Prompt Flow", () => {
    it("should call prompt when encrypted PDF is uploaded", async () => {
      // Mock loadPDF to throw password required error
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValue(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      // Mock prompt to return null (user cancelled)
      window.prompt = vi.fn(() => null);

      render(<App />);

      // Create encrypted PDF file
      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      // Find file input and upload
      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for loadPDF to be called
      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalled();
      });

      // Prompt should be called after password error
      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalledWith(
          expect.stringContaining("password-protected"),
        );
      });
    });

    it("should load PDF after correct password is entered", async () => {
      // First call: throw password required
      // Second call: succeed with password
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      // Mock prompt to return a password
      window.prompt = vi.fn(() => "testpassword");

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for PDF to be loaded
      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(2);
      });

      // loadPDF should be called with password on second call
      expect(pdfEditorService.loadPDF).toHaveBeenLastCalledWith(
        encryptedFile,
        "testpassword",
      );
    });

    it("should show alert for wrong password", async () => {
      // All calls throw password required (simulating wrong password)
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValue(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      // First prompt returns password, second returns null (user cancelled)
      let callCount = 0;
      window.prompt = vi.fn(() => {
        callCount++;
        return callCount === 1 ? "wrongpassword" : null;
      });

      window.alert = vi.fn();

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for alert to be called
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining("Incorrect password"),
        );
      });

      // Should prompt for retry
      expect(window.prompt).toHaveBeenCalledTimes(2);
    });

    it("should allow user to cancel password prompt", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValue(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      // Mock prompt to return null (user cancelled)
      window.prompt = vi.fn(() => null);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for prompt to be called
      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalled();
      });

      // loadPDF should only be called once (initial attempt)
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(1);

      // PDF should not be loaded (no file shown)
      expect(screen.queryByTestId("pdf-canvas-page-1")).not.toBeInTheDocument();
    });
  });

  describe("Unencrypted PDF", () => {
    it("should load unencrypted PDF without prompting for password", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockResolvedValue(undefined);

      window.prompt = vi.fn();

      render(<App />);

      const normalFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "normal.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [normalFile] } });

      // Wait for PDF to be loaded
      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(1);
      });

      // Prompt should not be called for unencrypted PDF
      expect(window.prompt).not.toHaveBeenCalled();
    });
  });

  describe("Password Retry Logic", () => {
    it("should allow multiple password attempts", async () => {
      // All calls fail
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValue(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      // Return passwords for both prompts
      window.prompt = vi
        .fn()
        .mockReturnValueOnce("wrong1")
        .mockReturnValueOnce("wrong2");

      window.alert = vi.fn();

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for all attempts
      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(3);
      });

      // Should prompt twice for retry
      expect(window.prompt).toHaveBeenCalledTimes(2);

      // Should show alerts for wrong passwords
      expect(window.alert).toHaveBeenCalled();
    });

    it("should stop after two failed attempts", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValue(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      // Provide passwords for both retry attempts
      window.prompt = vi
        .fn()
        .mockReturnValueOnce("wrong1")
        .mockReturnValueOnce("wrong2");

      window.alert = vi.fn();

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for final alert
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          "Failed to open PDF: Incorrect password",
        );
      });

      // Should only prompt twice (not infinite loop)
      expect(window.prompt).toHaveBeenCalledTimes(2);

      // Should attempt load 3 times total (initial + 2 retries)
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(3);
    });
  });

  describe("Security and Edge Cases", () => {
    it("should handle empty password gracefully", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValue(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      // Return empty string (treated as cancelled)
      window.prompt = vi.fn(() => "");

      window.alert = vi.fn();

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for prompt to be called
      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalled();
      });

      // Empty string is treated as cancelled, so loadPDF should only be called once (initial)
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(1);
    });

    it("should handle special characters in password", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      const specialPassword = "p@$$w0rd!#%&*";
      window.prompt = vi.fn(() => specialPassword);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(
          encryptedFile,
          specialPassword,
        );
      });
    });

    it("should handle long passwords", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      const longPassword = "a".repeat(100);
      window.prompt = vi.fn(() => longPassword);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(
          encryptedFile,
          longPassword,
        );
      });
    });
  });

  describe("Integration with File Upload", () => {
    it("should handle password protected PDF in normal upload flow", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      window.prompt = vi.fn(() => "correctpassword");

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Should successfully load after password
      await waitFor(() => {
        expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(2);
      });

      // Verify final call had password
      expect(pdfEditorService.loadPDF).toHaveBeenLastCalledWith(
        encryptedFile,
        "correctpassword",
      );
    });
  });
});
