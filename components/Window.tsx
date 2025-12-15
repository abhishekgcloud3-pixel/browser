"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowStore } from "@/stores/window-store";
import { FileManager } from "./apps/FileManager";
import { TextEditor } from "./apps/TextEditor";
import { Settings } from "./apps/Settings";
import { Terminal } from "./apps/Terminal";
import { Browser } from "./apps/Browser";
import type { WindowBounds } from "@/types";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const CLOSE_ANIMATION_MS = 160;

type ResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

function applyResize(
  bounds: WindowBounds,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
): WindowBounds {
  let { x, y, width, height } = bounds;

  if (direction.includes("e")) {
    width = width + deltaX;
  }
  if (direction.includes("s")) {
    height = height + deltaY;
  }
  if (direction.includes("w")) {
    width = width - deltaX;
    x = x + deltaX;
  }
  if (direction.includes("n")) {
    height = height - deltaY;
    y = y + deltaY;
  }

  width = Math.max(MIN_WIDTH, width);
  height = Math.max(MIN_HEIGHT, height);

  return { x, y, width, height };
}

export const Window = React.memo(({ windowId }: { windowId: string }) => {
  const win = useWindowStore(
    useCallback((state) => state.windows[windowId], [windowId]),
  );

  const focusWindow = useWindowStore((state) => state.focusWindow);
  const updateWindow = useWindowStore((state) => state.updateWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const requestCloseWindow = useWindowStore((state) => state.requestCloseWindow);
  const removeWindow = useWindowStore((state) => state.removeWindow);

  const [hasEntered, setHasEntered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    isOpen: boolean;
  }>({ x: 0, y: 0, isOpen: false });

  const dragRef = useRef<{
    startX: number;
    startY: number;
    base: WindowBounds;
    pointerId: number;
  } | null>(null);

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    base: WindowBounds;
    pointerId: number;
    direction: ResizeDirection;
  } | null>(null);

  const rafRef = useRef<number | null>(null);
  const draftRef = useRef<WindowBounds | null>(null);
  const [draftBounds, setDraftBounds] = useState<WindowBounds | null>(null);
  const pointerMoveBoundRef = useRef<((event: PointerEvent) => void) | null>(null);
  const pointerUpBoundRef = useRef<((event: PointerEvent) => void) | null>(null);

  const bounds = useMemo(
    () =>
      draftBounds ??
      (win
        ? { x: win.x, y: win.y, width: win.width, height: win.height }
        : null),
    [draftBounds, win],
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!win?.isClosing) return;

    const timeout = setTimeout(() => {
      removeWindow(windowId);
    }, CLOSE_ANIMATION_MS);

    return () => clearTimeout(timeout);
  }, [removeWindow, win?.isClosing, windowId]);

  const scheduleDraftUpdate = useCallback((next: WindowBounds) => {
    draftRef.current = next;

    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (draftRef.current) setDraftBounds(draftRef.current);
    });
  }, []);

  const stopInteraction = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const commitDraftBounds = useCallback(() => {
    const currentDraft = draftRef.current;
    if (currentDraft) {
      updateWindow(windowId, currentDraft);
    }

    draftRef.current = null;
    setDraftBounds(null);
  }, [updateWindow, windowId]);

  const handleDocumentPointerMove = useCallback(
    (event: PointerEvent) => {
      if (dragRef.current && event.pointerId === dragRef.current.pointerId) {
        const dx = event.clientX - dragRef.current.startX;
        const dy = event.clientY - dragRef.current.startY;

        scheduleDraftUpdate({
          ...dragRef.current.base,
          x: dragRef.current.base.x + dx,
          y: dragRef.current.base.y + dy,
        });
      }

      if (resizeRef.current && event.pointerId === resizeRef.current.pointerId) {
        const dx = event.clientX - resizeRef.current.startX;
        const dy = event.clientY - resizeRef.current.startY;

        scheduleDraftUpdate(
          applyResize(resizeRef.current.base, resizeRef.current.direction, dx, dy),
        );
      }
    },
    [scheduleDraftUpdate],
  );

  const handleDocumentPointerUp = useCallback(
    (event: PointerEvent) => {
      if (
        (dragRef.current && event.pointerId === dragRef.current.pointerId) ||
        (resizeRef.current && event.pointerId === resizeRef.current.pointerId)
      ) {
        if (pointerMoveBoundRef.current) {
          document.removeEventListener("pointermove", pointerMoveBoundRef.current);
        }
        if (pointerUpBoundRef.current) {
          document.removeEventListener("pointerup", pointerUpBoundRef.current);
        }
        commitDraftBounds();
        stopInteraction();
      }
    },
    [commitDraftBounds, stopInteraction],
  );

  useEffect(() => {
    pointerMoveBoundRef.current = handleDocumentPointerMove;
  }, [handleDocumentPointerMove]);

  useEffect(() => {
    pointerUpBoundRef.current = handleDocumentPointerUp;
  }, [handleDocumentPointerUp]);

  useEffect(() => {
    return () => {
      if (pointerMoveBoundRef.current) {
        document.removeEventListener("pointermove", pointerMoveBoundRef.current);
      }
      if (pointerUpBoundRef.current) {
        document.removeEventListener("pointerup", pointerUpBoundRef.current);
      }
    };
  }, []);

  const startDrag = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      if (!win || !bounds || win.isMaximized) return;

      focusWindow(windowId);
      event.preventDefault();

      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        base: bounds,
        pointerId: event.pointerId,
      };

      if (pointerMoveBoundRef.current) {
        document.addEventListener("pointermove", pointerMoveBoundRef.current);
      }
      if (pointerUpBoundRef.current) {
        document.addEventListener("pointerup", pointerUpBoundRef.current);
      }

      scheduleDraftUpdate(bounds);
    },
    [
      bounds,
      focusWindow,
      scheduleDraftUpdate,
      win,
      windowId,
    ],
  );

  const startResize = useCallback(
    (direction: ResizeDirection) => (event: React.PointerEvent) => {
      if (event.button !== 0) return;
      if (!win || !bounds || win.isMaximized) return;

      focusWindow(windowId);
      event.preventDefault();

      resizeRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        base: bounds,
        pointerId: event.pointerId,
        direction,
      };

      if (pointerMoveBoundRef.current) {
        document.addEventListener("pointermove", pointerMoveBoundRef.current);
      }
      if (pointerUpBoundRef.current) {
        document.addEventListener("pointerup", pointerUpBoundRef.current);
      }

      scheduleDraftUpdate(bounds);
    },
    [
      bounds,
      focusWindow,
      scheduleDraftUpdate,
      win,
      windowId,
    ],
  );

  const handleFocus = useCallback(() => {
    if (!win || win.isClosing) return;
    focusWindow(windowId);
  }, [focusWindow, win, windowId]);

  const handleMinimize = useCallback(() => {
    minimizeWindow(windowId);
    setContextMenu((m) => ({ ...m, isOpen: false }));
  }, [minimizeWindow, windowId]);

  const handleToggleMaximize = useCallback(() => {
    if (!win) return;
    if (win.isMaximized) {
      restoreWindow(windowId);
    } else {
      maximizeWindow(windowId);
    }
    setContextMenu((m) => ({ ...m, isOpen: false }));
  }, [maximizeWindow, restoreWindow, win, windowId]);

  const handleClose = useCallback(() => {
    requestCloseWindow(windowId);
    setContextMenu((m) => ({ ...m, isOpen: false }));
  }, [requestCloseWindow, windowId]);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      handleFocus();
      setContextMenu({ x: event.clientX, y: event.clientY, isOpen: true });
    },
    [handleFocus],
  );

  useEffect(() => {
    if (!contextMenu.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu((m) => ({ ...m, isOpen: false }));
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(`[data-window-context-menu=\"${windowId}\"]`)) return;
      setContextMenu((m) => ({ ...m, isOpen: false }));
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [contextMenu.isOpen, windowId]);

  const classes = useMemo(() => {
    const base =
      "pointer-events-auto absolute rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl flex flex-col overflow-hidden transition-[opacity,transform] duration-150 ease-out";

    const visibility = win?.isMinimized
      ? "opacity-0 scale-95 pointer-events-none"
      : "opacity-100 scale-100";

    const entering = hasEntered ? "" : "opacity-0 scale-95";
    const closing = win?.isClosing ? "opacity-0 scale-95 pointer-events-none" : "";
    const focused = win?.isFocused
      ? "ring-2 ring-primary-500 dark:ring-primary-400"
      : "";

    return [base, visibility, entering, closing, focused].filter(Boolean).join(" ");
  }, [hasEntered, win?.isClosing, win?.isFocused, win?.isMinimized]);

  if (!win || !bounds) return null;

  return (
    <div
      data-testid={`window-${windowId}`}
      className={classes}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: win.zIndex,
      }}
      role="dialog"
      aria-label={win.title}
      onPointerDown={handleFocus}
      onContextMenu={handleContextMenu}
    >
      <div
        data-testid={`window-titlebar-${windowId}`}
        onPointerDown={startDrag}
        className="h-10 shrink-0 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between px-3 select-none touch-none"
        aria-label={`${win.title} title bar`}
      >
        <div className="font-medium text-sm text-neutral-800 dark:text-neutral-200 truncate">
          {win.title}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleMinimize();
            }}
            className="h-7 w-7 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
            aria-label="Minimize"
          >
            ―
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMaximize();
            }}
            className="h-7 w-7 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
            aria-label={win.isMaximized ? "Restore" : "Maximize"}
          >
            {win.isMaximized ? "❐" : "□"}
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="h-7 w-7 rounded hover:bg-error-500 hover:text-white dark:hover:bg-error-500 text-neutral-700 dark:text-neutral-200"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {win.appId === "file-manager" && <FileManager />}
        {win.appId === "text-editor" && <TextEditor />}
        {win.appId === "settings" && <Settings />}
        {win.appId === "terminal" && <Terminal />}
        {win.appId === "browser" && <Browser />}
      </div>

      {!win.isMaximized && (
        <>
          <div
            data-testid={`window-resize-n-${windowId}`}
            onPointerDown={startResize("n")}
            className="absolute -top-1 left-2 right-2 h-2 cursor-n-resize touch-none"
            aria-label="Resize north"
          />
          <div
            data-testid={`window-resize-s-${windowId}`}
            onPointerDown={startResize("s")}
            className="absolute -bottom-1 left-2 right-2 h-2 cursor-s-resize touch-none"
            aria-label="Resize south"
          />
          <div
            data-testid={`window-resize-e-${windowId}`}
            onPointerDown={startResize("e")}
            className="absolute -right-1 top-2 bottom-2 w-2 cursor-e-resize touch-none"
            aria-label="Resize east"
          />
          <div
            data-testid={`window-resize-w-${windowId}`}
            onPointerDown={startResize("w")}
            className="absolute -left-1 top-2 bottom-2 w-2 cursor-w-resize touch-none"
            aria-label="Resize west"
          />
          <div
            data-testid={`window-resize-ne-${windowId}`}
            onPointerDown={startResize("ne")}
            className="absolute -right-1 -top-1 w-3 h-3 cursor-ne-resize touch-none"
            aria-label="Resize northeast"
          />
          <div
            data-testid={`window-resize-nw-${windowId}`}
            onPointerDown={startResize("nw")}
            className="absolute -left-1 -top-1 w-3 h-3 cursor-nw-resize touch-none"
            aria-label="Resize northwest"
          />
          <div
            data-testid={`window-resize-se-${windowId}`}
            onPointerDown={startResize("se")}
            className="absolute -right-1 -bottom-1 w-3 h-3 cursor-se-resize touch-none"
            aria-label="Resize southeast"
          />
          <div
            data-testid={`window-resize-sw-${windowId}`}
            onPointerDown={startResize("sw")}
            className="absolute -left-1 -bottom-1 w-3 h-3 cursor-sw-resize touch-none"
            aria-label="Resize southwest"
          />
        </>
      )}

      {contextMenu.isOpen && (
        <div
          data-window-context-menu={windowId}
          className="fixed z-[9999] bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-lg overflow-hidden min-w-40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
          aria-label="Window context menu"
        >
          <button
            type="button"
            onClick={handleMinimize}
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
            role="menuitem"
          >
            Minimize
          </button>
          <button
            type="button"
            onClick={handleToggleMaximize}
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
            role="menuitem"
          >
            {win.isMaximized ? "Restore" : "Maximize"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full text-left px-3 py-2 hover:bg-error-50 dark:hover:bg-error-900/30 text-sm text-error-600 dark:text-error-300"
            role="menuitem"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
});

Window.displayName = "Window";
