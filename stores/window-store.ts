import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";
import { createLocalStorage } from "./persistence";
import type { WindowMetadata, AppId } from "@/types";

interface WindowState {
  windows: Record<string, WindowMetadata>;
  nextZIndex: number;

  // Actions
  createWindow: (appId: AppId, title: string) => string;
  closeWindow: (windowId: string) => void;
  updateWindow: (windowId: string, updates: Partial<WindowMetadata>) => void;
  focusWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  clearAllWindows: () => void;

  // Selectors
  getWindow: (windowId: string) => WindowMetadata | undefined;
  getFocusedWindow: () => WindowMetadata | undefined;
  getWindowsByAppId: (appId: AppId) => WindowMetadata[];
  getOpenWindowCount: () => number;
}

export const useWindowStore = create<WindowState>()(
  persist(
    subscribeWithSelector((set, get) => ({
    windows: {},
    nextZIndex: 1,

    createWindow: (appId: AppId, title: string) => {
      const state = get();
      const windowId = `${appId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newWindow: WindowMetadata = {
        id: windowId,
        appId,
        title,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 800,
        height: 600,
        isMinimized: false,
        isFocused: true,
        zIndex: state.nextZIndex,
        createdAt: Date.now(),
      };

      set((state) => ({
        windows: {
          ...state.windows,
          [windowId]: newWindow,
        },
        nextZIndex: state.nextZIndex + 1,
      }));

      return windowId;
    },

    closeWindow: (windowId: string) => {
      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [windowId]: _removed, ...remaining } = state.windows;
        return { windows: remaining };
      });
    },

    updateWindow: (windowId: string, updates: Partial<WindowMetadata>) => {
      set((state) => ({
        windows: {
          ...state.windows,
          [windowId]: {
            ...state.windows[windowId],
            ...updates,
          },
        },
      }));
    },

    focusWindow: (windowId: string) => {
      const state = get();
      const window = state.windows[windowId];

      if (window) {
        set({
          windows: {
            ...state.windows,
            [windowId]: {
              ...window,
              isFocused: true,
              isMinimized: false,
              zIndex: state.nextZIndex,
            },
          },
          nextZIndex: state.nextZIndex + 1,
        });

        // Unfocus other windows
        Object.keys(state.windows).forEach((id) => {
          if (id !== windowId) {
            set((s) => ({
              windows: {
                ...s.windows,
                [id]: {
                  ...s.windows[id],
                  isFocused: false,
                },
              },
            }));
          }
        });
      }
    },

    minimizeWindow: (windowId: string) => {
      get().updateWindow(windowId, { isMinimized: true });
    },

    maximizeWindow: (windowId: string) => {
      get().updateWindow(windowId, {
        x: 0,
        y: 0,
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
        height: typeof window !== "undefined" ? window.innerHeight : 1080,
      });
    },

    restoreWindow: (windowId: string) => {
      get().updateWindow(windowId, {
        isMinimized: false,
        isFocused: true,
      });
    },

    clearAllWindows: () => {
      set({
        windows: {},
        nextZIndex: 1,
      });
    },

    getWindow: (windowId: string) => {
      return get().windows[windowId];
    },

    getFocusedWindow: () => {
      const state = get();
      const focusedWindow = Object.values(state.windows).find(
        (w) => w.isFocused && !w.isMinimized,
      );
      return focusedWindow;
    },

    getWindowsByAppId: (appId: AppId) => {
      return Object.values(get().windows).filter((w) => w.appId === appId);
    },

    getOpenWindowCount: () => {
      return Object.values(get().windows).filter((w) => !w.isMinimized).length;
    },
    })),
    {
      name: "window-store",
      storage: createLocalStorage(),
    },
  ),
);
