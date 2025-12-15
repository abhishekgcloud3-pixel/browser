# Desktop Implementation Guide

This document describes the Desktop and Taskbar UI implementation with Zustand state management.

## Architecture Overview

### State Management (Zustand Stores)

#### 1. Window Store (`stores/window-store.ts`)
Manages all window metadata and lifecycle:
- **State**: Windows collection, z-index counter
- **Actions**:
  - `createWindow(appId, title)` - Creates a new window
  - `closeWindow(windowId)` - Closes a window
  - `focusWindow(windowId)` - Brings window to focus (highest z-index)
  - `minimizeWindow(windowId)` - Minimizes a window
  - `restoreWindow(windowId)` - Restores minimized window
  - `updateWindow(windowId, updates)` - Updates window properties
  - `clearAllWindows()` - Clears all windows
- **Selectors**: 
  - `getWindow(windowId)` - Gets window by ID
  - `getFocusedWindow()` - Gets currently focused window
  - `getWindowsByAppId(appId)` - Gets all windows for an app
  - `getOpenWindowCount()` - Counts open (non-minimized) windows
- **Persistence**: State persisted to localStorage

#### 2. Settings Store (`stores/settings-store.ts`)
Manages desktop settings and preferences:
- **State**: Theme, wallpaper, icon size, taskbar settings, etc.
- **Actions**:
  - `updateSettings(updates)` - Updates settings
  - `setTheme(theme)` - Sets and applies theme
  - `resetSettings()` - Resets to defaults
  - `loadSettings(settings)` - Loads full settings
- **Selectors**:
  - `getTheme()` - Gets current theme (resolves "system")
  - `getWallpaper()` - Gets wallpaper URL
  - `getIconSize()` - Gets icon size in pixels
- **Persistence**: State persisted to localStorage

#### 3. Running Apps Store (`stores/running-apps-store.ts`)
Tracks running applications and their instances:
- **State**: Active app instances
- **Actions**:
  - `launchApp(appId)` - Launches a new app instance (creates window)
  - `closeApp(appId)` - Closes all instances of an app
  - `closeAppInstance(windowId)` - Closes specific app instance
- **Selectors**:
  - `isAppRunning(appId)` - Checks if app is running
  - `getRunningAppCount()` - Counts running instances
  - `getRunningApps()` - Gets all running apps
  - `getAppInstances(appId)` - Gets instances of specific app

### Components

#### Desktop Component (`components/Desktop.tsx`)
Desktop surface with icon grid:
- Displays application icons from registry
- Shows running status indicator
- Supports double-click to launch
- Responsive grid with configurable icon size
- Memoized for performance
- Accessible (ARIA labels, keyboard navigation)

#### Taskbar Component (`components/Taskbar.tsx`)
System taskbar with launcher and window management:
- **Launcher Menu**: Grid of all available apps
  - Opens/closes with button
  - Keyboard: ESC to close
  - Click outside to close
  - Launches new app instances
- **Running Apps**: Buttons for each open window
  - Click to focus window
  - Visual indicator for active window
  - Shows app icon and name
- **Clock**: System clock display (optional, configurable)
- Respects taskbar position setting (top/bottom)
- Memoized components for performance

#### DesktopLayout Component (`components/DesktopLayout.tsx`)
Container component that orchestrates:
- Desktop surface
- Taskbar
- Theme application
- Layout flexing based on taskbar position

### App Registry (`stores/app-registry.ts`)
Defines available applications:
- File Manager (📁)
- Settings (⚙️)
- Terminal (💻)
- Browser (🌐)
- Text Editor (📝)

Each app has:
- ID, name, icon, category, executable status

### Persistence Layer (`stores/persistence.ts`)
Provides storage abstraction:
- `createLocalStorage()` - Wraps localStorage with error handling
- `createIndexedDBStorage()` - Placeholder for IndexedDB (currently falls back to localStorage)
- Handles SSR by checking for `window` object
- Graceful degradation if storage unavailable

## Types (`types/index.ts`)

- `AppId` - Union type of available app IDs
- `Theme` - Theme setting ("light" | "dark" | "system")
- `AppRegistry` - App definition schema
- `WindowMetadata` - Window state and properties
- `RunningApp` - Running app instance record
- `DesktopSettings` - Desktop configuration

## Features

### Accessibility
- Proper ARIA labels on all interactive elements
- Focus styles for keyboard navigation
- Semantic HTML with roles and landmarks
- Keyboard shortcuts (ESC for launcher menu)

### Performance
- React.memo on all components
- useCallback for event handlers
- useMemo for expensive computations
- Zustand subscribeWithSelector for granular subscriptions

### Persistence
- Window layout persists across reloads
- Settings (theme, wallpaper, etc.) persist
- localStorage with fallback for unavailable storage
- SSR-safe with window checks

### Responsive Design
- Grid layout adapts to screen size
- Taskbar scales with content
- Memoized grid calculations

## Testing

Comprehensive unit tests for all stores:
- **Window Store Tests** (9 tests)
  - Window creation, closing, focus management
  - Z-index management
  - Window queries and filtering
- **Running Apps Tests** (8 tests)
  - App launching and closing
  - Instance tracking
  - App lifecycle
- **Settings Tests** (9 tests)
  - Settings updates and resets
  - Theme management
  - Persistence

Run tests:
```bash
npm test              # Watch mode
npm test -- --run    # Single run
```

## Usage

### Launching an App
```typescript
import { useRunningAppsStore } from "@/stores";

const launchApp = useRunningAppsStore((state) => state.launchApp);
launchApp("file-manager");
```

### Managing Windows
```typescript
import { useWindowStore } from "@/stores";

const { focusWindow, closeWindow } = useWindowStore.getState();
focusWindow(windowId);
closeWindow(windowId);
```

### Updating Settings
```typescript
import { useSettingsStore } from "@/stores";

const setTheme = useSettingsStore((state) => state.setTheme);
setTheme("dark");
```

## Browser Compatibility

- Modern browsers with localStorage support
- SSR-safe (checks for `window` object)
- Falls back gracefully if storage unavailable
- Requires ES2020+ for async/await in persistence

## Future Enhancements

1. IndexedDB implementation for larger data
2. Window animations and transitions
3. Drag-and-drop window management
4. Custom wallpaper upload
5. Multiple desktop workspaces
6. Window snapping and tiling
7. Context menus for windows
8. System notifications
