import Dexie, { type Table } from 'dexie';
import type { FSFile, FSDirectory, FSMetadata } from '@/types';

export interface StorageSettings {
  id?: number;
  maxSize: number;
  createdAt: number;
}

export class FilesystemDB extends Dexie {
  files!: Table<FSFile>;
  directories!: Table<FSDirectory>;
  metadata!: Table<FSMetadata>;
  settings!: Table<StorageSettings>;

  constructor() {
    super('DesktopFilesystem');
    this.version(1).stores({
      files: '++id, parentId, name',
      directories: '++id, parentId, name',
      metadata: '++id',
      settings: '++id',
    });
  }
}

let dbInstance: FilesystemDB | null = null;

export function getDB(): FilesystemDB {
  // Only create DB instance on client side
  if (typeof window === 'undefined') {
    throw new Error('FilesystemDB can only be used on the client side');
  }
  
  if (!dbInstance) {
    dbInstance = new FilesystemDB();
  }
  return dbInstance;
}

// Lazy initialization - only create DB when accessed on client
export const db = typeof window !== 'undefined' ? getDB() : ({} as FilesystemDB);

// Initialize database with root directory and default settings
export async function initializeDatabase() {
  try {
    const rootCount = await db.directories.where('name').equals('root').count();
    if (rootCount === 0) {
      const rootId = 'root';
      await db.directories.add({
        id: rootId,
        name: 'root',
        parentId: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      // 50MB default quota
      await db.settings.add({
        maxSize: 50 * 1024 * 1024,
        createdAt: Date.now(),
      });
    }

    const metadataCount = await db.metadata.count();
    if (metadataCount === 0) {
      await db.metadata.add({
        totalSize: 0,
        fileCount: 0,
        directoryCount: 1,
        lastCleanupAt: Date.now(),
      });
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}
