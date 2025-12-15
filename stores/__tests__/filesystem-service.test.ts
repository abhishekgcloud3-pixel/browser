import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { filesystemService } from '../filesystem-service';
import { db } from '../db';

describe('FilesystemService', () => {
  afterEach(async () => {
    // Clear database after each test
    try {
      await db.delete();
      await db.open();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  beforeEach(async () => {
    // Clear all tables
    try {
      await db.files.clear();
      await db.directories.clear();
      await db.metadata.clear();
      await db.settings.clear();
    } catch (error) {
      // Tables might not exist yet
    }

    // Initialize defaults
    await db.directories.add({
      id: 'root',
      name: 'root',
      parentId: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await db.settings.add({
      maxSize: 50 * 1024 * 1024,
      createdAt: Date.now(),
    });

    await db.metadata.add({
      totalSize: 0,
      fileCount: 0,
      directoryCount: 1,
      lastCleanupAt: Date.now(),
    });
  });

  describe('createFile', () => {
    it('should create a file', async () => {
      const file = await filesystemService.createFile('test.txt', 'content', 'text/plain');

      expect(file.name).toBe('test.txt');
      expect(file.content).toBe('content');
      expect(file.mimeType).toBe('text/plain');
      expect(file.id).toBeDefined();

      const stored = await db.files.get(file.id);
      expect(stored).toBeDefined();
      expect(stored?.name).toBe('test.txt');
    });

    it('should throw error when quota exceeded', async () => {
      // Set very small quota
      await db.settings.clear();
      await db.settings.add({
        maxSize: 1,
        createdAt: Date.now(),
      });

      await expect(
        filesystemService.createFile('test.txt', 'large content', 'text/plain'),
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('should create file with default empty content', async () => {
      const file = await filesystemService.createFile('empty.txt');

      expect(file.content).toBe('');
      expect(file.size).toBe(0);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory', async () => {
      const dir = await filesystemService.createDirectory('my-folder');

      expect(dir.name).toBe('my-folder');
      expect(dir.id).toBeDefined();

      const stored = await db.directories.get(dir.id);
      expect(stored).toBeDefined();
      expect(stored?.name).toBe('my-folder');
    });

    it('should create directory under specific parent', async () => {
      const parentDir = await filesystemService.createDirectory('parent');
      const childDir = await filesystemService.createDirectory('child', parentDir.id);

      expect(childDir.parentId).toBe(parentDir.id);
    });
  });

  describe('readFile', () => {
    it('should read a file', async () => {
      const created = await filesystemService.createFile('test.txt', 'content');
      const read = await filesystemService.readFile(created.id);

      expect(read).toBeDefined();
      expect(read?.content).toBe('content');
    });

    it('should return undefined for non-existent file', async () => {
      const result = await filesystemService.readFile('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('updateFile', () => {
    it('should update file content', async () => {
      const file = await filesystemService.createFile('test.txt', 'original');
      await filesystemService.updateFile(file.id, { content: 'updated' });

      const updated = await db.files.get(file.id);
      expect(updated?.content).toBe('updated');
      expect(updated?.updatedAt).toBeGreaterThan(file.updatedAt);
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        filesystemService.updateFile('non-existent', { content: 'test' }),
      ).rejects.toThrow('File not found');
    });

    it('should update file size when content changes', async () => {
      const file = await filesystemService.createFile('test.txt', 'a');
      const originalSize = file.size;

      await filesystemService.updateFile(file.id, { content: 'longer content' });

      const updated = await db.files.get(file.id);
      expect(updated?.size).toBeGreaterThan(originalSize);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const file = await filesystemService.createFile('test.txt');
      await filesystemService.deleteFile(file.id);

      const deleted = await db.files.get(file.id);
      expect(deleted).toBeUndefined();
    });

    it('should throw error for non-existent file', async () => {
      await expect(filesystemService.deleteFile('non-existent')).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('deleteDirectory', () => {
    it('should delete a directory', async () => {
      const dir = await filesystemService.createDirectory('test');
      await filesystemService.deleteDirectory(dir.id);

      const deleted = await db.directories.get(dir.id);
      expect(deleted).toBeUndefined();
    });

    it('should delete directory recursively', async () => {
      const parentDir = await filesystemService.createDirectory('parent');
      const childDir = await filesystemService.createDirectory('child', parentDir.id);
      const file = await filesystemService.createFile('file.txt', '', 'text/plain', childDir.id);

      await filesystemService.deleteDirectory(parentDir.id);

      expect(await db.directories.get(parentDir.id)).toBeUndefined();
      expect(await db.directories.get(childDir.id)).toBeUndefined();
      expect(await db.files.get(file.id)).toBeUndefined();
    });

    it('should throw error when deleting root', async () => {
      await expect(filesystemService.deleteDirectory('root')).rejects.toThrow(
        'Cannot delete root directory',
      );
    });
  });

  describe('listDirectory', () => {
    it('should list files and directories', async () => {
      const dir = await filesystemService.createDirectory('folder');
      const file = await filesystemService.createFile('file.txt');

      const { files, directories } = await filesystemService.listDirectory('root');

      expect(files).toContainEqual(expect.objectContaining({ id: file.id }));
      expect(directories).toContainEqual(expect.objectContaining({ id: dir.id }));
    });

    it('should list items in specific directory', async () => {
      const parentDir = await filesystemService.createDirectory('parent');
      const childDir = await filesystemService.createDirectory('child', parentDir.id);
      const file = await filesystemService.createFile('file.txt', '', 'text/plain', parentDir.id);

      const { files, directories } = await filesystemService.listDirectory(parentDir.id);

      expect(directories).toContainEqual(expect.objectContaining({ id: childDir.id }));
      expect(files).toContainEqual(expect.objectContaining({ id: file.id }));
    });

    it('should return empty arrays for empty directory', async () => {
      const dir = await filesystemService.createDirectory('empty');
      const { files, directories } = await filesystemService.listDirectory(dir.id);

      expect(files).toEqual([]);
      expect(directories).toEqual([]);
    });
  });

  describe('moveFile', () => {
    it('should move file to different directory', async () => {
      const sourceDir = await filesystemService.createDirectory('source');
      const targetDir = await filesystemService.createDirectory('target');
      const file = await filesystemService.createFile('file.txt', '', 'text/plain', sourceDir.id);

      await filesystemService.moveFile(file.id, targetDir.id);

      const updated = await db.files.get(file.id);
      expect(updated?.parentId).toBe(targetDir.id);
    });

    it('should throw error for non-existent file', async () => {
      await expect(filesystemService.moveFile('non-existent', 'root')).rejects.toThrow(
        'File not found',
      );
    });
  });

  describe('moveDirectory', () => {
    it('should move directory to different parent', async () => {
      const parentDir = await filesystemService.createDirectory('parent');
      const targetDir = await filesystemService.createDirectory('target');
      const moveDir = await filesystemService.createDirectory('move', parentDir.id);

      await filesystemService.moveDirectory(moveDir.id, targetDir.id);

      const updated = await db.directories.get(moveDir.id);
      expect(updated?.parentId).toBe(targetDir.id);
    });

    it('should throw error when moving root', async () => {
      await expect(filesystemService.moveDirectory('root', 'target')).rejects.toThrow(
        'Cannot move root directory',
      );
    });
  });

  describe('searchFiles', () => {
    it('should search files by name', async () => {
      await filesystemService.createFile('test.txt');
      await filesystemService.createFile('document.pdf');
      await filesystemService.createFile('test-copy.txt');

      const results = await filesystemService.searchFiles('test');

      expect(results.length).toBe(2);
      expect(results.map((f) => f.name)).toContain('test.txt');
      expect(results.map((f) => f.name)).toContain('test-copy.txt');
    });

    it('should be case-insensitive', async () => {
      await filesystemService.createFile('MyFile.txt');

      const results = await filesystemService.searchFiles('myfile');

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('MyFile.txt');
    });
  });

  describe('searchDirectories', () => {
    it('should search directories by name', async () => {
      await filesystemService.createDirectory('project-a');
      await filesystemService.createDirectory('document');
      await filesystemService.createDirectory('project-b');

      const results = await filesystemService.searchDirectories('project');

      expect(results.length).toBe(2);
      expect(results.map((d) => d.name)).toContain('project-a');
      expect(results.map((d) => d.name)).toContain('project-b');
    });
  });

  describe('getPath', () => {
    it('should get path for file', async () => {
      const dir = await filesystemService.createDirectory('folder');
      const file = await filesystemService.createFile('file.txt', '', 'text/plain', dir.id);

      const path = await filesystemService.getPath(file.id);

      expect(path).toBe('/folder/file.txt');
    });

    it('should get path for nested items', async () => {
      const dir1 = await filesystemService.createDirectory('dir1');
      const dir2 = await filesystemService.createDirectory('dir2', dir1.id);
      const file = await filesystemService.createFile('file.txt', '', 'text/plain', dir2.id);

      const path = await filesystemService.getPath(file.id);

      expect(path).toBe('/dir1/dir2/file.txt');
    });
  });

  describe('getQuotaInfo', () => {
    it('should return quota information', async () => {
      const quota = await filesystemService.getQuotaInfo();

      expect(quota.maxSize).toBe(50 * 1024 * 1024);
      expect(quota.usedSize).toBe(0);
      expect(quota.usedPercent).toBe(0);
      expect(quota.remaining).toBe(50 * 1024 * 1024);
    });

    it('should calculate used size correctly', async () => {
      const content = 'test content';
      await filesystemService.createFile('file.txt', content);

      const quota = await filesystemService.getQuotaInfo();

      expect(quota.usedSize).toBeGreaterThan(0);
      expect(quota.usedPercent).toBeGreaterThan(0);
      expect(quota.usedPercent).toBeLessThan(1);
    });
  });

  describe('exportData', () => {
    it('should export all data', async () => {
      await filesystemService.createFile('file.txt', 'content');
      await filesystemService.createDirectory('folder');

      const exported = await filesystemService.exportData();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe(1);
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.files).toBeDefined();
      expect(parsed.directories).toBeDefined();
    });
  });

  describe('clearAll', () => {
    it('should clear all data', async () => {
      await filesystemService.createFile('file.txt');
      await filesystemService.createDirectory('folder');

      await filesystemService.clearAll();

      const files = await db.files.toArray();
      const directories = await db.directories.toArray();

      expect(files).toEqual([]);
      expect(directories).toEqual([]);
    });
  });
});
