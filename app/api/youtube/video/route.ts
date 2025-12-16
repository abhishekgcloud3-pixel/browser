import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/env.mjs';
import type { YouTubeVideo, ApiError } from '@/types';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for video details

function getCachedResponse(key: string): unknown | null {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedResponse(key: string, data: unknown): void {
  // Clean up expired entries occasionally
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now >= v.expiresAt) {
        cache.delete(k);
      }
    }
  }
  
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL
  });
}

export async function GET(request: NextRequest) {
  try {
    const { youtubeApiKey } = getEnv() as { youtubeApiKey: string };
    const searchParams = request.nextUrl.searchParams;
    
    // Validate required parameters
    const videoId = searchParams.get('id');
    
    if (!videoId) {
      const error: ApiError = {
        code: 'MISSING_VIDEO_ID',
        message: 'Video ID is required'
      };
      return NextResponse.json({ error }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `video_${videoId}`;
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=600'
        }
      });
    }

    // Build YouTube API request URL for video details
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: youtubeApiKey
    });

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 10 minutes on the server
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 403) {
        const quotaError: ApiError = {
          code: 'QUOTA_EXCEEDED',
          message: 'YouTube API quota exceeded. Please try again later.',
          details: errorData
        };
        return NextResponse.json({ error: quotaError }, { status: 429 });
      }
      
      if (response.status === 404) {
        const notFoundError: ApiError = {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found or has been removed.',
          details: errorData
        };
        return NextResponse.json({ error: notFoundError }, { status: 404 });
      }

      const apiError: ApiError = {
        code: 'YOUTUBE_API_ERROR',
        message: 'Failed to fetch video details from YouTube API',
        details: errorData
      };
      return NextResponse.json({ error: apiError }, { status: response.status });
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      const notFoundError: ApiError = {
        code: 'VIDEO_NOT_FOUND',
        message: 'Video not found.',
      };
      return NextResponse.json({ error: notFoundError }, { status: 404 });
    }

    const item = data.items[0];
    
    // Parse ISO 8601 duration (PT4M13S) to readable format
    function parseDuration(isoDuration: string): string {
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 'Unknown';
      
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Format view count
    function formatViewCount(count: string): string {
      const num = parseInt(count);
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      }
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
      return num.toString();
    }

    const video: YouTubeVideo = {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      duration: parseDuration(item.contentDetails.duration),
      viewCount: formatViewCount(item.statistics?.viewCount || '0'),
      likeCount: item.statistics?.likeCount ? formatViewCount(item.statistics.likeCount) : undefined
    };

    // Cache the response
    setCachedResponse(cacheKey, video);

    return NextResponse.json(video, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=600'
      }
    });

  } catch (error) {
    console.error('YouTube video API error:', error);
    
    const serverError: ApiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while fetching video details',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };

    return NextResponse.json({ error: serverError }, { status: 500 });
  }
}