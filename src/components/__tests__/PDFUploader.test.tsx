import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PDFUploader from '../PDFUploader';

describe('PDFUploader', () => {
    it('calls onFileSelect for a valid PDF', () => {
        const onFileSelect = vi.fn();
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        const { container } = render(<PDFUploader onFileSelect={onFileSelect} />);

        const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
        expect(input).toBeTruthy();

        const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
        fireEvent.change(input!, { target: { files: [file] } });

        expect(onFileSelect).toHaveBeenCalledTimes(1);
        expect(onFileSelect).toHaveBeenCalledWith(file);
        expect(alertSpy).not.toHaveBeenCalled();

        alertSpy.mockRestore();
    });

    it('alerts for invalid file type', () => {
        const onFileSelect = vi.fn();
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

        const { container } = render(<PDFUploader onFileSelect={onFileSelect} />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
        expect(input).toBeTruthy();

        const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
        fireEvent.change(input!, { target: { files: [file] } });

        expect(onFileSelect).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledTimes(1);

        alertSpy.mockRestore();
    });

    it('has an upload heading', () => {
        render(<PDFUploader onFileSelect={() => undefined} />);
        expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    });
});
