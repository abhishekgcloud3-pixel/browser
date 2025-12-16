import "@testing-library/jest-dom/vitest";

// Mock IndexedDB for testing
import fakeIndexedDB from "fake-indexeddb";

Object.defineProperty(globalThis, "indexedDB", {
  value: fakeIndexedDB,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
  }

  if (!window.PointerEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.PointerEvent = window.MouseEvent as any;
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