/**
 * General API Types
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Desktop and Window Management Types
 */

export type AppId = "file-manager" | "settings" | "terminal" | "browser" | "text-editor" | "youtube";
export type Theme = "light" | "dark" | "system";

export interface AppRegistry {
  id: AppId;
  name: string;
  icon: string;
  category: "utility" | "productivity" | "system" | "entertainment";
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

/**
 * YouTube App Types
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount?: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
}

export interface YouTubePlayerState {
  isPlaying: boolean;
  currentVideo: YouTubeVideo | null;
  volume: number;
  playbackRate: number;
  currentTime: number;
  duration: number;
}

export interface YouTubeHistoryItem {
  video: YouTubeVideo;
  watchedAt: number;
  watchDuration: number;
}

export interface YouTubePlaylistItem {
  id: string;
  name: string;
  videos: YouTubeVideo[];
  createdAt: number;
}

export interface YouTubeCacheEntry {
  key: string;
  data: unknown;
  timestamp: number;
  expiresAt: number;
}

/**
 * Browser App Types
 */

export interface BrowserHistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  favicon?: string;
}

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface BrowserSettings {
  homepage: string;
  searchEngine: string;
  enableJavaScript: boolean;
  enablePlugins: boolean;
  blockPopups: boolean;
  savePasswords: boolean;
}
