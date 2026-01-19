import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    reset: vi.fn(),
  },
}));

import App from "../App";
import { pdfEditorService } from "../services/pdfEditor";
import { ThemeProvider } from "../contexts/ThemeContext";

describe("App", () => {
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

  it("loads PDF and shows viewer after selecting file", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: /pick pdf/i }));

    expect(pdfEditorService.loadPDF).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("pdf-viewer")).toBeInTheDocument();
  });
});
