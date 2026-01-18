import '@testing-library/jest-dom/vitest';

// Make sure tests don't explode on browser-only dialogs
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('prompt', vi.fn(() => null));
