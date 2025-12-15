'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { filesystemService } from '@/stores/filesystem-service';
import type { FSFile, FSDirectory } from '@/types';

const ROOT_ID = 'root';

interface FileManagerState {
  currentDirId: string;
  files: FSFile[];
  directories: FSDirectory[];
  selectedItemId: string | null;
  searchQuery: string;
  searchResults: {
    files: FSFile[];
    directories: FSDirectory[];
  } | null;
  isLoading: boolean;
  error: string | null;
}

export const FileManager = React.memo(() => {
  const [state, setState] = useState<FileManagerState>({
    currentDirId: ROOT_ID,
    files: [],
    directories: [],
    selectedItemId: null,
    searchQuery: '',
    searchResults: null,
    isLoading: true,
    error: null,
  });

  // Load directory contents
  const loadDirectory = useCallback(async (dirId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { files, directories } = await filesystemService.listDirectory(dirId);
      setState((prev) => ({
        ...prev,
        currentDirId: dirId,
        files,
        directories,
        selectedItemId: null,
        searchQuery: '',
        searchResults: null,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load directory',
        isLoading: false,
      }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDirectory(ROOT_ID);
  }, [loadDirectory]);

  // Create new file
  const handleNewFile = useCallback(async () => {
    const name = prompt('Enter file name:');
    if (!name) return;

    try {
      await filesystemService.createFile(name, '', 'text/plain', state.currentDirId);
      await loadDirectory(state.currentDirId);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create file',
      }));
    }
  }, [state.currentDirId, loadDirectory]);

  // Create new folder
  const handleNewFolder = useCallback(async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      await filesystemService.createDirectory(name, state.currentDirId);
      await loadDirectory(state.currentDirId);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      }));
    }
  }, [state.currentDirId, loadDirectory]);

  // Delete item
  const handleDelete = useCallback(async (itemId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Are you sure?')) return;

    try {
      const file = state.files.find((f) => f.id === itemId);
      if (file) {
        await filesystemService.deleteFile(itemId);
      } else {
        await filesystemService.deleteDirectory(itemId);
      }
      await loadDirectory(state.currentDirId);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete item',
      }));
    }
  }, [state.currentDirId, state.files, loadDirectory]);

  // Search
  const handleSearch = useCallback(
    async (query: string) => {
      setState((prev) => ({ ...prev, searchQuery: query }));

      if (!query.trim()) {
        setState((prev) => ({ ...prev, searchResults: null }));
        return;
      }

      try {
        const files = await filesystemService.searchFiles(query);
        const directories = await filesystemService.searchDirectories(query);
        setState((prev) => ({
          ...prev,
          searchResults: { files, directories },
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Search failed',
        }));
      }
    },
    [],
  );

  // Display items
  const displayItems = useMemo(() => {
    if (state.searchResults) {
      return {
        files: state.searchResults.files,
        directories: state.searchResults.directories,
      };
    }
    return {
      files: state.files,
      directories: state.directories,
    };
  }, [state.files, state.directories, state.searchResults]);

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 flex gap-2 items-center">
        <button
          onClick={handleNewFile}
          className="px-3 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors"
        >
          New File
        </button>
        <button
          onClick={handleNewFolder}
          className="px-3 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 transition-colors"
        >
          New Folder
        </button>
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Search..."
          value={state.searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
        />
      </div>

      {/* Error message */}
      {state.error && (
        <div className="shrink-0 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 px-3 py-2 text-sm border-b border-error-200 dark:border-error-800">
          {state.error}
        </div>
      )}

      {/* Loading */}
      {state.isLoading && (
        <div className="flex-1 flex items-center justify-center text-neutral-500">
          Loading...
        </div>
      )}

      {/* Content */}
      {!state.isLoading && (
        <div className="flex-1 overflow-auto">
          {displayItems.directories.length === 0 && displayItems.files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-neutral-500">
              No items
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {/* Directories */}
              {displayItems.directories.map((dir) => (
                <div
                  key={dir.id}
                  onClick={() => setState((prev) => ({ ...prev, selectedItemId: dir.id }))}
                  onDoubleClick={() => loadDirectory(dir.id)}
                  className={`p-2 rounded cursor-pointer flex items-center justify-between group ${
                    state.selectedItemId === dir.id
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>📁 {dir.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dir.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-error-600 hover:text-error-700 text-sm transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {/* Files */}
              {displayItems.files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setState((prev) => ({ ...prev, selectedItemId: file.id }))}
                  className={`p-2 rounded cursor-pointer flex items-center justify-between group ${
                    state.selectedItemId === file.id
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>📄 {file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-error-600 hover:text-error-700 text-sm transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FileManager.displayName = 'FileManager';
