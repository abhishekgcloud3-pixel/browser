"use client";

import React, { useEffect, useCallback } from "react";
import { shallow } from "zustand/shallow";
import { useWindowStore } from "@/stores/window-store";
import { Window } from "./Window";

export const WindowManager = React.memo(() => {
  const windowIds = useWindowStore(
    useCallback((state) => {
      return Object.values(state.windows)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((w) => w.id);
    }, []),
    shallow,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "Tab") {
        event.preventDefault();

        const state = useWindowStore.getState();
        const focusableWindows = Object.values(state.windows)
          .filter((w) => !w.isMinimized && !w.isClosing)
          .sort((a, b) => b.zIndex - a.zIndex);

        if (focusableWindows.length < 2) return;

        const focusedId = state.getFocusedWindow()?.id;
        const currentIndex = focusableWindows.findIndex((w) => w.id === focusedId);
        const direction = event.shiftKey ? -1 : 1;

        const nextIndex =
          currentIndex === -1
            ? 0
            : (currentIndex + direction + focusableWindows.length) %
              focusableWindows.length;

        const nextWindow = focusableWindows[nextIndex];
        state.focusWindow(nextWindow.id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (windowIds.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-label="Window layer">
      {windowIds.map((id) => (
        <Window key={id} windowId={id} />
      ))}
    </div>
  );
});

WindowManager.displayName = "WindowManager";
