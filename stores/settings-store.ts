import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";
import { createLocalStorage } from "./persistence";
import type { DesktopSettings, Theme } from "@/types";

const DEFAULT_SETTINGS: DesktopSettings = {
  theme: "system",
  wallpaper: "",
  iconSize: 64,
  showClock: true,
  showSystemTray: true,
  taskbarPosition: "bottom",
  autoHideTaskbar: false,
};

interface SettingsState {
  settings: DesktopSettings;

  // Actions
  updateSettings: (updates: Partial<DesktopSettings>) => void;
  setTheme: (theme: Theme) => void;
  resetSettings: () => void;
  loadSettings: (settings: DesktopSettings) => void;

  // Selectors
  getTheme: () => Theme;
  getWallpaper: () => string;
  getIconSize: () => number;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    subscribeWithSelector((set, get) => ({
    settings: DEFAULT_SETTINGS,

    updateSettings: (updates: Partial<DesktopSettings>) => {
      set((state) => ({
        settings: {
          ...state.settings,
          ...updates,
        },
      }));
    },

    setTheme: (theme: Theme) => {
      get().updateSettings({ theme });

      // Apply theme to document
      if (typeof document !== "undefined") {
        const html = document.documentElement;
        if (theme === "dark") {
          html.classList.add("dark");
        } else if (theme === "light") {
          html.classList.remove("dark");
        } else {
          // system - respect system preference
          const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          if (prefersDark) {
            html.classList.add("dark");
          } else {
            html.classList.remove("dark");
          }
        }
      }
    },

    resetSettings: () => {
      set({
        settings: DEFAULT_SETTINGS,
      });
    },

    loadSettings: (settings: DesktopSettings) => {
      set({ settings });
    },

    getTheme: () => {
      const theme = get().settings.theme;
      if (theme !== "system") return theme;

      // Resolve system theme
      if (typeof window !== "undefined") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        return prefersDark ? "dark" : "light";
      }
      return "light";
    },

    getWallpaper: () => {
      return get().settings.wallpaper;
    },

    getIconSize: () => {
      return get().settings.iconSize;
    },
    })),
    {
      name: "settings-store",
      storage: createLocalStorage(),
      skipHydration: true,
    },
  ),
);
