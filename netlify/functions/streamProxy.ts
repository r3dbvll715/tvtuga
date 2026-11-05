import type { Config, Context } from '@netlify/functions';
import https from 'https';
import http from 'http';
import zlib from 'zlib';
import { URL } from 'url';

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    return new Response('Missing target "url" parameter', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  let origin = url.searchParams.get('origin') || '';
  let referer = url.searchParams.get('referer') || '';
  let userAgent = url.searchParams.get('userAgent') || 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0';

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return new Response('Invalid target URL', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const hostname = parsedTarget.hostname.toLowerCase();
  if (!origin) {
    if (hostname.includes('rtp.pt')) {
      origin = 'https://www.rtp.pt';
      referer = referer || 'https://www.rtp.pt/play/direto/rtp1';
    } else if (hostname.includes('impresa.pt') || hostname.includes('sic')) {
      origin = 'https://sic.pt';
      referer = referer || 'https://sic.pt/';
    } else if (hostname.includes('iol.pt') || hostname.includes('tvi')) {
      origin = 'https://tviplayer.iol.pt';
      referer = referer || 'https://tviplayer.iol.pt/';
    } else {
      origin = parsedTarget.origin;
      referer = referer || `${parsedTarget.origin}/`;
    }
  }
  if (!referer) {
    referer = origin ? `${origin}/` : `${parsedTarget.origin}/`;
  }

  return new Promise<Response>((resolve) => {
    fetchWithNode(targetUrl, 0, resolve);
  });

  function fetchWithNode(currentUrl: string, redirectCount: number, resolve: (res: Response) => void) {
    if (redirectCount > 10) {
      return resolve(new Response('Too many redirects', { status: 502 }));
    }

    let u: URL;
    try {
      u = new URL(currentUrl);
    } catch {
      return resolve(new Response('Invalid URL', { status: 400 }));
    }

    const headers: Record<string, string> = {
      'Host': u.host,
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
    };
    if (origin) headers['Origin'] = origin;
    if (referer) headers['Referer'] = referer;
    const client = u.protocol === 'https:' ? https : http;

    const request = client.get(currentUrl, { headers }, (remoteRes) => {
      if (
        remoteRes.statusCode &&
        remoteRes.statusCode >= 300 &&
        remoteRes.statusCode < 400 &&
        remoteRes.headers.location
      ) {
        const nextUrl = new URL(remoteRes.headers.location, currentUrl).href;
        return fetchWithNode(nextUrl, redirectCount + 1, resolve);
      }

      if (remoteRes.statusCode === 204 || remoteRes.statusCode === 304) {
        return resolve(new Response(null, {
          status: remoteRes.statusCode,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }));
      }

      const encoding = (remoteRes.headers['content-encoding'] || '').toLowerCase();
      const contentType = (remoteRes.headers['content-type'] || '').toLowerCase();
      const isSuccess = (remoteRes.statusCode || 200) < 400;
      const isM3U8 =
        isSuccess &&
        (contentType.includes('mpegurl') ||
         contentType.includes('application/x-mpegurl') ||
         currentUrl.toLowerCase().includes('.m3u8'));

      const chunks: Buffer[] = [];
      remoteRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      remoteRes.on('end', () => {
        const fullBuffer = Buffer.concat(chunks);

        if (isM3U8) {
          let body = '';
          if (encoding === 'gzip' || encoding === 'deflate') {
            try {
              body = zlib.unzipSync(fullBuffer).toString('utf8');
            } catch {
              body = fullBuffer.toString('utf8');
            }
          } else {
            body = fullBuffer.toString('utf8');
          }

          const lines = body.split(/\r?\n/);
          const rewrittenLines = lines.map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith('#')) {
              return line.replace(/URI="([^"]+)"/g, (_, uri) => {
                try {
                  const resolved = new URL(uri, currentUrl).href;
                  let proxyUri = `/api/stream-proxy?url=${encodeURIComponent(resolved)}`;
                  if (origin) proxyUri += `&origin=${encodeURIComponent(origin)}`;
                  if (referer) proxyUri += `&referer=${encodeURIComponent(referer)}`;
                  if (userAgent) proxyUri += `&userAgent=${encodeURIComponent(userAgent)}`;
                  return `URI="${proxyUri}"`;
                } catch {
                  return `URI="${uri}"`;
                }
              });
            }

            try {
              const resolved = new URL(trimmed, currentUrl).href;
              let proxyUri = `/api/stream-proxy?url=${encodeURIComponent(resolved)}`;
              if (origin) proxyUri += `&origin=${encodeURIComponent(origin)}`;
              if (referer) proxyUri += `&referer=${encodeURIComponent(referer)}`;
              if (userAgent) proxyUri += `&userAgent=${encodeURIComponent(userAgent)}`;
              return proxyUri;
            } catch {
              return line;
            }
          });

          const rewritten = rewrittenLines.join('\n');
          return resolve(new Response(rewritten, {
            status: remoteRes.statusCode || 200,
            headers: {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
          }));
        }

        // Binary media segments (.ts, .m4s)
        const resHeaders: Record<string, string> = {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': (remoteRes.headers['content-type'] as string) || 'video/MP2T',
        };
        if (remoteRes.headers['content-length']) {
          resHeaders['Content-Length'] = remoteRes.headers['content-length'] as string;
        }
        if (remoteRes.headers['content-range']) {
          resHeaders['Content-Range'] = remoteRes.headers['content-range'] as string;
        }
        if (remoteRes.headers['accept-ranges']) {
          resHeaders['Accept-Ranges'] = remoteRes.headers['accept-ranges'] as string;
        }

        return resolve(new Response(fullBuffer, {
          status: remoteRes.statusCode || 200,
          headers: resHeaders,
        }));
      });

      remoteRes.on('error', (err) => {
        resolve(new Response(`Remote error: ${err.message}`, { status: 502 }));
      });
    });

    request.on('error', (err) => {
      resolve(new Response(`Request error: ${err.message}`, { status: 502 }));
    });
  }
};

export const config: Config = {
  path: '/api/stream-proxy',
};
