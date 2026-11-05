<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <h1 class="logo">
          <span class="logo-icon" aria-hidden="true">📺</span>
          Portugal IPTV
        </h1>
        <span class="badge" v-if="channels.length">M3UPT Legal</span>
      </div>
      <div class="header-right">
        <div class="status-pill" :class="{ online: isOnline, offline: !isOnline }">
          <span class="status-dot" aria-hidden="true"></span>
          {{ isOnline ? 'Online' : 'Offline' }}
        </div>
        <div class="channel-count">{{ channels.length }} canais</div>
      </div>
    </header>

    <main class="main-content">
      <!-- Left: Channel Sidebar -->
      <aside class="sidebar">
        <ChannelList
          v-model:selected="selectedChannel"
          @channel-selected="handleChannelSelect"
        />
      </aside>

      <!-- Right: Video Player Area -->
      <section class="player-area">
        <!-- Hero / Empty State -->
        <div class="hero-section" v-if="!selectedChannel">
          <div class="hero-content">
            <div class="hero-icon" aria-hidden="true">▶</div>
            <h2>Portugal IPTV</h2>
            <p class="hero-tagline">Canais portugueses ao vivo — legal e gratuito</p>
            <div class="hero-stats">
              <span class="stat"><strong>{{ channels.length }}</strong> canais</span>
              <span class="stat-divider" aria-hidden="true">|</span>
              <span class="stat"><strong>{{ featuredCount }}</strong> em destaque</span>
              <span class="stat-divider" aria-hidden="true">|</span>
              <span class="stat"><strong>{{ categoryCount }}</strong> categorias</span>
            </div>
            <p class="hero-hint">← Selecione um canal da lista para começar</p>
          </div>
        </div>

        <!-- Video Player -->
        <div class="player-section" v-else>
          <div class="player-header">
            <div class="player-channel-info">
              <img
                v-if="selectedChannel.logo"
                :src="selectedChannel.logo"
                :alt="selectedChannel.name"
                class="channel-logo-small"
              />
              <div>
                <h3 class="channel-title">{{ selectedChannel.name }}</h3>
                <div class="channel-meta-row">
                  <span class="meta-tag category">{{ selectedChannel.category }}</span>
                  <span class="meta-tag featured" v-if="selectedChannel.featured">Em Destaque</span>
                </div>
              </div>
            </div>
            <div class="player-actions">
              <button class="icon-btn" @click="toggleAutoplay" :aria-pressed="autoPlay" :title="autoPlay ? 'Desativar autoplay' : 'Ativar autoplay'">
                <span aria-hidden="true">{{ autoPlay ? '⏯' : '⏹' }}</span>
              </button>
              <button class="icon-btn" @click="refreshChannels" title="Atualizar canais">
                <span aria-hidden="true">↻</span>
              </button>
            </div>
          </div>

          <div class="video-container">
            <VideoPlayer
              ref="videoPlayerRef"
              :stream-url="currentStreamUrl"
              :auto-play="autoPlay"
              @play="onPlayerPlay"
              @pause="onPlayerPause"
              @error="onPlayerError"
            />
          </div>

          <div class="player-footer">
            <div class="stream-quality">
              <span class="quality-label">Qualidade</span>
              <span class="quality-value">Auto (HLS)</span>
            </div>
            <div class="stream-source">
              <span class="source-label">Fonte</span>
              <a :href="selectedChannel?.url" target="_blank" rel="noopener noreferrer" class="source-link">
                M3UPT · GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <p>© {{ currentYear }} Portugal IPTV — Dados via <a href="https://github.com/LITUATUI/M3UPT" target="_blank" rel="noopener noreferrer">M3UPT</a></p>
      <div class="footer-links">
        <button @click="showAbout" class="footer-link">Sobre</button>
        <button @click="showHelp" class="footer-link">Ajuda</button>
        <button @click="showSettings" class="footer-link">Configurações</button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChannelService } from './services/channelService';
import ChannelList from './components/ChannelList.vue';
import VideoPlayer from './components/VideoPlayer.vue';
import { Channel } from './types/channel';

const channelService = new ChannelService();
const selectedChannel = ref<Channel | null>(null);
const isOnline = ref(true);
const channels = ref<Channel[]>([]);
const autoPlay = ref(true);
const currentYear = computed(() => new Date().getFullYear());

const currentStreamUrl = computed({
  get: () => selectedChannel.value ? channelService.getPlayableUrl(selectedChannel.value) : '',
  set: (value) => {
    const channel = channels.value.find(c => c.url === value);
    if (channel) {
      selectedChannel.value = channel;
    }
  }
});

const featuredCount = computed(() => channels.value.filter(c => c.featured).length);
const categoryCount = computed(() => new Set(channels.value.map(c => c.category)).size);

let onlineInterval: number;
let fetchInterval: number;

const fetchChannels = async () => {
  try {
    channels.value = await channelService.fetchChannels();
    if (!selectedChannel.value && channels.value.length > 0) {
      selectedChannel.value = channels.value[0];
    }
    isOnline.value = true;
  } catch (error) {
    console.error('Failed to fetch channels:', error);
    isOnline.value = false;
  }
};

const videoPlayerRef = ref<any>(null);

const handleChannelSelect = (channel: Channel) => {
  if (selectedChannel.value?.url === channel.url) {
    videoPlayerRef.value?.play();
  } else {
    selectedChannel.value = channel;
  }
};

const onPlayerPlay = () => {
  console.log('Player started');
};

const onPlayerPause = () => {
  console.log('Player paused');
};

const onPlayerError = (error: string) => {
  console.error('Player error:', error);
};

const toggleAutoplay = () => {
  autoPlay.value = !autoPlay.value;
};

const refreshChannels = () => {
  channelService.clearCache();
  fetchChannels();
};

const showAbout = () => {
  alert('Portugal IPTV — Player de canais portugueses via M3UPT (projeto legal, open source).');
};

const showHelp = () => {
  alert('Selecione um canal na lista lateral. O player carrega automaticamente via HLS.');
};

const showSettings = () => {
  alert('Configurações — em desenvolvimento');
};

onMounted(() => {
  fetchChannels();

  onlineInterval = setInterval(() => {
    isOnline.value = navigator.onLine;
    if (isOnline.value) {
      fetchChannels();
    }
  }, 30000);

  fetchInterval = setInterval(() => {
    fetchChannels();
  }, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (onlineInterval) clearInterval(onlineInterval);
  if (fetchInterval) clearInterval(fetchInterval);
});
</script>

<style scoped>
/* Layout */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

/* Header */
.header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 20;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--text-main) 0%, var(--accent) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px var(--accent-glow));
}

.badge {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  background: linear-gradient(135deg, rgba(0, 102, 255, 0.2), rgba(0, 210, 255, 0.15));
  color: var(--accent);
  border: 1px solid rgba(0, 210, 255, 0.3);
  border-radius: 100px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.status-pill.online {
  background: rgba(0, 210, 255, 0.12);
  border-color: rgba(0, 210, 255, 0.3);
  color: var(--accent);
}

.status-pill.offline {
  background: rgba(255, 99, 107, 0.12);
  border-color: rgba(255, 99, 107, 0.3);
  color: #ff6b6b;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

.status-pill.offline .status-dot {
  animation: none;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}

.channel-count {
  font-size: 0.8125rem;
  color: var(--text-dim);
  font-variant-numeric: tabular-nums;
}

/* Main Content */
.main-content {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

/* Player Area */
.player-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
}

/* Hero Section */
.hero-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.hero-content {
  text-align: center;
  max-width: 480px;
}

.hero-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 102, 255, 0.25), rgba(0, 210, 255, 0.15));
  border: 1px solid rgba(0, 210, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: var(--accent);
  box-shadow: var(--shadow-glow);
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.hero-content h2 {
  font-size: 2.25rem;
  font-weight: 600;
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--text-main) 0%, var(--accent) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-tagline {
  font-size: 1.125rem;
  color: var(--text-body);
  margin: 0 0 24px;
  font-weight: 300;
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stat {
  font-size: 0.875rem;
  color: var(--text-body);
}

.stat strong {
  font-size: 1.25rem;
  color: var(--accent);
  font-weight: 600;
}

.stat-divider {
  color: var(--text-dim);
  opacity: 0.4;
}

.hero-hint {
  font-size: 0.875rem;
  color: var(--text-dim);
  font-style: italic;
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Player Section */
.player-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  gap: 16px;
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius);
}

.player-channel-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.channel-logo-small {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.channel-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 10px;
  border-radius: 100px;
}

.meta-tag.category {
  background: rgba(0, 102, 255, 0.18);
  color: var(--primary-light);
  border: 1px solid rgba(0, 102, 255, 0.25);
}

.meta-tag.featured {
  background: rgba(255, 159, 64, 0.18);
  color: #ffb86b;
  border: 1px solid rgba(255, 159, 64, 0.25);
}

.player-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: var(--text-body);
  font-size: 1.125rem;
  cursor: pointer;
  transition: all var(--transition-speed) ease;
}

.icon-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  transform: scale(1.05);
}

.icon-btn:active {
  transform: scale(0.98);
}

.icon-btn[aria-pressed="true"] {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

/* Video Container */
.video-container {
  flex: 1;
  min-height: 0;
  border-radius: var(--radius);
  overflow: hidden;
  background: #000;
  box-shadow:
    var(--shadow-card),
    0 0 0 1px rgba(255, 255, 255, 0.03);
}

/* Player Footer */
.player-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius);
}

.stream-quality,
.stream-source {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8125rem;
}

.quality-label,
.source-label {
  color: var(--text-dim);
  font-weight: 500;
}

.quality-value {
  color: var(--accent);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.source-link {
  color: var(--text-body);
  text-decoration: none;
  transition: color var(--transition-speed) ease;
}

.source-link:hover {
  color: var(--accent);
  text-decoration: underline;
}

/* Footer */
.footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.8125rem;
  color: var(--text-dim);
}

.footer a {
  color: var(--text-dim);
  text-decoration: none;
  transition: color var(--transition-speed) ease;
}

.footer a:hover {
  color: var(--accent);
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-link {
  background: none;
  border: none;
  color: var(--text-dim);
  font: inherit;
  cursor: pointer;
  padding: 0;
  transition: color var(--transition-speed) ease;
}

.footer-link:hover {
  color: var(--accent);
}

/* Responsive */
@media (max-width: 1024px) {
  .app-container {
    grid-template-columns: 1fr;
    grid-template-rows: 64px 1fr auto 48px;
  }
  .main-content {
    grid-template-columns: 1fr;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    max-height: 40vh;
    overflow-y: auto;
  }
  .player-section {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .header {
    padding: 0 16px;
  }
  .logo {
    font-size: 1.125rem;
  }
  .hero-content h2 {
    font-size: 1.75rem;
  }
  .player-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .player-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  .footer {
    flex-direction: column;
    gap: 12px;
    text-align: center;
    padding: 16px 24px;
  }
}
</style>