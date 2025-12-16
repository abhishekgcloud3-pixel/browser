/**
 * IndexedDB utilities for YouTube app
 * Provides storage for history, playlists, and cached data
 */

// YouTube app database name and version
const DB_NAME = 'YouTubeAppDB';
const DB_VERSION = 1;
const HISTORY_STORE = 'history';
const PLAYLISTS_STORE = 'playlists';
const CACHE_STORE = 'cache';

// YouTube history item structure
export interface StoredHistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  watchedAt: number;
  watchDuration: number; // seconds watched
  duration: string;
}

// Playlist structure
export interface StoredPlaylist {
  id: string;
  name: string;
  description?: string;
  videos: StoredHistoryItem[];
  createdAt: number;
  updatedAt: number;
}

// Cache entry structure
export interface StoredCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

class YouTubeDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create history store
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
          historyStore.createIndex('videoId', 'videoId', { unique: false });
          historyStore.createIndex('watchedAt', 'watchedAt', { unique: false });
        }

        // Create playlists store
        if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
          const playlistStore = db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
          playlistStore.createIndex('name', 'name', { unique: false });
          playlistStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create cache store
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  // History operations
  async addToHistory(item: Omit<StoredHistoryItem, 'id' | 'watchedAt'>): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const historyItem: StoredHistoryItem = {
      ...item,
      id,
      watchedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      
      const request = store.add(historyItem);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getHistory(limit: number = 50): Promise<StoredHistoryItem[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HISTORY_STORE], 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      const index = store.index('watchedAt');
      
      // Get items in reverse chronological order (most recent first)
      const request = index.openCursor(null, 'prev');
      const results: StoredHistoryItem[] = [];
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearHistory(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([HISTORY_STORE], 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Playlist operations
  async createPlaylist(name: string, description?: string): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const id = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const playlist: StoredPlaylist = {
      id,
      name,
      description,
      videos: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PLAYLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      
      const request = store.add(playlist);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPlaylists(): Promise<StoredPlaylist[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PLAYLISTS_STORE], 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async addVideoToPlaylist(playlistId: string, video: StoredHistoryItem): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PLAYLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      
      const getRequest = store.get(playlistId);
      getRequest.onsuccess = () => {
        const playlist = getRequest.result;
        if (playlist) {
          // Check if video already exists in playlist
          const exists = playlist.videos.some((v: StoredHistoryItem) => v.videoId === video.videoId);
          if (!exists) {
            playlist.videos.push(video);
            playlist.updatedAt = Date.now();
            
            const putRequest = store.put(playlist);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve(); // Already exists, no need to add
          }
        } else {
          reject(new Error('Playlist not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PLAYLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      
      const request = store.delete(playlistId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache operations
  async setCache(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const expiresAt = now + (ttlMinutes * 60 * 1000);
    const cacheEntry: StoredCacheEntry = {
      key,
      data,
      timestamp: now,
      expiresAt
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      
      const request = store.put(cacheEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCache(key: string): Promise<any | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (result && Date.now() < result.expiresAt) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const index = store.index('expiresAt');
      const now = Date.now();
      
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
export const youtubeDB = new YouTubeDB();

// Utility functions for common operations
export async function addVideoToHistory(video: {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
}): Promise<void> {
  await youtubeDB.addToHistory({
    ...video,
    watchDuration: 0
  });
}

export async function getVideoHistory(): Promise<StoredHistoryItem[]> {
  return youtubeDB.getHistory();
}

export async function createUserPlaylist(name: string): Promise<string> {
  return youtubeDB.createPlaylist(name);
}

export async function getPlaylists(): Promise<StoredPlaylist[]> {
  return youtubeDB.getPlaylists();
}

export async function addVideoToPlaylist(playlistId: string, video: StoredHistoryItem): Promise<void> {
  return youtubeDB.addVideoToPlaylist(playlistId, video);
}

// Auto-cleanup expired cache on init
youtubeDB.init().then(() => {
  youtubeDB.clearExpiredCache().catch(console.error);
}).catch(console.error);