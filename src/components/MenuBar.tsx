import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  FilePlus,
  Save,
  LayoutTemplate,
  Share,
  Github,
  Bug,
} from "lucide-react";

interface MenuBarProps {
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
  hasDocument: boolean;
}

const MenuBar: React.FC<MenuBarProps> = memo(
  ({ onSave, onSaveAs, onNew, hasDocument }) => {
    return (
      <header className="flex justify-between items-center px-6 py-3 bg-slate-900 text-white border-b border-slate-800 h-16 shrink-0 z-50">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold tracking-wide">
            PDF<span className="text-indigo-400">Editor</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onNew}>
            <FilePlus className="w-4 h-4" />
            New
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasDocument}
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveAs}
            disabled={!hasDocument}
          >
            <Share className="w-4 h-4" />
            Export
          </Button>

          <div className="w-px h-6 bg-slate-700 mx-2" />

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
      </header>
    );
  },
);

MenuBar.displayName = "MenuBar";

export default MenuBar;
