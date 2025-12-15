/**
 * Type definitions for the YouTube App
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Desktop and Window Management Types
 */

export type AppId = "file-manager" | "settings" | "terminal" | "browser" | "text-editor";
export type Theme = "light" | "dark" | "system";

export interface AppRegistry {
  id: AppId;
  name: string;
  icon: string;
  category: "utility" | "productivity" | "system";
  executable: boolean;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowMetadata extends WindowBounds {
  id: string;
  appId: AppId;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  isClosing: boolean;
  isFocused: boolean;
  zIndex: number;
  createdAt: number;
  restoreBounds?: WindowBounds;
}

export interface RunningApp {
  appId: AppId;
  windowId: string;
  isRunning: boolean;
  startedAt: number;
}

export interface DesktopSettings {
  theme: Theme;
  wallpaper: string;
  iconSize: number;
  showClock: boolean;
  showSystemTray: boolean;
  taskbarPosition: "bottom" | "top";
  autoHideTaskbar: boolean;
}

/**
 * Virtual FileSystem Types
 */

export interface FSFile {
  id: string;
  name: string;
  parentId: string;
  content: string;
  mimeType: string;
  createdAt: number;
  updatedAt: number;
  size: number;
}

export interface FSDirectory {
  id: string;
  name: string;
  parentId: string;
  createdAt: number;
  updatedAt: number;
}

export interface FSMetadata {
  id?: number;
  totalSize: number;
  fileCount: number;
  directoryCount: number;
  lastCleanupAt: number;
}

export interface QuotaInfo {
  maxSize: number;
  usedSize: number;
  usedPercent: number;
  remaining: number;
}
