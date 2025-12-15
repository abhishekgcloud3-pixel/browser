import { describe, it, expect, beforeEach } from "vitest";
import { useWindowStore } from "../window-store";

describe("Window Store", () => {
  beforeEach(() => {
    localStorage.clear();
    useWindowStore.getState().clearAllWindows();
  });

  it("should create a new window", () => {
    const windowId = useWindowStore
      .getState()
      .createWindow("file-manager", "File Manager");

    expect(windowId).toBeDefined();

    const window = useWindowStore.getState().getWindow(windowId);
    expect(window).toBeDefined();
    expect(window?.appId).toBe("file-manager");
    expect(window?.title).toBe("File Manager");
    expect(window?.isMinimized).toBe(false);
    expect(window?.isFocused).toBe(true);
  });

  it("should close a window", () => {
    const windowId = useWindowStore
      .getState()
      .createWindow("terminal", "Terminal");
    expect(useWindowStore.getState().getWindow(windowId)).toBeDefined();

    useWindowStore.getState().closeWindow(windowId);
    expect(useWindowStore.getState().getWindow(windowId)).toBeUndefined();
  });

  it("should minimize and restore a window", () => {
    const windowId = useWindowStore
      .getState()
      .createWindow("browser", "Browser");

    useWindowStore.getState().minimizeWindow(windowId);
    let window = useWindowStore.getState().getWindow(windowId);
    expect(window?.isMinimized).toBe(true);

    useWindowStore.getState().restoreWindow(windowId);
    window = useWindowStore.getState().getWindow(windowId);
    expect(window?.isMinimized).toBe(false);
  });

  it("should focus a window", () => {
    const windowId1 = useWindowStore
      .getState()
      .createWindow("file-manager", "File Manager");
    const windowId2 = useWindowStore.getState().createWindow("terminal", "Terminal");

    useWindowStore.getState().focusWindow(windowId1);
    expect(useWindowStore.getState().getWindow(windowId1)?.isFocused).toBe(true);
    expect(useWindowStore.getState().getWindow(windowId2)?.isFocused).toBe(false);
  });

  it("should get focused window", () => {
    const windowId = useWindowStore
      .getState()
      .createWindow("browser", "Browser");

    const focusedWindow = useWindowStore.getState().getFocusedWindow();
    expect(focusedWindow?.id).toBe(windowId);
    expect(focusedWindow?.isFocused).toBe(true);
  });

  it("should get windows by app id", () => {
    useWindowStore.getState().createWindow("file-manager", "File Manager 1");
    useWindowStore.getState().createWindow("file-manager", "File Manager 2");
    useWindowStore.getState().createWindow("terminal", "Terminal");

    const fileManagerWindows = useWindowStore
      .getState()
      .getWindowsByAppId("file-manager");
    expect(fileManagerWindows).toHaveLength(2);
    expect(fileManagerWindows.every((w) => w.appId === "file-manager")).toBe(true);
  });

  it("should count open windows", () => {
    useWindowStore.getState().createWindow("file-manager", "File Manager");
    const windowId = useWindowStore
      .getState()
      .createWindow("terminal", "Terminal");

    let count = useWindowStore.getState().getOpenWindowCount();
    expect(count).toBe(2);

    useWindowStore.getState().minimizeWindow(windowId);
    count = useWindowStore.getState().getOpenWindowCount();
    expect(count).toBe(1);
  });

  it("should increment zIndex on new window", () => {
    const windowId1 = useWindowStore
      .getState()
      .createWindow("file-manager", "File Manager");
    const windowId2 = useWindowStore.getState().createWindow("terminal", "Terminal");

    const window1 = useWindowStore.getState().getWindow(windowId1);
    const window2 = useWindowStore.getState().getWindow(windowId2);

    expect(window2!.zIndex).toBeGreaterThan(window1!.zIndex);
  });

  it("should update window properties", () => {
    const windowId = useWindowStore
      .getState()
      .createWindow("browser", "Browser");

    useWindowStore
      .getState()
      .updateWindow(windowId, { x: 200, y: 300, width: 1024, height: 768 });

    const window = useWindowStore.getState().getWindow(windowId);
    expect(window?.x).toBe(200);
    expect(window?.y).toBe(300);
    expect(window?.width).toBe(1024);
    expect(window?.height).toBe(768);
  });

  it("should persist geometry and restore on rehydrate", async () => {
    const windowId = useWindowStore
      .getState()
      .createWindow("terminal", "Terminal");

    useWindowStore.getState().updateWindow(windowId, {
      x: 222,
      y: 111,
      width: 900,
      height: 700,
    });

    const persisted = localStorage.getItem("window-store");
    expect(persisted).toBeTruthy();

    useWindowStore.setState({ windows: {}, nextZIndex: 1 });
    if (persisted) localStorage.setItem("window-store", persisted);

    await useWindowStore.persist.rehydrate();

    const restored = useWindowStore.getState().getWindow(windowId);
    expect(restored?.x).toBe(222);
    expect(restored?.y).toBe(111);
    expect(restored?.width).toBe(900);
    expect(restored?.height).toBe(700);
  });
});
