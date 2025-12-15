"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useRunningAppsStore } from "@/stores/running-apps-store";
import { useWindowStore } from "@/stores/window-store";
import { useSettingsStore } from "@/stores/settings-store";
import { DEFAULT_APP_REGISTRY, getAppById } from "@/stores/app-registry";
import type { AppId, WindowMetadata } from "@/types";

const Clock = React.memo(() => {
  const [time, setTime] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  const showClock = useSettingsStore((state) => state.settings.showClock);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showClock || !time) return null;

  return (
    <div className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 border-l border-neutral-300 dark:border-neutral-600">
      {time}
    </div>
  );
});

Clock.displayName = "Clock";

const TaskbarButton = React.memo(
  ({
    win,
    isActive,
    onActivate,
    onMinimize,
    onClose,
  }: {
    win: WindowMetadata;
    isActive: boolean;
    onActivate: () => void;
    onMinimize: () => void;
    onClose: () => void;
  }) => {
    const [menu, setMenu] = useState<{ x: number; y: number; isOpen: boolean }>({
      x: 0,
      y: 0,
      isOpen: false,
    });

    const appInfo = getAppById(win.appId);

    const closeMenu = useCallback(() => {
      setMenu((m) => ({ ...m, isOpen: false }));
    }, []);

    useEffect(() => {
      if (!menu.isOpen) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") closeMenu();
      };

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest?.(`[data-taskbar-menu=\"${win.id}\"]`)) return;
        closeMenu();
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [closeMenu, menu.isOpen, win.id]);

    if (!appInfo) return null;

    return (
      <>
        <button
          onClick={onActivate}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ x: e.clientX, y: e.clientY, isOpen: true });
          }}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 flex items-center gap-2 whitespace-nowrap ${
            isActive
              ? "bg-primary-500 text-white dark:bg-primary-600"
              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          }`}
          title={win.title}
          aria-label={`${appInfo.name}${isActive ? " (active)" : ""}`}
        >
          <span role="img" aria-hidden="true">
            {appInfo.icon}
          </span>
          <span className="hidden sm:inline max-w-xs truncate">{appInfo.name}</span>
          {isActive && (
            <div
              className="w-1.5 h-1.5 bg-white dark:bg-neutral-900 rounded-full"
              aria-hidden="true"
            />
          )}
        </button>

        {menu.isOpen && (
          <div
            data-taskbar-menu={win.id}
            className="fixed z-[9999] bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg overflow-hidden min-w-44"
            style={{ left: menu.x, top: menu.y }}
            role="menu"
            aria-label="Taskbar window menu"
          >
            <button
              type="button"
              onClick={() => {
                onActivate();
                closeMenu();
              }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
              role="menuitem"
            >
              {win.isMinimized ? "Restore" : "Focus"}
            </button>
            <button
              type="button"
              onClick={() => {
                onMinimize();
                closeMenu();
              }}
              className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
              role="menuitem"
            >
              Minimize
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                closeMenu();
              }}
              className="w-full text-left px-3 py-2 hover:bg-error-50 dark:hover:bg-error-900/30 text-sm text-error-600 dark:text-error-300"
              role="menuitem"
            >
              Close
            </button>
          </div>
        )}
      </>
    );
  },
);

TaskbarButton.displayName = "TaskbarButton";

interface LauncherMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  launchApp: (appId: AppId) => void;
}

const LauncherMenu = React.memo(
  ({ isOpen, onToggle, launchApp }: LauncherMenuProps) => {
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          if (isOpen) onToggle();
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen, onToggle]);

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpen) {
          onToggle();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
          document.removeEventListener("keydown", handleKeyDown);
        };
      }
    }, [isOpen, onToggle]);

    return (
      <div ref={menuRef} className="relative" role="region" aria-label="App launcher menu">
        <button
          onClick={onToggle}
          className="px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-700 dark:focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
          aria-label="Open app launcher"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          ⊞ Launch
        </button>

        {isOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xl p-2 grid gap-2 max-w-xs"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            }}
            role="menu"
          >
            {DEFAULT_APP_REGISTRY.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  launchApp(app.id);
                  onToggle();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                role="menuitem"
                title={app.name}
                aria-label={`Launch ${app.name}`}
              >
                <span className="text-2xl mb-1" role="img" aria-hidden="true">
                  {app.icon}
                </span>
                <span className="text-xs text-center truncate w-full text-neutral-700 dark:text-neutral-300">
                  {app.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

LauncherMenu.displayName = "LauncherMenu";

export const Taskbar = React.memo(() => {
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const launchApp = useRunningAppsStore((state) => state.launchApp);

  const windows = useWindowStore(
    useCallback(
      (state) =>
        Object.values(state.windows)
          .filter((w) => !w.isClosing)
          .sort((a, b) => a.createdAt - b.createdAt),
      [],
    ),
  );

  const focusedId = useWindowStore(
    useCallback(
      (state) =>
        Object.values(state.windows).find(
          (w) => w.isFocused && !w.isMinimized && !w.isClosing,
        )?.id,
      [],
    ),
  );

  const focusWindow = useWindowStore((state) => state.focusWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const requestCloseWindow = useWindowStore((state) => state.requestCloseWindow);

  const taskbarPosition = useSettingsStore((state) => state.settings.taskbarPosition);

  const handleToggleLauncher = useCallback(() => {
    setIsLauncherOpen((prev) => !prev);
  }, []);

  const handleActivateWindow = useCallback(
    (win: WindowMetadata) => {
      if (win.isMinimized) {
        restoreWindow(win.id);
        return;
      }

      if (focusedId === win.id) {
        minimizeWindow(win.id);
        return;
      }

      focusWindow(win.id);
    },
    [focusWindow, focusedId, minimizeWindow, restoreWindow],
  );

  const positionClasses = {
    bottom: "bottom-0 left-0 right-0",
    top: "top-0 left-0 right-0",
  };

  const windowButtons = useMemo(
    () =>
      windows.map((win) => (
        <div key={win.id} className="relative">
          <TaskbarButton
            win={win}
            isActive={focusedId === win.id}
            onActivate={() => handleActivateWindow(win)}
            onMinimize={() => minimizeWindow(win.id)}
            onClose={() => requestCloseWindow(win.id)}
          />
        </div>
      )),
    [focusedId, handleActivateWindow, minimizeWindow, requestCloseWindow, windows],
  );

  return (
    <div
      className={`${positionClasses[taskbarPosition]} bg-white dark:bg-neutral-800 border-t border-neutral-300 dark:border-neutral-700 shadow-lg flex items-center gap-4 px-4 py-2 transition-colors`}
      role="toolbar"
      aria-label="Taskbar"
    >
      <LauncherMenu isOpen={isLauncherOpen} onToggle={handleToggleLauncher} launchApp={launchApp} />

      <div className="flex-1 flex items-center gap-2 overflow-x-auto" role="group">
        {windowButtons}
      </div>

      <Clock />
    </div>
  );
});

Taskbar.displayName = "Taskbar";
