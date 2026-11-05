import { Channel } from '../types/channel';

export class ChannelService {
  private cache: Channel[] = [];
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private lastFetch = 0;

  async fetchChannels(): Promise<Channel[]> {
    if (this.isCacheValid()) {
      return this.cache;
    }

    try {
      const response = await fetch('https://raw.githubusercontent.com/LITUATUI/M3UPT/main/M3U/M3UPT.m3u');
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const text = await response.text();
      const channels = this.parseM3U(text);

      this.cache = channels;
      this.lastFetch = Date.now();

      return channels;
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      throw error;
    }
  }

  private parseM3U(content: string): Channel[] {
    const lines = content.split('\n');
    let currentChannel: Partial<Channel> | null = null;
    const channels: Channel[] = [];
    let count = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#EXTINF:')) {
        const nameMatch = trimmed.match(/,(.+)$/);
        const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
        const categoryMatch = trimmed.match(/group-title="([^"]+)"/);

        currentChannel = {
          name: nameMatch ? nameMatch[1].trim() : 'Canal sem nome',
          logo: logoMatch ? logoMatch[1] : '',
          category: categoryMatch ? categoryMatch[1] : 'Geral'
        };
      } else if (trimmed.startsWith('#EXTVLCOPT:')) {
        if (!currentChannel) {
          currentChannel = {
            name: 'Canal sem nome',
            logo: '',
            category: 'Geral'
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
        const isFeatured = count < 4;

        channels.push({
          name: currentChannel.name || 'Canal sem nome',
          logo: currentChannel.logo || '',
          category: currentChannel.category || 'Geral',
          url,
          featured: isFeatured,
          httpUserAgent: currentChannel.httpUserAgent,
          httpOrigin: currentChannel.httpOrigin,
          httpReferrer: currentChannel.httpReferrer
        });

        currentChannel = null;
        count++;
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
