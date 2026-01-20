import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  FilePlus,
  Save,
  LayoutTemplate,
  Share,
  Github,
  Bug,
  Printer,
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
      <header className="flex justify-between items-center px-4 md:px-6 py-3 bg-card text-card-foreground border-b border-border h-16 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold tracking-wide hidden sm:block">
            PDF<span className="text-primary">Editor</span>
          </h1>
          <h1 className="text-lg font-semibold tracking-wide sm:hidden">
            PDF<span className="text-primary">E</span>
          </h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="sm" onClick={onNew} title="New">
            <FilePlus className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">New</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1 md:mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasDocument}
            title="Save"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Save</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrint}
            disabled={!hasDocument}
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Print</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveAs}
            disabled={!hasDocument}
            title="Export"
          >
            <Share className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Export</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1 md:mx-2" />

          <ThemeSwitcher />

          <div className="w-px h-6 bg-border mx-1 md:mx-2 hidden md:block" />

          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.open(
                  "https://github.com/devlinduldulao/pdf-editor",
                  "_blank",
                )
              }
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.open(
                  "https://github.com/devlinduldulao/pdf-editor/issues",
                  "_blank",
                )
              }
              title="Report an issue"
            >
              <Bug className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
    );
  },
);

MenuBar.displayName = "MenuBar";

export default MenuBar;
