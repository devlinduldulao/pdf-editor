import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { useThemeStore, type Theme } from "@/stores/themeStore";

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const themes: Array<{ value: Theme; icon: React.ReactNode; label: string }> =
    [
      { value: "light", icon: <Sun className="w-4 h-4" />, label: "Light" },
      { value: "dark", icon: <Moon className="w-4 h-4" />, label: "Dark" },
      {
        value: "dim",
        icon: <Palette className="w-4 h-4" />,
        label: "Dim",
      },
      {
        value: "system",
        icon: <Monitor className="w-4 h-4" />,
        label: "System",
      },
    ];

  const currentThemeData = themes.find((t) => t.value === theme);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${currentThemeData?.label || "System"}`}
      >
        {currentThemeData?.icon}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-md shadow-lg z-50">
            <div className="py-1">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    theme === themeOption.value
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground"
                  }`}
                >
                  {themeOption.icon}
                  <span>{themeOption.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
