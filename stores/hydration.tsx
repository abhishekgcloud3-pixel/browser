"use client";

import { useEffect } from "react";
import { useWindowStore } from "./window-store";
import { useSettingsStore } from "./settings-store";

/**
 * Component to handle store hydration on client side only
 * This prevents SSR hydration mismatches
 */
export function StoreHydration() {
  useEffect(() => {
    // Manually rehydrate stores after initial mount
    // This ensures hydration only happens on the client
    if (typeof window !== "undefined") {
      const windowStore = useWindowStore.persist;
      const settingsStore = useSettingsStore.persist;

      if (windowStore?.rehydrate) {
        windowStore.rehydrate();
      }

      if (settingsStore?.rehydrate) {
        settingsStore.rehydrate();
      }
    }
  }, []);

  return null;
}
