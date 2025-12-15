/**
 * Persistence utilities for Zustand stores using localStorage with fallback
 */
import type { StorageValue } from "zustand/middleware";

export const createLocalStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: async () => {
        return null;
      },
      setItem: async () => {
        // no-op
      },
      removeItem: async () => {
        // no-op
      },
    };
  }

  return {
    getItem: async (name: string) => {
      try {
        const value = localStorage.getItem(name);
        if (value === null) return null;
        return JSON.parse(value);
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: StorageValue<unknown>) => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch {
        // Silently fail if localStorage is unavailable
      }
    },
    removeItem: async (name: string) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // Silently fail if localStorage is unavailable
      }
    },
  };
};

export const createIndexedDBStorage = () => {
  if (typeof window === "undefined" || !window.indexedDB) {
    return createLocalStorage();
  }

  return {
    getItem: async (key: string) => {
      return createLocalStorage().getItem(key);
    },
    setItem: async (key: string, value: StorageValue<unknown>) => {
      return createLocalStorage().setItem(key, value);
    },
    removeItem: async (key: string) => {
      return createLocalStorage().removeItem(key);
    },
  };
};
