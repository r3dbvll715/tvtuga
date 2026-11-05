import type { Config, Context } from "@netlify/edge-functions";

export default async (req: Request, context: Context): Promise<Response> => {
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
  let userAgent = url.searchParams.get('userAgent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

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

  const clientIp = context.ip || '94.61.227.240';

  const reqHeaders = new Headers();
  reqHeaders.set('User-Agent', userAgent);
  reqHeaders.set('Accept', '*/*');
  reqHeaders.set('Accept-Language', 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7');
  if (origin) reqHeaders.set('Origin', origin);
  if (referer) reqHeaders.set('Referer', referer);
  if (clientIp) {
    reqHeaders.set('X-Forwarded-For', clientIp);
    reqHeaders.set('X-Real-IP', clientIp);
  }

  try {
    const remoteRes = await fetch(targetUrl, {
      method: 'GET',
      headers: reqHeaders,
      redirect: 'follow',
    });

    if (remoteRes.status === 204 || remoteRes.status === 304) {
      return new Response(null, {
        status: remoteRes.status,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const contentType = (remoteRes.headers.get('content-type') || '').toLowerCase();
    const isSuccess = remoteRes.status < 400;
    const isM3U8 =
      isSuccess &&
      (contentType.includes('mpegurl') ||
       contentType.includes('application/x-mpegurl') ||
       targetUrl.toLowerCase().includes('.m3u8'));

    if (isM3U8) {
      const body = await remoteRes.text();
      const lines = body.split(/\r?\n/);
      const currentResolved = remoteRes.url || targetUrl;
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Handle URI attributes in tags
        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/g, (_, uri) => {
            try {
              const resolved = new URL(uri, currentResolved).href;
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

        // Handle stream/segment URI lines
        try {
          const resolved = new URL(trimmed, currentResolved).href;
          let proxyUri = `/api/stream-proxy?url=${encodeURIComponent(resolved)}`;
          if (origin) proxyUri += `&origin=${encodeURIComponent(origin)}`;
          if (referer) proxyUri += `&referer=${encodeURIComponent(referer)}`;
          if (userAgent) proxyUri += `&userAgent=${encodeURIComponent(userAgent)}`;
          return proxyUri;
        } catch {
          return line;
        }
      });

      return new Response(rewrittenLines.join('\n'), {
        status: 200,
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
    if (remoteRes.headers.has('content-length')) {
      resHeaders.set('Content-Length', remoteRes.headers.get('content-length')!);
    }
    if (remoteRes.headers.has('accept-ranges')) {
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
