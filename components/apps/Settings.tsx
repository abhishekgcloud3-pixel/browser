'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { filesystemService } from '@/stores/filesystem-service';
import type { QuotaInfo } from '@/types';

interface SettingsState {
  quotaInfo: QuotaInfo | null;
  isExporting: boolean;
  error: string | null;
}

export const Settings = React.memo(() => {
  const [state, setState] = useState<SettingsState>({
    quotaInfo: null,
    isExporting: false,
    error: null,
  });

  const theme = useSettingsStore((s) => s.settings.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  // Load quota info
  useEffect(() => {
    const loadQuota = async () => {
      try {
        const quota = await filesystemService.getQuotaInfo();
        setState((prev) => ({ ...prev, quotaInfo: quota }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load quota',
        }));
      }
    };

    loadQuota();
    const interval = setInterval(loadQuota, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle theme change
  const handleThemeChange = useCallback(
    (newTheme: 'light' | 'dark' | 'system') => {
      setTheme(newTheme);
      setState((prev) => ({ ...prev, error: null }));
    },
    [setTheme],
  );

  // Export data
  const handleExport = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));
      const data = await filesystemService.exportData();

      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filesystem-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState((prev) => ({ ...prev, isExporting: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
      }));
    }
  }, []);

  // Clear storage
  const handleClearStorage = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.confirm('This will delete all files and folders. Are you sure?')) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, error: null }));
      await filesystemService.clearAll();
      const quota = await filesystemService.getQuotaInfo();
      setState((prev) => ({ ...prev, quotaInfo: quota }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to clear storage',
      }));
    }
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 overflow-auto">
      <div className="max-w-2xl mx-auto w-full p-6 space-y-6">
        {/* Error message */}
        {state.error && (
          <div className="bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg text-sm border border-error-200 dark:border-error-800">
            {state.error}
          </div>
        )}

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Appearance
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Theme
              </label>
              <div className="flex gap-3">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t as 'light' | 'dark' | 'system')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === t
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Storage & Quota
          </h2>

          {state.quotaInfo && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-neutral-700 dark:text-neutral-300">Used Space</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                    {formatBytes(state.quotaInfo.usedSize)} / {formatBytes(state.quotaInfo.maxSize)}
                  </span>
                </div>

                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      state.quotaInfo.usedPercent >= 90
                        ? 'bg-error-500'
                        : state.quotaInfo.usedPercent >= 70
                          ? 'bg-warning-500'
                          : 'bg-success-500'
                    }`}
                    style={{ width: `${Math.min(state.quotaInfo.usedPercent, 100)}%` }}
                  />
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                  {state.quotaInfo.usedPercent.toFixed(1)}% used
                  {state.quotaInfo.usedPercent >= 90 && (
                    <span className="text-error-600 dark:text-error-400 ml-2">
                      ⚠️ Storage nearly full
                    </span>
                  )}
                  {state.quotaInfo.usedPercent >= 70 && state.quotaInfo.usedPercent < 90 && (
                    <span className="text-warning-600 dark:text-warning-400 ml-2">
                      ⚠️ Storage running low
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                <p>Files: <span className="font-medium">{state.quotaInfo.usedSize > 0 ? 'Multiple' : '0'}</span></p>
              </div>
            </div>
          )}

          {!state.quotaInfo && (
            <div className="text-neutral-500 dark:text-neutral-400">Loading quota information...</div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Auto-save Enabled
              </label>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Show Timestamps
              </label>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Data Management
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={state.isExporting}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {state.isExporting ? 'Exporting...' : 'Export Data'}
            </button>

            <button
              onClick={handleClearStorage}
              className="w-full px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors text-sm font-medium"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

Settings.displayName = 'Settings';
