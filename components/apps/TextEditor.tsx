'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { filesystemService } from '@/stores/filesystem-service';
import type { FSFile } from '@/types';

const AUTOSAVE_DELAY = 2000; // 2 seconds

interface TextEditorState {
  currentFile: FSFile | null;
  content: string;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
  lastSavedAt: number | null;
}

export const TextEditor = React.memo(() => {
  const [state, setState] = useState<TextEditorState>({
    currentFile: null,
    content: '',
    isDirty: false,
    isSaving: false,
    error: null,
    lastSavedAt: null,
  });

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create new file on mount
  useEffect(() => {
    const initializeFile = async () => {
      try {
        const file = await filesystemService.createFile(
          `untitled-${Date.now()}.txt`,
          '',
          'text/plain',
          'root',
        );
        setState((prev) => ({
          ...prev,
          currentFile: file,
          content: file.content,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to create file',
        }));
      }
    };

    initializeFile();
  }, []);

  // Autosave effect
  useEffect(() => {
    if (!state.isDirty || !state.currentFile) return;

    // Clear previous timeout
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    // Set new autosave timeout
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setState((prev) => ({ ...prev, isSaving: true, error: null }));
        await filesystemService.updateFile(state.currentFile!.id, {
          content: state.content,
        });
        setState((prev) => ({
          ...prev,
          isDirty: false,
          isSaving: false,
          lastSavedAt: Date.now(),
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: error instanceof Error ? error.message : 'Failed to save file',
        }));
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [state.isDirty, state.currentFile, state.content]);

  // Handle content change
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState((prev) => ({
      ...prev,
      content: e.target.value,
      isDirty: true,
    }));
  }, []);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!state.currentFile) return;

    try {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      await filesystemService.updateFile(state.currentFile.id, {
        content: state.content,
      });
      setState((prev) => ({
        ...prev,
        isDirty: false,
        isSaving: false,
        lastSavedAt: Date.now(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save file',
      }));
    }
  }, [state.currentFile, state.content]);

  // Rename file
  const handleRename = useCallback(async () => {
    if (!state.currentFile) return;

    const newName = prompt('Enter new name:', state.currentFile.name);
    if (!newName) return;

    try {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));
      await filesystemService.updateFile(state.currentFile.id, {
        name: newName,
      });
      setState((prev) => ({
        ...prev,
        currentFile: prev.currentFile ? { ...prev.currentFile, name: newName } : null,
        isSaving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to rename file',
      }));
    }
  }, [state.currentFile]);

  if (!state.currentFile) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3 flex gap-2 items-center">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {state.currentFile.name}
          </span>
          {state.isDirty && (
            <span className="text-xs text-warning-600 dark:text-warning-400">unsaved</span>
          )}
          {state.isSaving && (
            <span className="text-xs text-primary-600 dark:text-primary-400">saving...</span>
          )}
        </div>

        <button
          onClick={handleRename}
          className="px-3 py-1.5 text-neutral-700 dark:text-neutral-300 rounded text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        >
          Rename
        </button>

        <button
          onClick={handleSave}
          disabled={!state.isDirty || state.isSaving}
          className="px-3 py-1.5 bg-primary-500 text-white rounded text-sm hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>

      {/* Error message */}
      {state.error && (
        <div className="shrink-0 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 px-3 py-2 text-sm border-b border-error-200 dark:border-error-800">
          {state.error}
        </div>
      )}

      {/* Last saved indicator */}
      {state.lastSavedAt && !state.isDirty && (
        <div className="shrink-0 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 px-3 py-1 text-xs border-b border-success-200 dark:border-success-800">
          Last saved: {new Date(state.lastSavedAt).toLocaleTimeString()}
        </div>
      )}

      {/* Editor */}
      <textarea
        value={state.content}
        onChange={handleContentChange}
        className="flex-1 resize-none p-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-none outline-none font-mono text-sm"
        placeholder="Start typing..."
      />
    </div>
  );
});

TextEditor.displayName = 'TextEditor';
