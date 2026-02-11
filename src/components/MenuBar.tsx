import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  FilePlus,
  Save,
  FileDown,
  Printer,
  FileText,
} from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

interface MenuBarProps {
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
  onPrint: () => void;
  hasDocument: boolean;
}

const MenuBar: React.FC<MenuBarProps> = memo(
  ({ onSave, onSaveAs, onNew, onPrint, hasDocument }) => {
    return (
      <header
        className="flex justify-between items-center px-3 md:px-5 py-2 bg-card text-card-foreground border-b border-border h-14 shrink-0 z-50"
        role="banner"
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <span className="text-base font-bold tracking-tight hidden sm:block">
            PDF<span className="text-primary">Editor</span>
          </span>
        </div>

        {/* Actions */}
        <nav className="flex items-center gap-0.5 md:gap-1" aria-label="File actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNew}
            title="New document"
            aria-label="New document"
            className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <FilePlus className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">New</span>
          </Button>

          <div className="w-px h-5 bg-border mx-0.5 md:mx-1.5" aria-hidden="true" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasDocument}
            title="Save (download)"
            aria-label="Save document"
            className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Save</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveAs}
            disabled={!hasDocument}
            title="Export as..."
            aria-label="Export document"
            className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Export</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPrint}
            disabled={!hasDocument}
            title="Print"
            aria-label="Print document"
            className="h-8 px-2.5 gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-medium">Print</span>
          </Button>

          <div className="w-px h-5 bg-border mx-0.5 md:mx-1.5" aria-hidden="true" />

          <ThemeSwitcher />
        </nav>
      </header>
    );
  },
);

MenuBar.displayName = "MenuBar";

export default MenuBar;
