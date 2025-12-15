/**
 * Type definitions for the YouTube App
 */

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
