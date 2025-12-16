'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { YouTubeSearchResult, YouTubeVideo, ApiError } from '@/types';
import { addVideoToHistory, getVideoHistory, getPlaylists, createUserPlaylist, addVideoToPlaylist, youtubeDB } from '@/stores/youtube-db';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface LoadingSkeletonProps {
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded ${className}`} />
);

interface VideoCardProps {
  video: YouTubeVideo;
  onPlay: (video: YouTubeVideo) => void;
  onAddToPlaylist: (video: YouTubeVideo) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onAddToPlaylist }) => (
  <div className="group bg-white dark:bg-neutral-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className="aspect-video bg-neutral-200 dark:bg-neutral-700 relative cursor-pointer" onClick={() => onPlay(video)}>
      <img 
        src={video.thumbnail} 
        alt={video.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
    </div>
    <div className="p-3">
      <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-neutral-900 dark:text-neutral-100">
        {video.title}
      </h3>
      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
        {video.channelTitle}
      </p>
      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
        <span>{video.viewCount} views</span>
        <span>{video.duration}</span>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(video);
          }}
          className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
        >
          Play
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist(video);
          }}
          className="px-3 py-1 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
        >
          + List
        </button>
      </div>
    </div>
  </div>
);

interface PlayerProps {
  video: YouTubeVideo | null;
  onClose: () => void;
}

const Player: React.FC<PlayerProps> = ({ video, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (video) {
      // Add to history when video starts playing
      addVideoToHistory({
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        duration: video.duration
      }).catch(console.error);
    }
  }, [video]);

  const embedUrl = useMemo(() => {
    if (!video) return '';
    return `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`;
  }, [video]);

  if (!video) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${isFullscreen ? '' : 'm-4 rounded-lg overflow-hidden'}`}>
      {/* Player Header */}
      <div className="bg-neutral-900 text-white p-4 flex items-center justify-between">
        <h2 className="font-semibold truncate flex-1">{video.title}</h2>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-neutral-800 rounded text-sm hover:bg-neutral-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-3 py-1 bg-neutral-800 rounded text-sm hover:bg-neutral-700 transition-colors"
          >
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 bg-black flex items-center justify-center">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      </div>

      {/* Video Details */}
      {showDetails && (
        <div className="bg-neutral-800 text-white p-4 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Channel:</strong> {video.channelTitle}
            </div>
            <div>
              <strong>Duration:</strong> {video.duration}
            </div>
            <div>
              <strong>Views:</strong> {video.viewCount}
            </div>
            <div>
              <strong>Published:</strong> {new Date(video.publishedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="mt-2">
            <strong>Description:</strong>
            <p className="text-neutral-300 mt-1 text-xs line-clamp-3">
              {video.description || 'No description available.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const YouTube: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'playlists'>('search');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Search failed');
        }

        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
        setError({
          code: 'SEARCH_FAILED',
          message: err instanceof Error ? err.message : 'Failed to search YouTube'
        });
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setIsLoading(true);
      debouncedSearch(value);
    } else {
      setSearchResults(null);
      setIsLoading(false);
    }
  };

  // Load history and playlists on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyData, playlistsData] = await Promise.all([
          getVideoHistory(),
          getPlaylists()
        ]);
        setHistory(historyData);
        setPlaylists(playlistsData);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  // Handle video play
  const handlePlayVideo = (video: YouTubeVideo) => {
    setCurrentVideo(video);
    setShowPlayer(true);
  };

  // Handle add to playlist
  const handleAddToPlaylist = async (video: YouTubeVideo) => {
    if (playlists.length === 0) {
      // Create default playlist if none exist
      const playlistId = await createUserPlaylist('My Playlist');
      const playlist = { id: playlistId, name: 'My Playlist', videos: [] };
      setPlaylists(prev => [...prev, playlist]);
      await addVideoToPlaylist(playlistId, {
        id: `history_${Date.now()}`,
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        watchedAt: Date.now(),
        watchDuration: 0,
        duration: video.duration
      });
    } else {
      // Add to first playlist for simplicity
      await addVideoToPlaylist(playlists[0].id, {
        id: `history_${Date.now()}`,
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        watchedAt: Date.now(),
        watchDuration: 0,
        duration: video.duration
      });
      setPlaylists(prev => prev.map(p => p.id === playlists[0].id ? 
        { ...p, videos: [...p.videos, { id: `history_${Date.now()}`, videoId: video.id, title: video.title, thumbnail: video.thumbnail, channelTitle: video.channelTitle, watchedAt: Date.now(), watchDuration: 0, duration: video.duration }] } : p
      ));
    }
  };

  // Render search results
  const renderSearchResults = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-semibold mb-2">Error</h3>
          <p className="text-center text-sm">{error.message}</p>
          {error.code === 'QUOTA_EXCEEDED' && (
            <p className="text-xs mt-2 text-center">
              YouTube API quota exceeded. Please try again later.
            </p>
          )}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden">
              <LoadingSkeleton className="aspect-video" />
              <div className="p-3">
                <LoadingSkeleton className="h-4 mb-2" />
                <LoadingSkeleton className="h-3 w-3/4 mb-2" />
                <LoadingSkeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!searchResults?.videos?.length) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
          <div className="text-4xl mb-4">🎥</div>
          <h3 className="font-semibold mb-2">No videos found</h3>
          <p className="text-center text-sm">
            {searchQuery ? 'Try searching for something else' : 'Start typing to search YouTube'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {searchResults.videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPlay={handlePlayVideo}
            onAddToPlaylist={handleAddToPlaylist}
          />
        ))}
        
        {/* Load more button */}
        {searchResults.nextPageToken && (
          <div className="col-span-full flex justify-center mt-6">
            <button
              onClick={() => {/* TODO: Implement pagination */}}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render history
  const renderHistory = () => {
    if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
          <div className="text-4xl mb-4">🕰️</div>
          <h3 className="font-semibold mb-2">No history</h3>
          <p className="text-center text-sm">Watch some videos to build your history</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {history.map((item) => (
          <VideoCard
            key={item.id}
            video={{
              id: item.videoId,
              title: item.title,
              description: '',
              thumbnail: item.thumbnail,
              channelTitle: item.channelTitle,
              channelId: '',
              publishedAt: '',
              duration: item.duration,
              viewCount: '0'
            }}
            onPlay={(video) => handlePlayVideo(video)}
            onAddToPlaylist={(video) => handleAddToPlaylist(video)}
          />
        ))}
      </div>
    );
  };

  // Render playlists
  const renderPlaylists = () => {
    if (playlists.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-neutral-500 dark:text-neutral-400">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-semibold mb-2">No playlists</h3>
          <p className="text-center text-sm">Add videos to playlists to organize them</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-white dark:bg-neutral-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{playlist.name}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              {playlist.videos?.length || 0} videos
            </p>
            {playlist.videos && playlist.videos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {playlist.videos.slice(0, 6).map((video: any) => (
                  <div
                    key={video.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handlePlayVideo({
                      id: video.videoId,
                      title: video.title,
                      description: '',
                      thumbnail: video.thumbnail,
                      channelTitle: video.channelTitle,
                      channelId: '',
                      publishedAt: '',
                      duration: video.duration,
                      viewCount: '0'
                    })}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      {/* Header with search */}
      <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search YouTube..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2">
          {[
            { id: 'search', label: 'Search', icon: '🔍' },
            { id: 'history', label: 'History', icon: '🕰️' },
            { id: 'playlists', label: 'Playlists', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'search' && renderSearchResults()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'playlists' && renderPlaylists()}
      </div>

      {/* Player Modal */}
      {showPlayer && currentVideo && (
        <Player
          video={currentVideo}
          onClose={() => {
            setShowPlayer(false);
            setCurrentVideo(null);
          }}
        />
      )}
    </div>
  );
};

YouTube.displayName = 'YouTube';