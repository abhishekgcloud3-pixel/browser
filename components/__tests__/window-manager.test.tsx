import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { Taskbar } from "@/components/Taskbar";
import { WindowManager } from "@/components/WindowManager";
import { useWindowStore } from "@/stores/window-store";
import { useSettingsStore } from "@/stores/settings-store";

describe("Window manager integration", () => {
  beforeEach(() => {
    useWindowStore.getState().clearAllWindows();
    useSettingsStore.setState({
      settings: {
        theme: "system",
        wallpaper: "",
        iconSize: 64,
        showClock: false,
        showSystemTray: true,
        taskbarPosition: "bottom",
        autoHideTaskbar: false,
      },
    });
  });

  it("shows taskbar buttons and updates active window on click", async () => {
    const fileWindowId = useWindowStore
      .getState()
      .createWindow("file-manager", "File Manager");
    const terminalWindowId = useWindowStore.getState().createWindow("terminal", "Terminal");

    render(<Taskbar />);

    expect(screen.getByLabelText("Terminal (active)")).toBeInTheDocument();
    expect(screen.getByLabelText("File Manager")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("File Manager"));

    await waitFor(() => {
      expect(screen.getByLabelText("File Manager (active)")).toBeInTheDocument();
    });

    const focused = useWindowStore.getState().getFocusedWindow();
    expect(focused?.id).toBe(fileWindowId);
    expect(useWindowStore.getState().getWindow(terminalWindowId)?.isFocused).toBe(false);
  });

  it("drags and resizes a window via pointer events", async () => {
    const windowId = useWindowStore.getState().createWindow("terminal", "Terminal");

    render(
      <div style={{ position: "relative", width: 1200, height: 800 }}>
        <WindowManager />
      </div>,
    );

    const titleBar = screen.getByTestId(`window-titlebar-${windowId}`);

    fireEvent.pointerDown(titleBar, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(document, { clientX: 150, clientY: 130, pointerId: 1 });
    fireEvent.pointerUp(document, { clientX: 150, clientY: 130, pointerId: 1 });

    await waitFor(() => {
      const updated = useWindowStore.getState().getWindow(windowId);
      expect(updated?.x).toBe(130);
      expect(updated?.y).toBe(110);
    });

    const resizeHandle = screen.getByTestId(`window-resize-se-${windowId}`);

    fireEvent.pointerDown(resizeHandle, { clientX: 500, clientY: 400, pointerId: 2 });
    fireEvent.pointerMove(document, { clientX: 560, clientY: 460, pointerId: 2 });
    fireEvent.pointerUp(document, { clientX: 560, clientY: 460, pointerId: 2 });

    await waitFor(() => {
      const updated = useWindowStore.getState().getWindow(windowId);
      expect(updated?.width).toBe(860);
      expect(updated?.height).toBe(660);
    });
  });

  it("cycles focus with Alt+Tab", async () => {
    const first = useWindowStore.getState().createWindow("file-manager", "File Manager");
    const second = useWindowStore.getState().createWindow("terminal", "Terminal");

    render(
      <div style={{ position: "relative", width: 1200, height: 800 }}>
        <WindowManager />
      </div>,
    );

    expect(useWindowStore.getState().getFocusedWindow()?.id).toBe(second);

    fireEvent.keyDown(document, { key: "Tab", altKey: true });

    await waitFor(() => {
      expect(useWindowStore.getState().getFocusedWindow()?.id).toBe(first);
    });
  });
});
