import '@testing-library/jest-dom/vitest';

// Polyfill for File.arrayBuffer which might be missing in some environments
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
    File.prototype.arrayBuffer = function() {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result as ArrayBuffer);
            };
            reader.readAsArrayBuffer(this);
        });
    };
}

// Make sure tests don't explode on browser-only dialogs
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('prompt', vi.fn(() => null));

// Mock localStorage for tests
const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(() => null),
};
vi.stubGlobal('localStorage', localStorageMock);

// Mock window.matchMedia for theme tests
vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
})));
