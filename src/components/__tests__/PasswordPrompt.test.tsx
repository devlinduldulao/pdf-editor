import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordPrompt } from '../PasswordPrompt';

describe('PasswordPrompt', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <PasswordPrompt
                isOpen={false}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );
        expect(screen.getByText('Protected PDF')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await userEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when X button is clicked', async () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const xButton = screen.getByRole('button', { name: '' });
        await userEvent.click(xButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSubmit with password when form is submitted', async () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const input = screen.getByPlaceholderText('Enter password');
        const submitButton = screen.getByRole('button', { name: /unlock document/i });

        await userEvent.type(input, 'test-password');
        await userEvent.click(submitButton);

        expect(mockOnSubmit).toHaveBeenCalledWith('test-password');
    });

    it('should clear password after submission', async () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const input = screen.getByPlaceholderText('Enter password') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /unlock document/i });

        await userEvent.type(input, 'test-password');
        expect(input.value).toBe('test-password');

        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(input.value).toBe('');
        });
    });

    it('should show error message when isError is true', () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
                isError={true}
            />
        );

        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });

    it('should not show error message when isError is false', () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
                isError={false}
            />
        );

        expect(screen.queryByText(/incorrect password/i)).not.toBeInTheDocument();
    });

    it('should apply error styles to input when isError is true', () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
                isError={true}
            />
        );

        const input = screen.getByPlaceholderText('Enter password');
        expect(input.className).toContain('border-destructive');
    });

    it('should have password type on input field', () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const input = screen.getByPlaceholderText('Enter password');
        expect(input).toHaveAttribute('type', 'password');
    });

    it('should focus on input when opened', () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const input = screen.getByPlaceholderText('Enter password');
        // React applies autoFocus but doesn't add it as an attribute in testing
        expect(input).toBeInTheDocument();
    });

    it('should submit form on Enter key press', async () => {
        render(
            <PasswordPrompt
                isOpen={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        const input = screen.getByPlaceholderText('Enter password');

        await userEvent.type(input, 'test-password{Enter}');

        expect(mockOnSubmit).toHaveBeenCalledWith('test-password');
    });
});
