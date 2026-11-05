import http from 'http';
import https from 'https';
import zlib from 'zlib';
import { URL } from 'url';
import type { Connect } from 'vite';

export function createStreamProxyMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    // Only handle requests starting with /api/stream-proxy
    if (!req.url || !req.url.startsWith('/api/stream-proxy')) {
      return next();
    }

    // CORS headers for browser player
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const parsed = new URL(req.url, 'http://localhost');
    const targetUrl = parsed.searchParams.get('url');

    if (!targetUrl) {
      res.statusCode = 400;
      return res.end('Missing required "url" parameter');
    }

    let origin = parsed.searchParams.get('origin') || '';
    let referer = parsed.searchParams.get('referer') || '';
    let userAgent = parsed.searchParams.get('userAgent') || '';

    let parsedTarget: URL;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      res.statusCode = 400;
      return res.end('Invalid target URL');
    }

    // Auto-detect known channel broadcaster requirements
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
    if (!userAgent) {
      userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0';
    }

    fetchAndStream(targetUrl, 0);

    function fetchAndStream(currentUrl: string, redirectCount: number) {
      if (redirectCount > 10) {
        res.statusCode = 502;
        return res.end('Too many redirects');
      }

      let u: URL;
      try {
        u = new URL(currentUrl);
      } catch {
        res.statusCode = 400;
        return res.end('Invalid redirect URL');
      }

      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept': '*/*'
      };
      if (origin) headers['Origin'] = origin;
      if (referer) headers['Referer'] = referer;
      if (req.headers.range) headers['Range'] = req.headers.range as string;

      const client = u.protocol === 'https:' ? https : http;
      const request = client.get(currentUrl, { headers }, (remoteRes) => {
        // Handle HTTP redirects
        if (
          remoteRes.statusCode &&
          remoteRes.statusCode >= 300 &&
          remoteRes.statusCode < 400 &&
          remoteRes.headers.location
        ) {
          const nextUrl = new URL(remoteRes.headers.location, currentUrl).href;
          return fetchAndStream(nextUrl, redirectCount + 1);
        }

        const encoding = (remoteRes.headers['content-encoding'] || '').toLowerCase();
        const contentType = (remoteRes.headers['content-type'] || '').toLowerCase();
        const isM3U8 =
          contentType.includes('mpegurl') ||
          contentType.includes('application/x-mpegurl') ||
          currentUrl.toLowerCase().includes('.m3u8');

        if (isM3U8) {
          const chunks: Buffer[] = [];
          remoteRes.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });

          remoteRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            let body = '';
            if (encoding === 'gzip' || encoding === 'deflate') {
              try {
                body = zlib.unzipSync(buffer).toString('utf8');
              } catch {
                body = buffer.toString('utf8');
              }
            } else {
              body = buffer.toString('utf8');
            }

            const lines = body.split(/\r?\n/);
            const rewrittenLines = lines.map((line) => {
              const trimmed = line.trim();
              if (!trimmed) return line;

              // Handle URI attributes in tags (e.g. #EXT-X-KEY:URI="..." or #EXT-X-MAP:URI="...")
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

              // Handle playlist/segment URI lines
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
            res.statusCode = remoteRes.statusCode || 200;
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.end(rewritten);
          });

          remoteRes.on('error', (err) => {
            console.error('Remote response error for playlist:', err);
            if (!res.headersSent) {
              res.statusCode = 502;
              res.end('Error fetching playlist');
            }
          });
        } else {
          // Binary segment or media data (.ts, .m4s, etc.)
          res.statusCode = remoteRes.statusCode || 200;
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (remoteRes.headers['content-type']) {
            res.setHeader('Content-Type', remoteRes.headers['content-type']);
          } else {
            res.setHeader('Content-Type', 'video/MP2T');
          }
          if (remoteRes.headers['content-length']) {
            res.setHeader('Content-Length', remoteRes.headers['content-length']);
          }
          if (remoteRes.headers['content-range']) {
            res.setHeader('Content-Range', remoteRes.headers['content-range']);
          }
          if (remoteRes.headers['accept-ranges']) {
            res.setHeader('Accept-Ranges', remoteRes.headers['accept-ranges']);
          }

          remoteRes.pipe(res);
        }
      });

      request.on('error', (err) => {
        console.error('Proxy request error for', currentUrl, err.message);
        if (!res.headersSent) {
          res.statusCode = 502;
          res.end(`Proxy error: ${err.message}`);
        }
      });

      res.on('close', () => {
        request.destroy();
      });
    }
  };
}

