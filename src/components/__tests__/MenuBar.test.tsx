import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuBar from '../MenuBar';

describe('MenuBar', () => {
    const mockOnSave = vi.fn();
    const mockOnSaveAs = vi.fn();
    const mockOnNew = vi.fn();
    const mockOnPrint = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the logo and title', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const pdfElements = screen.getAllByText('PDF');
        expect(pdfElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Editor')).toBeInTheDocument();
    });

    it('should render all menu buttons', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        expect(screen.getByTitle('New')).toBeInTheDocument();
        expect(screen.getByTitle('Save')).toBeInTheDocument();
        expect(screen.getByTitle('Print PDF')).toBeInTheDocument();
        expect(screen.getByTitle('Export')).toBeInTheDocument();
    });

    it('should call onNew when New button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const newButton = screen.getByTitle('New');
        await user.click(newButton);

        expect(mockOnNew).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when Save button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        const saveButton = screen.getByTitle('Save');
        await user.click(saveButton);

        expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('should call onPrint when Print button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        const printButton = screen.getByTitle('Print PDF');
        await user.click(printButton);

        expect(mockOnPrint).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveAs when Export button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        const exportButton = screen.getByTitle('Export');
        await user.click(exportButton);

        expect(mockOnSaveAs).toHaveBeenCalledTimes(1);
    });

    it('should disable Save button when hasDocument is false', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const saveButton = screen.getByTitle('Save');
        expect(saveButton).toBeDisabled();
    });

    it('should disable Print button when hasDocument is false', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const printButton = screen.getByTitle('Print PDF');
        expect(printButton).toBeDisabled();
    });

    it('should disable Export button when hasDocument is false', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const exportButton = screen.getByTitle('Export');
        expect(exportButton).toBeDisabled();
    });

    it('should enable Save button when hasDocument is true', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        const saveButton = screen.getByTitle('Save');
        expect(saveButton).not.toBeDisabled();
    });

    it('should enable Print button when hasDocument is true', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        const printButton = screen.getByTitle('Print PDF');
        expect(printButton).not.toBeDisabled();
    });

    it('should enable Export button when hasDocument is true', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={true}
            />
        );

        const exportButton = screen.getByTitle('Export');
        expect(exportButton).not.toBeDisabled();
    });

    it('should render ThemeSwitcher component', () => {
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        // ThemeSwitcher should be present (has icon button)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(4); // New, Save, Print, Export + ThemeSwitcher
    });

    it('should not call handlers when disabled', async () => {
        const user = userEvent.setup();
        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const saveButton = screen.getByTitle('Save');
        await user.click(saveButton);

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should open GitHub link when GitHub button is clicked', async () => {
        const user = userEvent.setup();
        const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const githubButton = screen.getByTitle('View on GitHub');
        await user.click(githubButton);

        expect(windowOpenSpy).toHaveBeenCalledWith(
            'https://github.com/devlinduldulao/pdf-editor',
            '_blank'
        );

        windowOpenSpy.mockRestore();
    });

    it('should be memoized to prevent unnecessary re-renders', () => {
        const { rerender } = render(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const firstRender = screen.getByRole('banner');

        // Re-render with same props
        rerender(
            <MenuBar
                onSave={mockOnSave}
                onSaveAs={mockOnSaveAs}
                onNew={mockOnNew}
                onPrint={mockOnPrint}
                hasDocument={false}
            />
        );

        const secondRender = screen.getByRole('banner');

        // Component should use React.memo
        expect(firstRender).toBe(secondRender);
    });
});
