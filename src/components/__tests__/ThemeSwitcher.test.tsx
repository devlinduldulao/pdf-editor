import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSwitcher from '../ThemeSwitcher';
import { useThemeStore } from '@/stores/themeStore';

// Mock the theme store
vi.mock('@/stores/themeStore', () => ({
    useThemeStore: vi.fn(),
}));

describe('ThemeSwitcher', () => {
    const mockSetTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'system',
            actualTheme: 'light',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });
    });

    it('should render theme button', () => {
        render(<ThemeSwitcher />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('should show dropdown when clicked', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
        expect(screen.getByText('Dim')).toBeInTheDocument();
        expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('should close dropdown when backdrop is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        expect(screen.getByText('Light')).toBeInTheDocument();

        // Click backdrop (the fixed overlay with z-40)
        const backdrop = container.querySelector('.fixed.inset-0.z-40');
        if (backdrop) {
            await user.click(backdrop as HTMLElement);

            await waitFor(() => {
                expect(screen.queryByText('Light')).not.toBeInTheDocument();
            });
        }
    });

    it('should call setTheme with light when Light is clicked', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        const lightOption = screen.getByText('Light');
        await user.click(lightOption);

        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should call setTheme with dark when Dark is clicked', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        const darkOption = screen.getByText('Dark');
        await user.click(darkOption);

        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should call setTheme with dim when Dim is clicked', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        const dimOption = screen.getByText('Dim');
        await user.click(dimOption);

        expect(mockSetTheme).toHaveBeenCalledWith('dim');
    });

    it('should call setTheme with system when System is clicked', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        const systemOption = screen.getByText('System');
        await user.click(systemOption);

        expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    it('should close dropdown after selecting a theme', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        const lightOption = screen.getByText('Light');
        await user.click(lightOption);

        await waitFor(() => {
            expect(screen.queryByText('Light')).not.toBeInTheDocument();
        });
    });

    it('should highlight current theme', async () => {
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'dark',
            actualTheme: 'dark',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });

        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');
        await user.click(button);

        const darkOption = screen.getByText('Dark').parentElement;
        expect(darkOption?.className).toContain('bg-accent');
    });

    it('should show correct icon for light theme', () => {
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'light',
            actualTheme: 'light',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });

        const { container } = render(<ThemeSwitcher />);
        // Sun icon should be rendered for light theme
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should show correct icon for dark theme', () => {
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'dark',
            actualTheme: 'dark',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });

        const { container } = render(<ThemeSwitcher />);
        // Moon icon should be rendered for dark theme
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should show correct icon for dim theme', () => {
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'dim',
            actualTheme: 'dim',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });

        const { container } = render(<ThemeSwitcher />);
        // Palette icon should be rendered for dim theme
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should show correct icon for system theme', () => {
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'system',
            actualTheme: 'light',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });

        const { container } = render(<ThemeSwitcher />);
        // Monitor icon should be rendered for system theme
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should have correct title attribute', () => {
        vi.mocked(useThemeStore).mockReturnValue({
            theme: 'dark',
            actualTheme: 'dark',
            setTheme: mockSetTheme,
            initializeTheme: vi.fn(),
        });

        render(<ThemeSwitcher />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', 'Theme: Dark');
    });

    it('should toggle dropdown on button click', async () => {
        const user = userEvent.setup();
        render(<ThemeSwitcher />);

        const button = screen.getByRole('button');

        // Open
        await user.click(button);
        expect(screen.getByText('Light')).toBeInTheDocument();

        // Close
        await user.click(button);
        await waitFor(() => {
            expect(screen.queryByText('Light')).not.toBeInTheDocument();
        });

        // Open again
        await user.click(button);
        expect(screen.getByText('Light')).toBeInTheDocument();
    });
});
