'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { BrowserHistoryItem } from '@/types';

interface LoadingIndicatorProps {
  isLoading: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isLoading }) => (
  <div className="h-1 bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
    <div
      className={`h-full bg-blue-500 transition-all duration-300 ${
        isLoading ? 'w-full' : 'w-0'
      }`}
      style={{
        animation: isLoading ? 'progress 2s ease-in-out infinite' : 'none'
      }}
    />
    <style jsx>{`
      @keyframes progress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

const validateUrl = (input: string): string => {
  // If it looks like a search query (contains spaces or no dots), treat as search
  if (input.includes(' ') || !input.includes('.')) {
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }

  // Add protocol if missing
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    input = 'https://' + input;
  }

  try {
    new URL(input);
    return input;
  } catch {
    // If URL parsing fails, treat as search
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }
};

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

// Initialize history from localStorage
function getInitialHistory(): BrowserHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const savedHistory = localStorage.getItem('browser-history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (err) {
    console.error('Failed to load browser history:', err);
    return [];
  }
}

export const Browser = React.memo(() => {
  const [currentUrl, setCurrentUrl] = useState('https://example.com');
  const [displayUrl, setDisplayUrl] = useState('https://example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [history, setHistory] = useState<BrowserHistoryItem[]>(getInitialHistory);
  const [historyIndex, setHistoryIndex] = useState(() => {
    const initialHistory = getInitialHistory();
    return initialHistory.length > 0 ? initialHistory.length - 1 : -1;
  });
  const [error, setError] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);

  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('browser-history', JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save browser history:', err);
    }
  }, [history]);

  // Add current page to history
  const addToHistory = useCallback((url: string, title: string) => {
    const historyItem: BrowserHistoryItem = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      title,
      timestamp: Date.now()
    };

    setHistory(prev => {
      // Remove forward history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(historyItem);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Handle navigation
  const navigate = useCallback((url: string) => {
    const validatedUrl = validateUrl(url);
    setCurrentUrl(validatedUrl);
    setDisplayUrl(url);
    setIsLoading(true);
    setError(null);
    setCanGoBack(historyIndex > 0);
    setCanGoForward(historyIndex < history.length - 1);
  }, [historyIndex, history.length]);

  // Handle address bar form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      navigate(inputRef.current.value);
    }
  }, [navigate]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Try to get the page title from iframe content
    try {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        const title = iframeRef.current.contentDocument.title || extractDomain(currentUrl);
        addToHistory(currentUrl, title);
      } else {
        // For cross-origin iframes, we can't access the content
        addToHistory(currentUrl, extractDomain(currentUrl) || 'Web Page');
      }
    } catch {
      // Cross-origin access denied, use domain as title
      addToHistory(currentUrl, extractDomain(currentUrl) || 'Web Page');
    }
  }, [currentUrl, addToHistory]);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load the webpage. The site may be blocking iframe embedding or is not available.');
  }, []);

  // Navigation functions
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevItem = history[newIndex];
      setCurrentUrl(prevItem.url);
      setDisplayUrl(prevItem.url);
      setHistoryIndex(newIndex);
      setCanGoBack(newIndex > 0);
      setCanGoForward(true);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextItem = history[newIndex];
      setCurrentUrl(nextItem.url);
      setDisplayUrl(nextItem.url);
      setHistoryIndex(newIndex);
      setCanGoBack(true);
      setCanGoForward(newIndex < history.length - 1);
    }
  }, [history, historyIndex]);

  const reload = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      setError(null);
      // Force iframe reload by resetting src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, []);

  // Load homepage on first render (only if not already loaded)
  useEffect(() => {
    if (!isInitializedRef.current && history.length === 0) {
      isInitializedRef.current = true;
      // Directly update state for initial load to avoid cascading renders
      const initialUrl = 'https://example.com';
      setCurrentUrl(initialUrl);
      setDisplayUrl(initialUrl);
      setIsLoading(true);
      setCanGoBack(false);
      setCanGoForward(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'l':
            e.preventDefault();
            inputRef.current?.focus();
            break;
          case 'r':
            e.preventDefault();
            reload();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            goBack();
            break;
          case 'ArrowRight':
            e.preventDefault();
            goForward();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward, reload]);

  // Get iframe source URL
  const getIframeSrc = useCallback(() => {
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
    }
    return currentUrl;
  }, [currentUrl, useProxy]);

  // Handle proxy toggle
  const handleToggleProxy = useCallback(() => {
    setUseProxy(prev => !prev);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Loading indicator */}
      <LoadingIndicator isLoading={isLoading} />

      {/* Navigation bar */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3">
        <div className="flex gap-2 items-center">
          {/* Navigation buttons */}
          <div className="flex gap-1">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Back (Ctrl+←)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Forward (Ctrl+→)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={reload}
              disabled={isLoading}
              className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              title="Reload (Ctrl+R)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Address bar */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={displayUrl}
              onChange={(e) => setDisplayUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter URL or search..."
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Go"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleProxy}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                useProxy
                  ? 'bg-orange-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
              }`}
              title="Toggle CORS proxy"
            >
              Proxy
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-4">
            {isLoading && <span>Loading...</span>}
            {error && <span className="text-red-500">Error: {error}</span>}
            {!isLoading && !error && currentUrl && (
              <span>Connected to {extractDomain(currentUrl)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>{history.length} pages visited</span>
            {useProxy && <span className="text-orange-600">Using proxy</span>}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 bg-white dark:bg-neutral-900">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400 p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="font-semibold mb-2">Navigation Error</h3>
            <p className="text-center text-sm mb-4">{error}</p>
            <div className="text-xs text-neutral-400 text-center space-y-1">
              <p>• The website may be blocking iframe embedding</p>
              <p>• Try using the CORS proxy for external websites</p>
              <p>• Some sites require HTTPS or specific headers</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={getIframeSrc()}
            className="w-full h-full border-0"
            title="Web content"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads allow-pointer-lock"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allowFullScreen
          />
        )}
      </div>

      {/* Quick access shortcuts */}
      <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-2">
        <div className="flex flex-wrap gap-2">
          {[
            { url: 'https://www.google.com', label: 'Google' },
            { url: 'https://www.youtube.com', label: 'YouTube' },
            { url: 'https://github.com', label: 'GitHub' },
            { url: 'https://stackoverflow.com', label: 'Stack Overflow' },
            { url: 'https://news.ycombinator.com', label: 'Hacker News' }
          ].map((shortcut) => (
            <button
              key={shortcut.url}
              onClick={() => navigate(shortcut.url)}
              className="px-2 py-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-xs hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
            >
              {shortcut.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

Browser.displayName = 'Browser';
