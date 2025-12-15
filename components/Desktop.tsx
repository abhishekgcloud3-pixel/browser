"use client";

import React, { useMemo, useCallback } from "react";
import { useRunningAppsStore } from "@/stores/running-apps-store";
import { useSettingsStore } from "@/stores/settings-store";
import { DEFAULT_APP_REGISTRY } from "@/stores/app-registry";
import type { AppId } from "@/types";

const DesktopIcon = React.memo(
  ({
    app,
    onDoubleClick,
    isRunning,
  }: {
    app: (typeof DEFAULT_APP_REGISTRY)[number];
    onDoubleClick: () => void;
    isRunning: boolean;
  }) => {
    return (
      <button
        onDoubleClick={onDoubleClick}
        className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${
          isRunning
            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
            : "hover:bg-neutral-200 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400"
        }`}
        title={app.name}
        aria-label={`Launch ${app.name}${isRunning ? " (running)" : ""}`}
      >
        <div className="text-4xl mb-2" role="img" aria-hidden="true">
          {app.icon}
        </div>
        <span className="text-xs text-center truncate w-16 leading-tight">
          {app.name}
        </span>
        {isRunning && (
          <span className="text-xs font-semibold text-success-500 mt-1">
            ●
          </span>
        )}
      </button>
    );
  },
);

DesktopIcon.displayName = "DesktopIcon";

export const Desktop = React.memo(() => {
  const launchApp = useRunningAppsStore((state) => state.launchApp);
  const isAppRunning = useRunningAppsStore((state) => state.isAppRunning);
  const getWallpaper = useSettingsStore((state) => state.getWallpaper);
  const getIconSize = useSettingsStore((state) => state.getIconSize);
  const wallpaper = getWallpaper();

  const handleLaunchApp = useCallback(
    (appId: AppId) => {
      launchApp(appId);
    },
    [launchApp],
  );

  const appGrid = useMemo(
    () => (
      <div
        className="grid gap-6 p-8"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${getIconSize() + 32}px, 1fr))`,
        }}
      >
        {DEFAULT_APP_REGISTRY.map((app) => (
          <DesktopIcon
            key={app.id}
            app={app}
            onDoubleClick={() => handleLaunchApp(app.id)}
            isRunning={isAppRunning(app.id)}
          />
        ))}
      </div>
    ),
    [getIconSize, handleLaunchApp, isAppRunning],
  );

  return (
    <div
      className="w-full h-screen bg-cover bg-center flex flex-col relative overflow-hidden transition-colors dark:bg-neutral-900 bg-neutral-50"
      style={{
        backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
        backgroundColor: wallpaper ? undefined : "rgb(249, 250, 251)",
      }}
      role="main"
      aria-label="Desktop surface"
    >
      <div className="flex-1 overflow-auto">{appGrid}</div>
    </div>
  );
});

Desktop.displayName = "Desktop";
