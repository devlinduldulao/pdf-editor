import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock out heavy PDF viewer (pdfjs) for unit tests
vi.mock("../components/PDFViewer", () => ({
  default: function MockPDFViewer() {
    return <div data-testid="pdf-viewer">PDF VIEWER</div>;
  },
}));

// Mock uploader so we can trigger file selection deterministically
vi.mock("../components/PDFUploader", () => ({
  default: function MockPDFUploader(props: {
    onFileSelect: (file: File) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() =>
          props.onFileSelect(
            new File(["%PDF-1.4"], "demo.pdf", { type: "application/pdf" }),
          )
        }
      >
        Pick PDF
      </button>
    );
  },
}));

vi.mock("../services/pdfEditor", () => ({
  pdfEditorService: {
    loadPDF: vi.fn().mockResolvedValue(undefined),
    downloadPDF: vi.fn().mockResolvedValue(undefined),
    savePDF: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    reset: vi.fn(),
  },
}));

import App from "../App";
import { pdfEditorService } from "../services/pdfEditor";
import { ThemeProvider } from "../contexts/ThemeContext";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders uploader when no document loaded", () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("button", { name: /pick pdf/i }),
    ).toBeInTheDocument();
  });

  it("renders main heading and description", () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    expect(screen.getByText("PDF Editor")).toBeInTheDocument();
    expect(screen.getByText(/securely edit, sign, and annotate/i)).toBeInTheDocument();
  });

  it("loads PDF and shows viewer after selecting file", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
    });
  });

  it("shows password prompt when PDF requires password", async () => {
    vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
      new Error("PDF_PASSWORD_REQUIRED")
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(screen.getByText("Protected PDF")).toBeInTheDocument();
    });
  });

  it("closes password prompt when cancel is clicked", async () => {
    vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
      new Error("PDF_PASSWORD_REQUIRED")
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(screen.getByText("Protected PDF")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText("Protected PDF")).not.toBeInTheDocument();
    });
  });

  it("retries loading with password when submitted", async () => {
    let callCount = 0;
    vi.mocked(pdfEditorService.loadPDF).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("PDF_PASSWORD_REQUIRED");
      }
      return undefined;
    });

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(screen.getByText("Protected PDF")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter password");
    await user.type(passwordInput, "test123");
    await user.click(screen.getByRole("button", { name: /unlock document/i }));

    await waitFor(() => {
      expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(2);
    });
  });

  it("shows error message for invalid PDF files", async () => {
    vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
      new Error("Invalid object ref")
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid or not supported/i)).toBeInTheDocument();
    });
  });

  it("shows generic error message for other errors", async () => {
    vi.mocked(pdfEditorService.loadPDF).mockRejectedValueOnce(
      new Error("Network error")
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to load pdf/i)).toBeInTheDocument();
    });
  });

  it("shows password error when incorrect password provided", async () => {
    let callCount = 0;
    vi.mocked(pdfEditorService.loadPDF).mockImplementation(async (file, password) => {
      callCount++;
      if (!password || callCount < 3) {
        throw new Error("PDF_PASSWORD_REQUIRED");
      }
      return undefined;
    });

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
    });

    const passwordInput = screen.getByPlaceholderText("Enter password");
    await user.type(passwordInput, "wrong");
    await user.click(screen.getByRole("button", { name: /unlock document/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });
  });
});
