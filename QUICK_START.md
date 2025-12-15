# Desktop UI - Quick Start Guide

## What Was Implemented

A complete desktop environment UI with:
- **Zustand stores** for window, settings, and running apps state management
- **Desktop surface** with icon grid and wallpaper support
- **Responsive taskbar** with launcher menu and clock
- **Full accessibility** features
- **State persistence** across page reloads
- **26 comprehensive unit tests**

## Running the Project

```bash
# Development server
npm run dev
# Opens at http://localhost:3000

# Production build
npm run build

# Run tests
npm test              # Watch mode
npm test -- --run    # Single run

# Lint code
npm run lint
```

## Main Entry Points

- **App**: `app/page.tsx` → Renders `<DesktopLayout />`
- **Desktop**: `components/Desktop.tsx` → Icon grid and wallpaper
- **Taskbar**: `components/Taskbar.tsx` → Launcher, clock, window buttons
- **Stores**: `stores/index.ts` → All state management exports

## Key Features

### Launch Apps
Double-click desktop icons or use the launcher menu (⊞ Launch button)

Available apps:
- 📁 File Manager
- ⚙️ Settings
- 💻 Terminal
- 🌐 Browser
- 📝 Text Editor

### Window Management
- Click taskbar buttons to focus windows
- ESC key closes launcher menu
- Theme auto-applies when changed
- Settings persist across reloads

### Keyboard Navigation
- Tab: Navigate interactive elements
- ESC: Close launcher menu
- Enter: Launch app from launcher
- Double-click: Desktop icons to launch

## Using the Stores

```typescript
// In any component with "use client" directive:

import { useWindowStore, useRunningAppsStore, useSettingsStore } from "@/stores";

// Launch an app
const launchApp = useRunningAppsStore((state) => state.launchApp);
launchApp("file-manager");

// Focus a window
const focusWindow = useWindowStore((state) => state.focusWindow);
focusWindow(windowId);

// Change theme
const setTheme = useSettingsStore((state) => state.setTheme);
setTheme("dark");

// Check if app running
const isRunning = useRunningAppsStore((state) => state.isAppRunning("terminal"));
```

## Component Structure

```
DesktopLayout (main container)
├── Desktop (icon grid)
└── Taskbar
    ├── LauncherMenu (app grid)
    ├── Window List (running apps)
    └── Clock (system time)
```

## Persistence

State is automatically persisted to localStorage:
- Window layout (positions, sizes, z-index)
- Settings (theme, wallpaper, icon size, taskbar position)
- No manual persistence code needed

## Performance

- All components memoized with React.memo
- Event handlers use useCallback
- Zustand granular subscriptions minimize rerenders
- Efficient grid layouts with useMemo

## Testing

```bash
# Run all tests
npm test -- --run

# Expected output:
# ✓ stores/__tests__/settings-store.test.ts (9 tests)
# ✓ stores/__tests__/running-apps-store.test.ts (8 tests)
# ✓ stores/__tests__/window-store.test.ts (9 tests)
# Test Files  3 passed (3)
# Tests  26 passed (26)
```

## Browser Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- localStorage support
- CSS Grid and Flexbox support
- ES2020+ JavaScript support

## File Organization

```
components/
  ├── Desktop.tsx       # Icon grid
  ├── Taskbar.tsx       # System bar
  ├── DesktopLayout.tsx # Container
  └── index.ts          # Exports

stores/
  ├── window-store.ts        # Window state
  ├── settings-store.ts      # Settings state
  ├── running-apps-store.ts  # App tracking
  ├── app-registry.ts        # App definitions
  ├── persistence.ts         # Storage helpers
  ├── index.ts               # Exports
  └── __tests__/             # Tests

types/
  └── index.ts           # TypeScript definitions

app/
  ├── page.tsx           # Desktop entry
  └── layout.tsx         # Root layout
```

## Environment

- Node.js 18+ recommended
- npm or yarn package manager
- No additional env vars required (YouTube API key is optional)

## Troubleshooting

### State not persisting
- Check browser localStorage is enabled
- Look for errors in browser console
- Clear cache and reload: Ctrl+Shift+R

### Components not rendering
- Ensure "use client" directive at top of component files
- Check imports are correct in barrel exports
- Verify types are properly imported from @/types

### Tests failing
- Run `npm test -- --run` to see full error messages
- Ensure all dependencies installed: `npm install`
- Check Node.js version is 18+

### Linting errors
- Run `npm run lint` to see all issues
- Most can be auto-fixed (check ESLint docs)
- Use proper eslint-disable comments with reasons

## Next Steps

1. Explore `DESKTOP_IMPLEMENTATION.md` for detailed architecture
2. Review `IMPLEMENTATION_SUMMARY.md` for feature details
3. Check `stores/__tests__/` for usage examples
4. Run dev server and test the UI: `npm run dev`

## Support Files

- **DESKTOP_IMPLEMENTATION.md** - Architecture guide
- **IMPLEMENTATION_SUMMARY.md** - Feature overview
- **COMPLETION_CHECKLIST.md** - What was built
- **QUICK_START.md** - This file

---

**Ready to use!** Start with `npm run dev` and explore the desktop environment.
