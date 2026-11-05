export interface Channel {
  name: string;
  url: string;
  logo?: string;
  category?: string;
  featured?: boolean;
  httpUserAgent?: string;
  httpOrigin?: string;
  httpReferrer?: string;
}

export interface PlayerState {
  currentChannel: Channel | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}
