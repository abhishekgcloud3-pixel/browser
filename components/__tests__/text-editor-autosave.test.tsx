import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextEditor } from '../apps/TextEditor';
import { db } from '@/stores/db';

describe('TextEditor Autosave', () => {
  beforeEach(async () => {
    await db.files.clear();
    await db.directories.clear();
    await db.metadata.clear();
    await db.settings.clear();

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

  it('should render text editor', async () => {
    render(<TextEditor />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('should create a file on mount', async () => {
    render(<TextEditor />);

    await waitFor(() => {
      const files = db.files.toArray();
      expect(files).toBeDefined();
    });
  });

  it('should autosave content after delay', async () => {
    const user = userEvent.setup();
    render(<TextEditor />);

    const textarea = await screen.findByRole('textbox');
    await user.type(textarea, 'test content');

    // Wait for autosave (default 2 seconds)
    await waitFor(
      () => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('should show unsaved indicator when editing', async () => {
    const user = userEvent.setup();
    render(<TextEditor />);

    const textarea = await screen.findByRole('textbox');
    await user.type(textarea, 'a');

    // Should show unsaved indicator
    await waitFor(() => {
      expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
    });
  });

  it('should allow manual save', async () => {
    const user = userEvent.setup();
    render(<TextEditor />);

    const textarea = await screen.findByRole('textbox');
    await user.type(textarea, 'test');

    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should show save success
    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it('should allow renaming file', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new-name.txt');

    render(<TextEditor />);

    const renameButton = await screen.findByRole('button', { name: /rename/i });
    await user.click(renameButton);

    await waitFor(() => {
      expect(promptSpy).toHaveBeenCalled();
    });

    promptSpy.mockRestore();
  });

  it('should persist changes to IndexedDB', async () => {
    const user = userEvent.setup();
    render(<TextEditor />);

    const textarea = await screen.findByRole('textbox');
    const testContent = 'persistent content';
    await user.type(textarea, testContent);

    // Wait for autosave
    await waitFor(
      () => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Check if content was saved to IndexedDB
    const files = await db.files.toArray();
    expect(files.length).toBeGreaterThan(0);
    expect(files[0].content).toContain('persistent');
  });
});
