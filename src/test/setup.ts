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
