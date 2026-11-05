import type { Config, Context } from '@netlify/functions';
import zlib from 'zlib';

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

  const reqHeaders: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept': '*/*',
  };
  if (origin) reqHeaders['Origin'] = origin;
  if (referer) reqHeaders['Referer'] = referer;
  if (req.headers.get('range')) reqHeaders['Range'] = req.headers.get('range')!;

  try {
    const remoteRes = await fetch(targetUrl, {
      headers: reqHeaders,
      redirect: 'follow',
    });

    const contentType = (remoteRes.headers.get('content-type') || '').toLowerCase();
    const isM3U8 =
      contentType.includes('mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      targetUrl.toLowerCase().includes('.m3u8');

    if (isM3U8) {
      const buffer = Buffer.from(await remoteRes.arrayBuffer());
      const encoding = (remoteRes.headers.get('content-encoding') || '').toLowerCase();
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

        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/g, (_, uri) => {
            try {
              const resolved = new URL(uri, targetUrl).href;
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
          const resolved = new URL(trimmed, targetUrl).href;
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
      return new Response(rewritten, {
        status: remoteRes.status,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Binary media segments (.ts, .m4s)
    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Content-Type', remoteRes.headers.get('content-type') || 'video/MP2T');
    if (remoteRes.headers.get('content-length')) {
      resHeaders.set('Content-Length', remoteRes.headers.get('content-length')!);
    }
    if (remoteRes.headers.get('content-range')) {
      resHeaders.set('Content-Range', remoteRes.headers.get('content-range')!);
    }
    if (remoteRes.headers.get('accept-ranges')) {
      resHeaders.set('Accept-Ranges', remoteRes.headers.get('accept-ranges')!);
    }

    return new Response(remoteRes.body, {
      status: remoteRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return new Response(`Proxy error: ${err?.message || err}`, {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config: Config = {
  path: '/api/stream-proxy',
};
