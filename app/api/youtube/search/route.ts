import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/env.mjs';
import type { YouTubeSearchResult, ApiError } from '@/types';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: URLSearchParams): string {
  return Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function getCachedResponse(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCachedResponse(key: string, data: any): void {
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
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '12';
    const pageToken = searchParams.get('pageToken');
    
    if (!query) {
      const error: ApiError = {
        code: 'MISSING_QUERY',
        message: 'Search query is required'
      };
      return NextResponse.json({ error }, { status: 400 });
    }

    // Check cache first
    const cacheKey = getCacheKey(searchParams);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300'
        }
      });
    }

    // Build YouTube API request URL
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults,
      key: youtubeApiKey,
      order: 'relevance',
      videoDuration: 'any',
      videoDefinition: 'any',
      safeSearch: 'moderate'
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 5 minutes on the server
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific YouTube API errors
      if (response.status === 403) {
        const quotaError: ApiError = {
          code: 'QUOTA_EXCEEDED',
          message: 'YouTube API quota exceeded. Please try again later.',
          details: errorData
        };
        return NextResponse.json({ error: quotaError }, { status: 429 });
      }
      
      if (response.status === 400) {
        const validationError: ApiError = {
          code: 'INVALID_REQUEST',
          message: 'Invalid search parameters provided.',
          details: errorData
        };
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const apiError: ApiError = {
        code: 'YOUTUBE_API_ERROR',
        message: 'Failed to fetch data from YouTube API',
        details: errorData
      };
      return NextResponse.json({ error: apiError }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform the response to our interface
    const result: YouTubeSearchResult = {
      videos: data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        duration: 'Unknown', // Will be populated by video details API
        viewCount: '0',
        likeCount: undefined
      })),
      nextPageToken: data.nextPageToken,
      prevPageToken: data.prevPageToken,
      totalResults: parseInt(data.pageInfo?.totalResults || '0')
    };

    // Cache the response
    setCachedResponse(cacheKey, result);

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('YouTube search API error:', error);
    
    const serverError: ApiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while searching YouTube',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };

    return NextResponse.json({ error: serverError }, { status: 500 });
  }
}