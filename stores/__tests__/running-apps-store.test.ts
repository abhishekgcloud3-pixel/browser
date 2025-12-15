import { describe, it, expect, beforeEach } from "vitest";
import { useRunningAppsStore } from "../running-apps-store";
import { useWindowStore } from "../window-store";

describe("Running Apps Store", () => {
  beforeEach(() => {
    useRunningAppsStore.setState({ apps: {} });
    useWindowStore.getState().clearAllWindows();
  });

  it("should launch an app", () => {
    useRunningAppsStore.getState().launchApp("file-manager");

    expect(useRunningAppsStore.getState().isAppRunning("file-manager")).toBe(true);
    expect(useRunningAppsStore.getState().getRunningApps()).toHaveLength(1);
  });

  it("should track app instances", () => {
    useRunningAppsStore.getState().launchApp("file-manager");
    useRunningAppsStore.getState().launchApp("file-manager");

    const instances = useRunningAppsStore
      .getState()
      .getAppInstances("file-manager");
    expect(instances).toHaveLength(2);
    expect(instances.every((app) => app.appId === "file-manager")).toBe(true);
  });

  it("should close an app and all its instances", () => {
    useRunningAppsStore.getState().launchApp("terminal");
    useRunningAppsStore.getState().launchApp("terminal");
    useRunningAppsStore.getState().launchApp("browser");

    expect(useRunningAppsStore.getState().getRunningApps()).toHaveLength(3);

    useRunningAppsStore.getState().closeApp("terminal");

    expect(useRunningAppsStore.getState().isAppRunning("terminal")).toBe(false);
    expect(useRunningAppsStore.getState().isAppRunning("browser")).toBe(true);
    expect(useRunningAppsStore.getState().getRunningApps()).toHaveLength(1);
  });

  it("should close a specific app instance", () => {
    useRunningAppsStore.getState().launchApp("file-manager");
    const secondApp = useRunningAppsStore
      .getState()
      .getRunningApps()[0];

    useRunningAppsStore.getState().launchApp("file-manager");

    expect(useRunningAppsStore.getState().getRunningApps()).toHaveLength(2);

    useRunningAppsStore.getState().closeAppInstance(secondApp.windowId);

    expect(useRunningAppsStore.getState().getRunningApps()).toHaveLength(1);
  });

  it("should count running apps", () => {
    useRunningAppsStore.getState().launchApp("file-manager");
    useRunningAppsStore.getState().launchApp("terminal");

    expect(useRunningAppsStore.getState().getRunningAppCount()).toBe(2);
  });

  it("should get all running apps", () => {
    useRunningAppsStore.getState().launchApp("file-manager");
    useRunningAppsStore.getState().launchApp("terminal");
    useRunningAppsStore.getState().launchApp("browser");

    const apps = useRunningAppsStore.getState().getRunningApps();
    expect(apps).toHaveLength(3);
    expect(apps.map((a) => a.appId)).toContain("file-manager");
    expect(apps.map((a) => a.appId)).toContain("terminal");
    expect(apps.map((a) => a.appId)).toContain("browser");
  });

  it("should create a window when launching an app", () => {
    const initialWindowCount = Object.keys(useWindowStore.getState().windows)
      .length;

    useRunningAppsStore.getState().launchApp("settings");

    const newWindowCount = Object.keys(useWindowStore.getState().windows).length;
    expect(newWindowCount).toBe(initialWindowCount + 1);
  });

  it("should track app start time", () => {
    const before = Date.now();
    useRunningAppsStore.getState().launchApp("browser");
    const after = Date.now();

    const app = useRunningAppsStore.getState().getRunningApps()[0];
    expect(app.startedAt).toBeGreaterThanOrEqual(before);
    expect(app.startedAt).toBeLessThanOrEqual(after);
  });
});
