import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "dim" | "system";

interface ThemeState {
  theme: Theme;
  actualTheme: "light" | "dark" | "dim";
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      actualTheme: "light",
      
      setTheme: (theme: Theme) => {
        set({ theme });
        get().initializeTheme();
      },
      
      initializeTheme: () => {
        if (typeof window === "undefined") return;

        const root = document.documentElement;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const { theme } = get();

        // Remove all theme classes
        root.classList.remove("light", "dark", "dim");

        let resolvedTheme: "light" | "dark" | "dim";

        if (theme === "system") {
          resolvedTheme = mediaQuery.matches ? "dark" : "light";
        } else {
          resolvedTheme = theme;
        }

        // Add the resolved theme class
        root.classList.add(resolvedTheme);
        set({ actualTheme: resolvedTheme });
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Initialize theme on load and listen for system changes
if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  
  // Initialize on load
  useThemeStore.getState().initializeTheme();
  
  // Listen for system theme changes
  mediaQuery.addEventListener("change", () => {
    if (useThemeStore.getState().theme === "system") {
      useThemeStore.getState().initializeTheme();
    }
  });
}
