import "@testing-library/jest-dom/vitest";

// Mock IndexedDB for testing
// @ts-expect-error - fake-indexeddb doesn't have types
import fakeIndexedDB, {
  IDBCursor,
  IDBCursorWithValue,
  IDBDatabase,
  IDBFactory,
  IDBIndex,
  IDBKeyRange,
  IDBObjectStore,
  IDBOpenDBRequest,
  IDBRequest,
  IDBTransaction,
  IDBVersionChangeEvent,
} from "fake-indexeddb";

Object.defineProperty(globalThis, "indexedDB", {
  value: fakeIndexedDB,
  writable: true,
});

Object.defineProperty(globalThis, "IDBCursor", {
  value: IDBCursor,
  writable: true,
});

Object.defineProperty(globalThis, "IDBCursorWithValue", {
  value: IDBCursorWithValue,
  writable: true,
});

Object.defineProperty(globalThis, "IDBDatabase", {
  value: IDBDatabase,
  writable: true,
});

Object.defineProperty(globalThis, "IDBFactory", {
  value: IDBFactory,
  writable: true,
});

Object.defineProperty(globalThis, "IDBIndex", {
  value: IDBIndex,
  writable: true,
});

Object.defineProperty(globalThis, "IDBKeyRange", {
  value: IDBKeyRange,
  writable: true,
});

Object.defineProperty(globalThis, "IDBObjectStore", {
  value: IDBObjectStore,
  writable: true,
});

Object.defineProperty(globalThis, "IDBOpenDBRequest", {
  value: IDBOpenDBRequest,
  writable: true,
});

Object.defineProperty(globalThis, "IDBRequest", {
  value: IDBRequest,
  writable: true,
});

Object.defineProperty(globalThis, "IDBTransaction", {
  value: IDBTransaction,
  writable: true,
});

Object.defineProperty(globalThis, "IDBVersionChangeEvent", {
  value: IDBVersionChangeEvent,
  writable: true,
});

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = () =>
      ({
        matches: false,
        media: "",
        onchange: null,
        addListener: () => {
          // deprecated
        },
        removeListener: () => {
          // deprecated
        },
        addEventListener: () => {
          // no-op
        },
        removeEventListener: () => {
          // no-op
        },
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }

  if (!window.PointerEvent) {
    // @ts-expect-error - polyfill for jsdom environments missing PointerEvent
    window.PointerEvent = window.MouseEvent;
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      return window.setTimeout(() => cb(Date.now()), 0);
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number) => {
      window.clearTimeout(id);
    };
  }
}
