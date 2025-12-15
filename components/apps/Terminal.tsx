'use client';

import React from 'react';

export const Terminal = React.memo(() => {
  return (
    <div className="h-full flex flex-col bg-neutral-900 text-green-400 font-mono text-sm p-4">
      <div className="flex-1 overflow-auto space-y-1">
        <div>$ Terminal coming soon...</div>
        <div>$ Type &apos;help&apos; for available commands</div>
      </div>
      <input
        type="text"
        placeholder="$ "
        className="bg-neutral-900 text-green-400 border-none outline-none font-mono text-sm"
      />
    </div>
  );
});

Terminal.displayName = 'Terminal';
