/**
 * Vitest global test setup file.
 *
 * This file runs before every test file. It:
 * 1. Imports `@testing-library/jest-dom` which adds custom DOM matchers
 *    like `toBeInTheDocument()`, `toHaveTextContent()`, etc.
 * 2. Sets up any global mocks needed across all tests.
 *
 * Why do we need this?
 * - `@testing-library/jest-dom` extends Vitest's `expect` with DOM-specific
 *   assertions that make tests more readable and give better error messages.
 * - Global mocks prevent repeated boilerplate in every test file.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// Polyfill: Blob.prototype.arrayBuffer
// ──────────────────────────────────────────────────────────────────────────────
/**
 * jsdom (even v28) doesn't always implement `Blob.prototype.arrayBuffer()`.
 * `File` extends `Blob`, so this polyfill also fixes `file.arrayBuffer()`
 * which is called by `PDFEditorService.loadPDF()`.
 *
 * The polyfill reads the Blob through a FileReader and resolves with the
 * resulting ArrayBuffer.
 */
if (typeof Blob.prototype.arrayBuffer !== "function") {
  // @ts-expect-error — we're intentionally patching a missing method
  Blob.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Polyfill: localStorage
// ──────────────────────────────────────────────────────────────────────────────
/**
 * Zustand's `persist` middleware calls `localStorage.setItem()` at store
 * creation time. Some jsdom configurations don't provide a fully functional
 * `localStorage` (it may lack setItem/getItem or throw). We replace it with
 * a simple in-memory implementation so Zustand persist works in tests.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

/**
 * Automatically unmounts React trees that were mounted with `render` after
 * each test. This prevents test leakage — where state from one test
 * accidentally affects another test.
 */
afterEach(() => {
  cleanup();
});

/**
 * Mock `window.matchMedia` which is used by the ThemeSwitcher / ThemeStore.
 * jsdom doesn't implement matchMedia, so we provide a minimal stub.
 *
 * Why? Components that call `window.matchMedia("(prefers-color-scheme: dark)")`
 * would throw without this mock.
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated but some libs still use it
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Stub URL.createObjectURL / revokeObjectURL which are used by the
 * PDF download/print flow. jsdom doesn't have blob URL support.
 */
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn(() => "blob:mock-url");
}
if (typeof URL.revokeObjectURL === "undefined") {
  URL.revokeObjectURL = vi.fn();
}
