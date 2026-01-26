import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

describe('LoadingSpinner', () => {
    it('should render with default size', () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner).toBeInTheDocument();
        expect(spinner.className).toContain('w-8');
        expect(spinner.className).toContain('h-8');
        expect(spinner.className).toContain('border-3');
    });

    it('should render with small size', () => {
        const { container } = render(<LoadingSpinner size="sm" />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('w-4');
        expect(spinner.className).toContain('h-4');
        expect(spinner.className).toContain('border-2');
    });

    it('should render with large size', () => {
        const { container } = render(<LoadingSpinner size="lg" />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('w-12');
        expect(spinner.className).toContain('h-12');
        expect(spinner.className).toContain('border-4');
    });

    it('should render with extra large size', () => {
        const { container } = render(<LoadingSpinner size="xl" />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('w-16');
        expect(spinner.className).toContain('h-16');
        expect(spinner.className).toContain('border-4');
    });

    it('should have spinning animation', () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('animate-spin');
    });

    it('should have rounded border', () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('rounded-full');
    });

    it('should have accessible loading text', () => {
        render(<LoadingSpinner />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.getByText('Loading...').className).toContain('sr-only');
    });

    it('should accept custom className', () => {
        const { container } = render(<LoadingSpinner className="custom-class" />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('custom-class');
    });

    it('should merge custom className with default classes', () => {
        const { container } = render(<LoadingSpinner className="my-4" />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('my-4');
        expect(spinner.className).toContain('animate-spin');
        expect(spinner.className).toContain('rounded-full');
    });

    it('should pass through additional props', () => {
        const { container } = render(
            <LoadingSpinner data-testid="loading-spinner" aria-label="Custom loading" />
        );
        const spinner = container.firstChild as HTMLElement;

        expect(spinner).toHaveAttribute('data-testid', 'loading-spinner');
        expect(spinner).toHaveAttribute('aria-label', 'Custom loading');
    });

    it('should have primary color border', () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('border-primary');
    });

    it('should have transparent top border', () => {
        const { container } = render(<LoadingSpinner />);
        const spinner = container.firstChild as HTMLElement;

        expect(spinner.className).toContain('border-t-transparent');
    });
});
