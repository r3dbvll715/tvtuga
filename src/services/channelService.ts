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
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'RTP 2',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTP2.pt.png',
    category: 'Generalistas',
    url: 'https://streaming-live.rtp.pt/liverepeater/rtp2HD.smil/playlist.m3u8',
    featured: true,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtp2',
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'SIC',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/SIC.pt.png',
    category: 'Generalistas',
    url: 'https://production-fast-sic.content.okast.tv/fa2e8c4385712f9a7dce4ff2dcebac2e/channels/d9070446-8448-455e-8075-773b1ba12562/d47eae0f-ad77-414a-9a1d-2a6628ba18c3/media_.m3u8',
    featured: true,
    httpOrigin: 'https://sic.pt',
    httpReferrer: 'https://opto.sic.pt/',
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'TVI',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/TVI.pt.png',
    category: 'Generalistas',
    url: 'https://github.com/LITUATUI/M3UPT/raw/main/M3U/TVI.m3u8',
    featured: true,
    httpOrigin: 'https://tviplayer.iol.pt',
    httpReferrer: 'https://tviplayer.iol.pt',
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'CNN Portugal',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/CNNPortugal.pt.png',
    category: 'Informação',
    url: 'https://github.com/LITUATUI/M3UPT/raw/main/M3U/CNN_Portugal.m3u8',
    featured: false,
    httpOrigin: 'https://tviplayer.iol.pt',
    httpReferrer: 'https://tviplayer.iol.pt',
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'RTP Notícias',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTPNoticias.pt.png',
    category: 'Informação',
    url: 'https://streaming-live.rtp.pt/livetvhlsDVR/rtpnHDdvr.smil/playlist.m3u8',
    featured: false,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtp3',
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'Porto Canal',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/PortoCanal.pt.png',
    category: 'Regionais',
    url: 'https://pull-live-156-1.global.ssl.fastly.net/pc5865dc25400thmb-ea6bf03b14fa318f7133/pc1-jhrgyuoqe5865db-68tkgb14fa318f7133f03.smil/playlist.m3u8',
    featured: false
  },
  {
    name: 'ARTV',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/ARTV.pt.png',
    category: 'Informação',
    url: 'https://playout175.livextend.cloud/livenlin4/_definst_/2liveartvpub2/playlist.m3u8',
    featured: false
  },
  {
    name: 'Canal 11',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/Canal11.pt.png',
    category: 'Informação',
    url: 'https://dy4isoelz3s0x.cloudfront.net/0_hd.m3u8',
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
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  {
    name: 'RTP Madeira',
    logo: 'https://raw.githubusercontent.com/LITUATUI/M3UPT/main/logos/RTPMadeira.pt.png',
    category: 'Regionais',
    url: 'https://streaming-live.rtp.pt/liverepeater/rtpmadeira.smil/playlist.m3u8',
    featured: false,
    httpOrigin: 'https://www.rtp.pt',
    httpReferrer: 'https://www.rtp.pt/play/direto/rtmadeira',
    httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
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

    // Always use the curated and verified Portuguese generalist channels
    this.cache = [...PORTUGUESE_GENERALIST_CHANNELS];
    this.lastFetch = Date.now();
    return this.cache;
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
