import { db } from './db';
import type { FSFile, FSDirectory, QuotaInfo } from '@/types';

const ROOT_ID = 'root';

export class FilesystemService {
  /**
   * Create a new directory
   */
  async createDirectory(name: string, parentId: string = ROOT_ID): Promise<FSDirectory> {
    const id = `dir-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const directory: FSDirectory = {
      id,
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
    };

    await db.directories.add(directory);
    await this.updateMetadata();
    return directory;
  }

  /**
   * Create a new file
   */
  async createFile(
    name: string,
    content: string = '',
    mimeType: string = 'text/plain',
    parentId: string = ROOT_ID,
  ): Promise<FSFile> {
    const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const size = new Blob([content]).size;

    const file: FSFile = {
      id,
      name,
      parentId,
      content,
      mimeType,
      createdAt: now,
      updatedAt: now,
      size,
    };

    // Check quota - simulate adding the file
    const files = await db.files.toArray();
    const metadata = await db.metadata.toArray();
    const settings = await db.settings.toArray();

    const maxSize = settings[0]?.maxSize || 50 * 1024 * 1024;
    const currentUsedSize = files.reduce((sum, f) => sum + f.size, 0);
    const newTotalSize = currentUsedSize + size;

    if (newTotalSize > maxSize) {
      throw new Error('Storage quota exceeded');
    }

    await db.files.add(file);
    await this.updateMetadata();
    return file;
  }

  /**
   * Read a file
   */
  async readFile(fileId: string): Promise<FSFile | undefined> {
    return db.files.get(fileId);
  }

  /**
   * Update a file
   */
  async updateFile(fileId: string, updates: Partial<FSFile>): Promise<void> {
    const file = await db.files.get(fileId);
    if (!file) throw new Error('File not found');

    const now = Date.now();
    const newContent = updates.content ?? file.content;
    const newSize = new Blob([newContent]).size;

    await db.files.update(fileId, {
      ...updates,
      updatedAt: now,
      size: newSize,
    });

    await this.updateMetadata();
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await db.files.get(fileId);
    if (!file) throw new Error('File not found');

    await db.files.delete(fileId);
    await this.updateMetadata();
  }

  /**
   * Delete a directory and all contents
   */
  async deleteDirectory(dirId: string): Promise<void> {
    if (dirId === ROOT_ID) {
      throw new Error('Cannot delete root directory');
    }

    // Delete all files in directory
    const files = await db.files.where('parentId').equals(dirId).toArray();
    for (const file of files) {
      await db.files.delete(file.id);
    }

    // Delete all subdirectories recursively
    const dirs = await db.directories.where('parentId').equals(dirId).toArray();
    for (const dir of dirs) {
      await this.deleteDirectory(dir.id);
    }

    // Delete the directory itself
    await db.directories.delete(dirId);
    await this.updateMetadata();
  }

  /**
   * List files and directories in a directory
   */
  async listDirectory(dirId: string = ROOT_ID): Promise<{
    files: FSFile[];
    directories: FSDirectory[];
  }> {
    const files = await db.files.where('parentId').equals(dirId).toArray();
    const directories = await db.directories.where('parentId').equals(dirId).toArray();
    return { files, directories };
  }

  /**
   * Move a file to another directory
   */
  async moveFile(fileId: string, newParentId: string): Promise<void> {
    const file = await db.files.get(fileId);
    if (!file) throw new Error('File not found');

    await db.files.update(fileId, {
      parentId: newParentId,
      updatedAt: Date.now(),
    });

    await this.updateMetadata();
  }

  /**
   * Move a directory to another directory
   */
  async moveDirectory(dirId: string, newParentId: string): Promise<void> {
    if (dirId === ROOT_ID) {
      throw new Error('Cannot move root directory');
    }

    const dir = await db.directories.get(dirId);
    if (!dir) throw new Error('Directory not found');

    await db.directories.update(dirId, {
      parentId: newParentId,
      updatedAt: Date.now(),
    });

    await this.updateMetadata();
  }

  /**
   * Search for files by name
   */
  async searchFiles(query: string): Promise<FSFile[]> {
    const allFiles = await db.files.toArray();
    const lowerQuery = query.toLowerCase();
    return allFiles.filter((file) => file.name.toLowerCase().includes(lowerQuery));
  }

  /**
   * Search for directories by name
   */
  async searchDirectories(query: string): Promise<FSDirectory[]> {
    const allDirs = await db.directories.toArray();
    const lowerQuery = query.toLowerCase();
    return allDirs.filter((dir) => dir.name.toLowerCase().includes(lowerQuery));
  }

  /**
   * Get path for a file or directory
   */
  async getPath(itemId: string): Promise<string> {
    const parts: string[] = [];
    let currentId = itemId;

    while (currentId && currentId !== ROOT_ID) {
      const file = await db.files.get(currentId);
      if (file) {
        parts.unshift(file.name);
        currentId = file.parentId;
      } else {
        const dir = await db.directories.get(currentId);
        if (dir) {
          parts.unshift(dir.name);
          currentId = dir.parentId;
        } else {
          break;
        }
      }
    }

    return '/' + parts.join('/');
  }

  /**
   * Get quota information
   */
  async getQuotaInfo(): Promise<QuotaInfo> {
    const settings = await db.settings.toArray();
    const maxSize = settings[0]?.maxSize || 50 * 1024 * 1024;

    const metadata = await db.metadata.toArray();
    const usedSize = metadata[0]?.totalSize || 0;
    const usedPercent = (usedSize / maxSize) * 100;
    const remaining = maxSize - usedSize;

    return {
      maxSize,
      usedSize,
      usedPercent,
      remaining,
    };
  }

  /**
   * Update metadata (total size, file count, etc.)
   */
  private async updateMetadata(): Promise<void> {
    try {
      const files = await db.files.toArray();
      const directories = await db.directories.toArray();

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const fileCount = files.length;
      const directoryCount = directories.length;

      const metadata = await db.metadata.toArray();
      if (metadata.length > 0) {
        await db.metadata.update(metadata[0].id!, {
          totalSize,
          fileCount,
          directoryCount,
          lastCleanupAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }

  /**
   * Export all data (for backup)
   */
  async exportData(): Promise<string> {
    const files = await db.files.toArray();
    const directories = await db.directories.toArray();
    const metadata = await db.metadata.toArray();
    const settings = await db.settings.toArray();

    return JSON.stringify(
      {
        version: 1,
        timestamp: Date.now(),
        files,
        directories,
        metadata,
        settings,
      },
      null,
      2,
    );
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    await db.files.clear();
    await db.directories.clear();
    await db.metadata.clear();
    await db.settings.clear();
  }
}

export const filesystemService = new FilesystemService();
