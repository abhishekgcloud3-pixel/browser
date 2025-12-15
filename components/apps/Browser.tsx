'use client';

import React, { useState } from 'react';

export const Browser = React.memo(() => {
  const [url, setUrl] = useState('https://example.com');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Address bar */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3 flex gap-2">
        <button className="px-3 py-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          ← Back
        </button>
        <button className="px-3 py-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          → Forward
        </button>
        <button className="px-3 py-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          ↻ Reload
        </button>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Browser</div>
          <div className="text-sm">Navigate to websites using the address bar</div>
        </div>
      </div>
    </div>
  );
});

Browser.displayName = 'Browser';
