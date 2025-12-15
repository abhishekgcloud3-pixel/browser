import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { RunningApp, AppId } from "@/types";
import { useWindowStore } from "./window-store";
import { getAppById } from "./app-registry";

interface RunningAppsState {
  apps: Record<string, RunningApp>;

  // Actions
  launchApp: (appId: AppId) => void;
  closeApp: (appId: AppId) => void;
  closeAppInstance: (windowId: string) => void;

  // Selectors
  isAppRunning: (appId: AppId) => boolean;
  getRunningAppCount: () => number;
  getRunningApps: () => RunningApp[];
  getAppInstances: (appId: AppId) => RunningApp[];
}

export const useRunningAppsStore = create<RunningAppsState>()(
  subscribeWithSelector((set, get) => ({
    apps: {},

    launchApp: (appId: AppId) => {
      const app = getAppById(appId);
      if (!app) {
        console.warn(`App ${appId} not found in registry`);
        return;
      }

      const windowStore = useWindowStore.getState();
      const windowId = windowStore.createWindow(appId, app.name);

      const runningApp: RunningApp = {
        appId,
        windowId,
        isRunning: true,
        startedAt: Date.now(),
      };

      set((state) => ({
        apps: {
          ...state.apps,
          [windowId]: runningApp,
        },
      }));
    },

    closeApp: (appId: AppId) => {
      const state = get();
      const windowStore = useWindowStore.getState();

      Object.entries(state.apps).forEach(([windowId, app]) => {
        if (app.appId === appId) {
          windowStore.closeWindow(windowId);
          set((s) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [windowId]: _removed, ...remaining } = s.apps;
            return { apps: remaining };
          });
        }
      });
    },

    closeAppInstance: (windowId: string) => {
      const windowStore = useWindowStore.getState();
      windowStore.closeWindow(windowId);

      set((state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [windowId]: _removed, ...remaining } = state.apps;
        return { apps: remaining };
      });
    },

    isAppRunning: (appId: AppId) => {
      const state = get();
      return Object.values(state.apps).some((app) => app.appId === appId);
    },

    getRunningAppCount: () => {
      return Object.values(get().apps).length;
    },

    getRunningApps: () => {
      return Object.values(get().apps);
    },

    getAppInstances: (appId: AppId) => {
      return Object.values(get().apps).filter((app) => app.appId === appId);
    },
  })),
);
