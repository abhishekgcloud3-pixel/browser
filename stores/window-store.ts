import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";
import { createLocalStorage } from "./persistence";
import type { WindowMetadata, AppId, WindowBounds } from "@/types";

interface WindowState {
  windows: Record<string, WindowMetadata>;
  nextZIndex: number;

  // Actions
  createWindow: (appId: AppId, title: string) => string;
  closeWindow: (windowId: string) => void;
  requestCloseWindow: (windowId: string) => void;
  removeWindow: (windowId: string) => void;
  updateWindow: (windowId: string, updates: Partial<WindowMetadata> | WindowBounds) => void;
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

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const CASCADE_OFFSET = 32;
const CASCADE_STEPS = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewport() {
  return {
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  };
}

function getNextFocusableWindowId(
  windows: Record<string, WindowMetadata>,
  excludeId?: string,
) {
  return Object.values(windows)
    .filter((w) => w.id !== excludeId && !w.isMinimized && !w.isClosing)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.id;
}

export const useWindowStore = create<WindowState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      windows: {},
      nextZIndex: 1,

      createWindow: (appId: AppId, title: string) => {
        const state = get();
        const windowId = `${appId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const count = Object.keys(state.windows).length;
        const step = count % CASCADE_STEPS;
        const offset = step * CASCADE_OFFSET;

        const viewport = getViewport();
        const x = clamp(80 + offset, 0, Math.max(0, viewport.width - DEFAULT_WIDTH));
        const y = clamp(80 + offset, 0, Math.max(0, viewport.height - DEFAULT_HEIGHT));

        const newWindow: WindowMetadata = {
          id: windowId,
          appId,
          title,
          x,
          y,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          isMinimized: false,
          isMaximized: false,
          isClosing: false,
          isFocused: true,
          zIndex: state.nextZIndex,
          createdAt: Date.now(),
        };

        const nextWindows: Record<string, WindowMetadata> = {};
        for (const [id, win] of Object.entries(state.windows)) {
          if (win.isFocused) {
            nextWindows[id] = { ...win, isFocused: false };
          } else {
            nextWindows[id] = win;
          }
        }
        nextWindows[windowId] = newWindow;

        set({ windows: nextWindows, nextZIndex: state.nextZIndex + 1 });
        return windowId;
      },

      closeWindow: (windowId: string) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [windowId]: _removed, ...remaining } = state.windows;
          return { windows: remaining };
        });
      },

      requestCloseWindow: (windowId: string) => {
        const state = get();
        const win = state.windows[windowId];
        if (!win || win.isClosing) return;

        const nextFocusableId = getNextFocusableWindowId(state.windows, windowId);
        const nextWindows: Record<string, WindowMetadata> = {};

        for (const [id, w] of Object.entries(state.windows)) {
          if (id === windowId) {
            nextWindows[id] = { ...w, isClosing: true, isFocused: false };
            continue;
          }

          if (id === nextFocusableId) {
            nextWindows[id] = {
              ...w,
              isFocused: true,
              isMinimized: false,
              zIndex: state.nextZIndex,
            };
            continue;
          }

          if (w.isFocused) {
            nextWindows[id] = { ...w, isFocused: false };
          } else {
            nextWindows[id] = w;
          }
        }

        set({
          windows: nextWindows,
          nextZIndex: nextFocusableId ? state.nextZIndex + 1 : state.nextZIndex,
        });
      },

      removeWindow: (windowId: string) => {
        get().closeWindow(windowId);
      },

      updateWindow: (windowId: string, updates: Partial<WindowMetadata> | WindowBounds) => {
        set((state) => {
          const win = state.windows[windowId];
          if (!win) return {};

          return {
            windows: {
              ...state.windows,
              [windowId]: {
                ...win,
                ...updates,
              },
            },
          };
        });
      },

      focusWindow: (windowId: string) => {
        const state = get();
        const target = state.windows[windowId];
        if (!target || target.isClosing) return;

        const nextWindows: Record<string, WindowMetadata> = {};
        for (const [id, win] of Object.entries(state.windows)) {
          if (id === windowId) {
            nextWindows[id] = {
              ...win,
              isFocused: true,
              isMinimized: false,
              zIndex: state.nextZIndex,
            };
            continue;
          }

          if (win.isFocused) {
            nextWindows[id] = { ...win, isFocused: false };
          } else {
            nextWindows[id] = win;
          }
        }

        set({ windows: nextWindows, nextZIndex: state.nextZIndex + 1 });
      },

      minimizeWindow: (windowId: string) => {
        const state = get();
        const win = state.windows[windowId];
        if (!win) return;

        const nextFocusableId = getNextFocusableWindowId(state.windows, windowId);
        const nextWindows: Record<string, WindowMetadata> = {};

        for (const [id, w] of Object.entries(state.windows)) {
          if (id === windowId) {
            nextWindows[id] = { ...w, isMinimized: true, isFocused: false };
            continue;
          }

          if (id === nextFocusableId) {
            nextWindows[id] = {
              ...w,
              isFocused: true,
              isMinimized: false,
              zIndex: state.nextZIndex,
            };
            continue;
          }

          if (w.isFocused) {
            nextWindows[id] = { ...w, isFocused: false };
          } else {
            nextWindows[id] = w;
          }
        }

        set({
          windows: nextWindows,
          nextZIndex: nextFocusableId ? state.nextZIndex + 1 : state.nextZIndex,
        });
      },

      maximizeWindow: (windowId: string) => {
        const state = get();
        const win = state.windows[windowId];
        if (!win || win.isClosing) return;

        if (win.isMaximized) {
          state.restoreWindow(windowId);
          return;
        }

        const viewport = getViewport();

        state.updateWindow(windowId, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
          isMaximized: true,
          isMinimized: false,
          restoreBounds: { x: win.x, y: win.y, width: win.width, height: win.height },
        });

        state.focusWindow(windowId);
      },

      restoreWindow: (windowId: string) => {
        const state = get();
        const win = state.windows[windowId];
        if (!win || win.isClosing) return;

        if (win.isMaximized && win.restoreBounds) {
          state.updateWindow(windowId, {
            ...win.restoreBounds,
            restoreBounds: undefined,
            isMaximized: false,
            isMinimized: false,
          });
        } else {
          state.updateWindow(windowId, { isMinimized: false, isMaximized: false });
        }

        state.focusWindow(windowId);
      },

      clearAllWindows: () => {
        set({ windows: {}, nextZIndex: 1 });
      },

      getWindow: (windowId: string) => {
        return get().windows[windowId];
      },

      getFocusedWindow: () => {
        const state = get();
        const focusable = Object.values(state.windows)
          .filter((w) => !w.isMinimized && !w.isClosing)
          .sort((a, b) => b.zIndex - a.zIndex);

        return focusable.find((w) => w.isFocused) ?? focusable[0];
      },

      getWindowsByAppId: (appId: AppId) => {
        return Object.values(get().windows).filter((w) => w.appId === appId);
      },

      getOpenWindowCount: () => {
        return Object.values(get().windows).filter((w) => !w.isMinimized && !w.isClosing)
          .length;
      },
    })),
    {
      name: "window-store",
      storage: createLocalStorage(),
      partialize: (state) => ({
        windows: state.windows,
        nextZIndex: state.nextZIndex,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const windows = Object.values(state.windows);
        const maxZIndex = windows.reduce((acc, w) => Math.max(acc, w.zIndex), 0);

        const focusable = windows
          .filter((w) => !w.isMinimized && !w.isClosing)
          .sort((a, b) => b.zIndex - a.zIndex);

        const focusedId = focusable.find((w) => w.isFocused)?.id ?? focusable[0]?.id;

        const normalized: Record<string, WindowMetadata> = {};
        for (const win of windows) {
          const shouldFocus = focusedId ? win.id === focusedId : false;
          normalized[win.id] = {
            ...win,
            isFocused: shouldFocus,
            isClosing: win.isClosing ?? false,
            isMaximized: win.isMaximized ?? false,
          };

          if (normalized[win.id].isMaximized && !normalized[win.id].restoreBounds) {
            normalized[win.id].isMaximized = false;
          }
        }

        state.windows = normalized;
        state.nextZIndex = Math.max(state.nextZIndex, maxZIndex + 1);
      },
    },
  ),
);
