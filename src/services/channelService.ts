import { Channel } from '../types/channel';

export const PORTUGUESE_GENERALIST_CHANNELS: Channel[] = [
  {
    name: 'RTP 1',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTP1.pt.png',
    category: 'Generalistas',
    url: 'https://streaming-live.rtp.pt/liverepeater/smil:rtp1HD.smil/playlist.m3u8',
    featured: true,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtp1',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'RTP 2',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTP2.pt.png',
    category: 'Generalistas',
    url: 'https://streaming-live.rtp.pt/liverepeater/rtp2HD.smil/playlist.m3u8',
    featured: true,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtp2',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'SIC',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/SIC.pt.png',
    category: 'Generalistas',
    url: 'https://sic.live.impresa.pt/sic1080p.m3u8',
    featured: true,
    httpOrigin: 'https://sic.pt',
    httpReferrer: 'https://sic.pt/',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'TVI',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/TVI.pt.png',
    category: 'Generalistas',
    url: 'https://github.com/LITUATUI/M3UPT/raw/main/M3U/TVI.m3u8',
    featured: true,
    httpOrigin: 'https://tviplayer.iol.pt',
    httpReferrer: 'https://tviplayer.iol.pt',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'SIC Notícias',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/SICNoticias.pt.png',
    category: 'Informação',
    url: 'https://sicnot.live.impresa.pt/sicnot.m3u8',
    featured: false,
    httpOrigin: 'https://sicnoticias.pt',
    httpReferrer: 'https://sicnoticias.pt/',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'CNN Portugal',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/CNNPortugal.pt.png',
    category: 'Informação',
    url: 'https://github.com/LITUATUI/M3UPT/raw/main/M3U/CNN_Portugal.m3u8',
    featured: false,
    httpOrigin: 'https://tviplayer.iol.pt',
    httpReferrer: 'https://tviplayer.iol.pt',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'RTP Notícias',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTPNoticias.pt.png',
    category: 'Informação',
    url: 'https://streaming-live.rtp.pt/livetvhlsDVR/rtpnHDdvr.smil/playlist.m3u8',
    featured: false,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtp3',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'ARTV',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/ARTV.pt.png',
    category: 'Informação',
    url: 'https://playout175.livextend.cloud/livenlin4/_definst_/2liveartvpub2/playlist.m3u8',
    featured: false
  },
  {
    name: 'RTP Açores',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTPAcores.pt.png',
    category: 'Regionais',
    url: 'https://streaming-live.rtp.pt/liverepeater/rtpacoresHD.smil/playlist.m3u8',
    featured: false,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtpacores',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  },
  {
    name: 'RTP Madeira',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTPMadeira.pt.png',
    category: 'Regionais',
    url: 'https://streaming-live.rtp.pt/liverepeater/rtpmadeira.smil/playlist.m3u8',
    featured: false,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtmadeira',
    httpUserAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:152.0) Gecko/20100101 Firefox/152.0'
  }
];

export class ChannelService {
  private cache: Channel[] = [];
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private lastFetch = 0;

  async fetchChannels(): Promise<Channel[]> {
    if (this.isCacheValid()) {
      return this.cache;
    }

    try {
      // Attempt to fetch fresh metadata from upstream M3U if available
      const response = await fetch('https://raw.githubusercontent.com/LITUATUI/M3UPT/main/M3U/M3UPT.m3u');
      if (response.ok) {
        const text = await response.text();
        const parsedChannels = this.parseM3U(text);
        const filtered = this.filterGeneralistChannels(parsedChannels);

        if (filtered.length > 0) {
          this.cache = filtered;
          this.lastFetch = Date.now();
          return this.cache;
        }
      }
    } catch (error) {
      console.warn('Could not sync from remote M3U playlist, using verified Portuguese channels:', error);
    }

    // Fallback directly to the curated and verified Portuguese generalist channels
    this.cache = [...PORTUGUESE_GENERALIST_CHANNELS];
    this.lastFetch = Date.now();
    return this.cache;
  }

  private filterGeneralistChannels(channels: Channel[]): Channel[] {
    // Only keep verified Portuguese generalist and national channels
    const result: Channel[] = [];

    for (const base of PORTUGUESE_GENERALIST_CHANNELS) {
      const match = channels.find(
        c => c.name.trim().toLowerCase() === base.name.trim().toLowerCase()
      );

      if (match) {
        result.push({
          ...base,
          url: match.url || base.url,
          logo: match.logo || base.logo,
          httpOrigin: match.httpOrigin || base.httpOrigin,
          httpReferrer: match.httpReferrer || base.httpReferrer,
          httpUserAgent: match.httpUserAgent || base.httpUserAgent
        });
      } else {
        result.push(base);
      }
    }

    return result;
  }

  private parseM3U(content: string): Channel[] {
    const lines = content.split('\n');
    let currentChannel: Partial<Channel> | null = null;
    const channels: Channel[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#EXTINF:')) {
        const nameMatch = trimmed.match(/,(.+)$/);
        const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
        const categoryMatch = trimmed.match(/group-title="([^"]+)"/);

        currentChannel = {
          name: nameMatch ? nameMatch[1].trim() : 'Canal sem nome',
          logo: logoMatch ? logoMatch[1] : '',
          category: categoryMatch ? categoryMatch[1] : 'Generalistas'
        };
      } else if (trimmed.startsWith('#EXTVLCOPT:')) {
        if (!currentChannel) {
          currentChannel = {
            name: 'Canal sem nome',
            logo: '',
            category: 'Generalistas'
          };
        }
        if (trimmed.includes('http-user-agent=')) {
          const match = trimmed.match(/http-user-agent="?([^"]+)"?/);
          if (match) currentChannel.httpUserAgent = match[1];
        }
        if (trimmed.includes('http-origin=')) {
          const match = trimmed.match(/http-origin="?([^"]+)"?/);
          if (match) currentChannel.httpOrigin = match[1];
        }
        if (trimmed.includes('http-referrer=')) {
          const match = trimmed.match(/http-referrer="?([^"]+)"?/);
          if (match) currentChannel.httpReferrer = match[1];
        }
      } else if (trimmed.startsWith('http') && currentChannel) {
        const url = trimmed;

        channels.push({
          name: currentChannel.name || 'Canal sem nome',
          logo: currentChannel.logo || '',
          category: currentChannel.category || 'Generalistas',
          url,
          featured: false,
          httpUserAgent: currentChannel.httpUserAgent,
          httpOrigin: currentChannel.httpOrigin,
          httpReferrer: currentChannel.httpReferrer
        });

        currentChannel = null;
      }
    });

    return channels;
  }

  getPlayableUrl(channel: Channel | string): string {
    const url = typeof channel === 'string' ? channel : channel.url;
    if (!url) return '';
    if (url.startsWith('/api/stream-proxy')) return url;

    const origin = typeof channel === 'object' ? channel.httpOrigin : undefined;
    const referer = typeof channel === 'object' ? channel.httpReferrer : undefined;
    const userAgent = typeof channel === 'object' ? channel.httpUserAgent : undefined;

    let proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(url)}`;
    if (origin) proxyUrl += `&origin=${encodeURIComponent(origin)}`;
    if (referer) proxyUrl += `&referer=${encodeURIComponent(referer)}`;
    if (userAgent) proxyUrl += `&userAgent=${encodeURIComponent(userAgent)}`;

    return proxyUrl;
  }

  private isCacheValid(): boolean {
    return (
      this.cache.length > 0 &&
      Date.now() - this.lastFetch < this.CACHE_TTL
    );
  }

  getCache(): Channel[] {
    return [...this.cache];
  }

  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
  }
}
