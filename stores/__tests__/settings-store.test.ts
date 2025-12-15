import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useSettingsStore } from "../settings-store";

describe("Settings Store", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      settings: {
        theme: "system",
        wallpaper: "",
        iconSize: 64,
        showClock: true,
        showSystemTray: true,
        taskbarPosition: "bottom",
        autoHideTaskbar: false,
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should have default settings", () => {
    const settings = useSettingsStore.getState().settings;
    expect(settings.theme).toBe("system");
    expect(settings.iconSize).toBe(64);
    expect(settings.taskbarPosition).toBe("bottom");
  });

  it("should update settings", () => {
    useSettingsStore.getState().updateSettings({ iconSize: 96, showClock: false });

    const settings = useSettingsStore.getState().settings;
    expect(settings.iconSize).toBe(96);
    expect(settings.showClock).toBe(false);
  });

  it("should set theme", () => {
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().settings.theme).toBe("dark");

    useSettingsStore.getState().setTheme("light");
    expect(useSettingsStore.getState().settings.theme).toBe("light");
  });

  it("should reset settings to defaults", () => {
    useSettingsStore
      .getState()
      .updateSettings({ iconSize: 128, taskbarPosition: "top" });

    useSettingsStore.getState().resetSettings();

    const settings = useSettingsStore.getState().settings;
    expect(settings.iconSize).toBe(64);
    expect(settings.taskbarPosition).toBe("bottom");
  });

  it("should load settings", () => {
    const newSettings = {
      theme: "dark" as const,
      wallpaper: "https://example.com/wallpaper.jpg",
      iconSize: 80,
      showClock: false,
      showSystemTray: false,
      taskbarPosition: "top" as const,
      autoHideTaskbar: true,
    };

    useSettingsStore.getState().loadSettings(newSettings);

    const settings = useSettingsStore.getState().settings;
    expect(settings).toEqual(newSettings);
  });

  it("should get theme", () => {
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().getTheme()).toBe("dark");

    useSettingsStore.getState().setTheme("light");
    expect(useSettingsStore.getState().getTheme()).toBe("light");
  });

  it("should get wallpaper", () => {
    const wallpaper = "https://example.com/bg.jpg";
    useSettingsStore.getState().updateSettings({ wallpaper });
    expect(useSettingsStore.getState().getWallpaper()).toBe(wallpaper);
  });

  it("should get icon size", () => {
    useSettingsStore.getState().updateSettings({ iconSize: 72 });
    expect(useSettingsStore.getState().getIconSize()).toBe(72);
  });

  it("should partially update settings while preserving others", () => {
    const initialSettings = { ...useSettingsStore.getState().settings };

    useSettingsStore.getState().updateSettings({ iconSize: 96 });

    const settings = useSettingsStore.getState().settings;
    expect(settings.iconSize).toBe(96);
    expect(settings.theme).toBe(initialSettings.theme);
    expect(settings.taskbarPosition).toBe(initialSettings.taskbarPosition);
  });
});
