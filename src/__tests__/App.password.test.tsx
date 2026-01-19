import { describe, it, expect, vi, beforeEach } from "vitest";
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
    savePDF: vi.fn(() => new Uint8Array([1, 2, 3])),
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

describe("App - Password Protected PDF Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password Prompt Flow", () => {
    it("should prompt for password when encrypted PDF is uploaded", async () => {
      // Mock loadPDF to throw password required error
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

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

      // Password prompt should appear
      await waitFor(() => {
        expect(
          screen.getByText(/This PDF is password-protected/i),
        ).toBeInTheDocument();
      });

      // Should show password input
      expect(
        screen.getByPlaceholderText(/Enter password/i),
      ).toBeInTheDocument();
    });

    it("should load PDF after correct password is entered", async () => {
      // First call: throw password required
      // Second call: succeed with password
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for password prompt
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      // Enter password
      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "testpassword" } });

      // Click unlock button
      const unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      // PDF should be loaded (password dialog should close)
      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      // loadPDF should be called twice (once without password, once with)
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(2);
      expect(pdfEditorService.loadPDF).toHaveBeenLastCalledWith(
        encryptedFile,
        "testpassword",
      );
    });

    it("should show error for wrong password", async () => {
      // Both calls throw password required (simulating wrong password)
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"));

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

      const unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      // Password dialog should still be visible with error
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });
    });

    it("should allow multiple password attempts", async () => {
      // First attempt: no password (error)
      // Second attempt: wrong password (error)
      // Third attempt: correct password (success)
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for password prompt
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      // First attempt with wrong password
      let passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "wrong1" } });
      let unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      // Still showing password prompt
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      // Second attempt with correct password
      passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "correct" } });
      unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      // Password dialog should close
      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      // loadPDF should be called 3 times
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(3);
    });

    it("should allow cancelling password prompt", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      // Wait for password prompt
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      // Find and click cancel button
      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      // Password dialog should close
      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      // Should show uploader again
      expect(
        screen.getByText(/Drop your PDF here or click to browse/i),
      ).toBeInTheDocument();
    });
  });

  describe("Password Input Behavior", () => {
    it("should accept password input via Enter key", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "testpassword" } });

      // Press Enter
      fireEvent.keyDown(passwordInput, { key: "Enter", code: "Enter" });

      // Password dialog should close
      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(
        encryptedFile,
        "testpassword",
      );
    });

    it("should show password as hidden by default", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);

      // Password input should be of type "password"
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should clear password input on cancel", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "somepassword" } });

      expect(passwordInput).toHaveValue("somepassword");

      // Click cancel
      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      // Upload again and check password is cleared
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByPlaceholderText(/Enter password/i);
      expect(newPasswordInput).toHaveValue("");
    });
  });

  describe("Non-Password Errors", () => {
    it("should show error message for corrupted PDF", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("Corrupted PDF file"),
      );

      render(<App />);

      const corruptedFile = new File([new Uint8Array([1, 2, 3])], "bad.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [corruptedFile] } });

      // Should show error (not password prompt)
      await waitFor(() => {
        // The uploader should still be visible (file rejected)
        expect(
          screen.getByText(/Drop your PDF here or click to browse/i),
        ).toBeInTheDocument();
      });

      // Should NOT show password prompt
      expect(
        screen.queryByText(/This PDF is password-protected/i),
      ).not.toBeInTheDocument();
    });

    it("should distinguish between password error and other errors", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("Invalid PDF structure"),
      );

      render(<App />);

      const invalidFile = new File([new Uint8Array([1, 2, 3])], "invalid.pdf", {
        type: "application/pdf",
      });

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      // Wait for processing
      await waitFor(
        () => {
          expect(pdfEditorService.loadPDF).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );

      // Should NOT show password prompt for non-password errors
      expect(
        screen.queryByText(/This PDF is password-protected/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Password Coordination with PDFViewer", () => {
    it("should pass password to PDFViewer for rendering", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      // Mock getPassword to return the password
      vi.mocked(pdfEditorService.getPassword).mockReturnValue("testpassword");

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: "testpassword" } });

      const unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      // Wait for PDF to load
      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      // Verify getPassword can be called
      expect(pdfEditorService.getPassword()).toBe("testpassword");
    });
  });

  describe("Security and Edge Cases", () => {
    it("should handle empty password gracefully", async () => {
      vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
        new Error("PDF_PASSWORD_REQUIRED"),
      );

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      // Try to unlock with empty password
      const unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      // Should still show password prompt (not attempt to load with empty password)
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });
    });

    it("should handle special characters in password", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      // Password with special characters
      const specialPassword = "P@ssw0rd!#$%^&*()";
      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: specialPassword } });

      const unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(
        encryptedFile,
        specialPassword,
      );
    });

    it("should handle long passwords", async () => {
      vi.mocked(pdfEditorService.loadPDF)
        .mockRejectedValueOnce(new Error("PDF_PASSWORD_REQUIRED"))
        .mockResolvedValueOnce(undefined);

      render(<App />);

      const encryptedFile = new File(
        [new Uint8Array([37, 80, 68, 70])],
        "encrypted.pdf",
        { type: "application/pdf" },
      );

      const fileInput = screen.getByTestId("pdf-upload-input");
      fireEvent.change(fileInput, { target: { files: [encryptedFile] } });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Enter password/i),
        ).toBeInTheDocument();
      });

      const longPassword = "a".repeat(100);
      const passwordInput = screen.getByPlaceholderText(/Enter password/i);
      fireEvent.change(passwordInput, { target: { value: longPassword } });

      const unlockButton = screen.getByText(/Unlock/i);
      fireEvent.click(unlockButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/This PDF is password-protected/i),
        ).not.toBeInTheDocument();
      });

      expect(pdfEditorService.loadPDF).toHaveBeenCalledWith(
        encryptedFile,
        longPassword,
      );
    });
  });
});
