import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types';

// Allowed domains list for security
const ALLOWED_DOMAINS = new Set([
  'example.com',
  'jsonplaceholder.typicode.com',
  'httpbin.org',
  'api.github.com',
  'news.ycombinator.com',
  'wikipedia.org',
  'stackoverflow.com'
]);

// Blocked URL patterns for security
const BLOCKED_PATTERNS = [
  /localhost/,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /192\.168\./,
  /10\./,
  /172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /file:/,
  /javascript:/,
  /data:/,
  /about:blank/
];

function isAllowedUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Check if domain is in allowed list
    if (!ALLOWED_DOMAINS.has(urlObj.hostname)) {
      return false;
    }
    
    // Check against blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(url)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      const error: ApiError = {
        code: 'MISSING_URL',
        message: 'Target URL is required'
      };
      return NextResponse.json({ error }, { status: 400 });
    }

    // Validate URL
    if (!isAllowedUrl(targetUrl)) {
      const error: ApiError = {
        code: 'URL_NOT_ALLOWED',
        message: 'This URL is not allowed through the proxy for security reasons'
      };
      return NextResponse.json({ error }, { status: 403 });
    }

    // Fetch the target URL
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      const proxyError: ApiError = {
        code: 'PROXY_REQUEST_FAILED',
        message: `Failed to fetch from target URL: ${response.status} ${response.statusText}`
      };
      return NextResponse.json({ error: proxyError }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    
    // For HTML content, we can proxy it directly but with some modifications
    if (contentType.includes('text/html')) {
      let html = await response.text();
      
      // Basic HTML proxy - in a real implementation, you'd want to:
      // 1. Rewrite all URLs to go through the proxy
      // 2. Remove or modify CSP headers
      // 3. Handle relative URLs
      // 4. Remove dangerous elements
      
      // For now, we'll add a simple warning and return as-is
      html = html.replace(
        /<head>/i,
        `<head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https: http:;">
        <!-- Content proxied through desktop browser app -->
        `
      );
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Proxy-Status': 'success'
        }
      });
    }
    
    // For JSON and other content types, proxy directly
    const content = await response.text();
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'X-Proxy-Status': 'success'
      }
    });

  } catch (error) {
    console.error('Proxy API error:', error);
    
    const serverError: ApiError = {
      code: 'INTERNAL_PROXY_ERROR',
      message: 'An unexpected error occurred while proxying the request',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };

    return NextResponse.json({ error: serverError }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = searchParams.get('url');
    
    if (!targetUrl) {
      const error: ApiError = {
        code: 'MISSING_URL',
        message: 'Target URL is required'
      };
      return NextResponse.json({ error }, { status: 400 });
    }

    // Validate URL (same security checks as GET)
    if (!isAllowedUrl(targetUrl)) {
      const error: ApiError = {
        code: 'URL_NOT_ALLOWED',
        message: 'This URL is not allowed through the proxy for security reasons'
      };
      return NextResponse.json({ error }, { status: 403 });
    }

    // Get request body for POST
    const body = await request.text();
    
    // Fetch the target URL with POST method
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body
    });

    if (!response.ok) {
      const proxyError: ApiError = {
        code: 'PROXY_REQUEST_FAILED',
        message: `Failed to POST to target URL: ${response.status} ${response.statusText}`
      };
      return NextResponse.json({ error: proxyError }, { status: response.status });
    }

    const content = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'X-Proxy-Status': 'success'
      }
    });

  } catch (error) {
    console.error('Proxy API POST error:', error);
    
    const serverError: ApiError = {
      code: 'INTERNAL_PROXY_ERROR',
      message: 'An unexpected error occurred while proxying the POST request',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };

    return NextResponse.json({ error: serverError }, { status: 500 });
  }
}