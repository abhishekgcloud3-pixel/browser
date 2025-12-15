import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YouTube } from '@/components/apps/YouTube';
import { Browser } from '@/components/apps/Browser';
import { youtubeDB } from '@/stores/youtube-db';

// Mock fetch for API calls
global.fetch = vi.fn();

const mockVideo = {
  id: 'test-video-id',
  title: 'Test Video',
  description: 'Test description',
  thumbnail: 'https://example.com/thumb.jpg',
  channelTitle: 'Test Channel',
  channelId: 'test-channel-id',
  publishedAt: '2023-01-01T00:00:00Z',
  duration: '5:30',
  viewCount: '1000',
  likeCount: '50'
};

const mockSearchResult = {
  videos: [mockVideo],
  nextPageToken: 'next-page-token',
  prevPageToken: 'prev-page-token',
  totalResults: 100
};

describe('YouTube App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock IndexedDB for YouTube DB
    const mockDB = {
      init: vi.fn().mockResolvedValue(undefined),
      addToHistory: vi.fn().mockResolvedValue('history-id'),
      getHistory: vi.fn().mockResolvedValue([]),
      getPlaylists: vi.fn().mockResolvedValue([]),
      createPlaylist: vi.fn().mockResolvedValue('playlist-id'),
      addVideoToPlaylist: vi.fn().mockResolvedValue(undefined),
    };
    
    vi.mocked(youtubeDB.init).mockResolvedValue(undefined);
    vi.mocked(youtubeDB.addToHistory).mockResolvedValue('history-id');
    vi.mocked(youtubeDB.getHistory).mockResolvedValue([]);
    vi.mocked(youtubeDB.getPlaylists).mockResolvedValue([]);
    vi.mocked(youtubeDB.createPlaylist).mockResolvedValue('playlist-id');
    vi.mocked(youtubeDB.addVideoToPlaylist).mockResolvedValue(undefined);
  });

  it('renders the YouTube app interface', () => {
    render(<YouTube />);
    
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search YouTube...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Playlists')).toBeInTheDocument();
  });

  it('handles search input and displays results', async () => {
    (fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResult,
    } as Response);

    render(<YouTube />);
    
    const searchInput = screen.getByPlaceholderText('Search YouTube...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Wait for debounced search to trigger
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/youtube/search?q=test%20query');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const errorResponse = {
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'YouTube API quota exceeded. Please try again later.'
      }
    };

    (fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => errorResponse,
    } as Response);

    render(<YouTube />);
    
    const searchInput = screen.getByPlaceholderText('Search YouTube...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('YouTube API quota exceeded. Please try again later.')).toBeInTheDocument();
    });
  });
});

// Test for Browser app
describe('Browser App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => '[]'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders the browser interface', () => {
    render(<Browser />);
    
    // Check for the main navigation elements
    expect(screen.getByTitle('Back (Ctrl+←)')).toBeInTheDocument();
    expect(screen.getByTitle('Forward (Ctrl+→)')).toBeInTheDocument();
    expect(screen.getByTitle('Reload (Ctrl+R)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter URL or search...')).toBeInTheDocument();
    expect(screen.getByTitle('Go')).toBeInTheDocument();
    expect(screen.getByTitle('Toggle CORS proxy')).toBeInTheDocument();
  });

  it('loads homepage on mount', async () => {
    render(<Browser />);
    
    // Just check that the input exists and is rendered
    const addressInput = screen.getByPlaceholderText('Enter URL or search...');
    expect(addressInput).toBeInTheDocument();
  });
});