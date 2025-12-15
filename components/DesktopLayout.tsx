"use client";

import React, { useEffect } from "react";
import { Desktop } from "./Desktop";
import { Taskbar } from "./Taskbar";
import { useSettingsStore } from "@/stores/settings-store";

export const DesktopLayout = React.memo(() => {
  const theme = useSettingsStore((state) => state.settings.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const taskbarPosition = useSettingsStore(
    (state) => state.settings.taskbarPosition,
  );

  // Apply theme on mount and when it changes
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  const taskbarClasses = {
    bottom: "flex-col",
    top: "flex-col-reverse",
  };

  return (
    <div
      className={`h-screen w-screen flex ${taskbarClasses[taskbarPosition]} bg-white dark:bg-neutral-900 overflow-hidden`}
      role="application"
      aria-label="Desktop environment"
    >
      <Desktop />
      <div className="h-12 shrink-0 border-t border-neutral-300 dark:border-neutral-700">
        <Taskbar />
      </div>
    </div>
  );
});

DesktopLayout.displayName = "DesktopLayout";
