<template>
  <div ref="playerContainer" class="video-player" :class="{ 'error-state': !!error, 'is-fullscreen': isFullscreen }">
    <div class="video-wrapper" @click="handleWrapperClick" @dblclick.prevent="toggleFullscreen">
      <video
        ref="videoElement"
        class="video-element"
        playsinline
        preload="auto"
      >
        <p class="vjs-no-js">
          Para ver vídeos, ative o JavaScript ou use um browser moderno.
        </p>
      </video>

      <!-- Center Big Play Button when paused -->
      <div
        v-if="!isPlaying && streamUrl && !loading && !error"
        class="big-play-overlay"
      >
        <button class="big-play-btn" aria-label="Reproduzir canal">
          ▶
        </button>
      </div>

      <!-- Loading spinner overlay -->
      <div v-if="loading && !error" class="loading-overlay">
        <div class="spinner"></div>
        <span>A carregar emissão...</span>
      </div>

      <!-- Muted autoplay banner -->
      <button
        v-if="isMutedAutoplay && isPlaying"
        class="unmute-banner"
        @click.stop="unmute"
        title="Ativar som"
      >
        🔊 Emissão em direto sem som. Clique para ativar som
      </button>
    </div>

    <div class="player-controls" v-if="streamUrl">
      <button
        class="control-btn"
        :class="{ 'active': isPlaying }"
        @click="togglePlay"
        :title="isPlaying ? 'Pausa' : 'Reproduzir'"
      >
        {{ isPlaying ? '⏸' : '▶' }}
      </button>

      <div class="volume-bar" @click="handleVolumeBarClick" title="Ajustar volume">
        <div
          class="volume-level"
          :style="{ width: volumePercent + '%' }"
        ></div>
      </div>

      <div class="live-indicator" v-if="isPlaying">
        <span class="live-dot"></span>
        <span class="live-text">EM DIRETO</span>
      </div>

      <div class="time-display">
        {{ currentTimeFormatted }} / {{ durationFormatted }}
      </div>

      <button
        class="control-btn fullscreen-btn"
        @click="toggleFullscreen"
        :title="isFullscreen ? 'Sair de ecrã inteiro (f)' : 'Ecrã inteiro (f)'"
        aria-label="Ecrã inteiro"
      >
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      </button>
    </div>

    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <h3>Erro ao carregar emissão</h3>
        <p>{{ error }}</p>
        <button @click="retryLoad">Tentar novamente</button>
      </div>
    </div>

    <div v-if="!streamUrl && !loading" class="no-stream">
      <p>Selecione um canal da lista</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, defineExpose, watch } from 'vue';
import Hls from 'hls.js';

const props = defineProps({
  streamUrl: { type: String, default: '' },
  autoPlay: { type: Boolean, default: true }
});

const emit = defineEmits(['update:modelValue', 'play', 'pause', 'error']);

const playerContainer = ref<HTMLElement | null>(null);
const videoElement = ref<HTMLVideoElement | null>(null);
let hlsInstance: Hls | null = null;

const isPlaying = ref(false);
const isMutedAutoplay = ref(false);
const isFullscreen = ref(false);
const volume = ref(0.7);
const currentTime = ref(0);
const duration = ref(0);
const loading = ref(false);
const error = ref<string | null>(null);

const volumePercent = computed(() => {
  if (videoElement.value?.muted) return 0;
  return Math.round(volume.value * 100);
});

const currentTimeFormatted = computed(() => formatTime(currentTime.value));
const durationFormatted = computed(() => {
  if (!duration.value || !isFinite(duration.value)) return 'Direto';
  return formatTime(duration.value);
});

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function loadStream(url: string) {
  if (!videoElement.value || !url) return;

  error.value = null;
  loading.value = true;

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  const isHls = url.includes('.m3u8') || url.includes('stream-proxy') || url.includes('/hls');

  if (isHls && Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60,
      maxBufferLength: 30,
      maxMaxBufferLength: 60
    });
    hlsInstance = hls;

    hls.loadSource(url);
    hls.attachMedia(videoElement.value);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      loading.value = false;
      if (props.autoPlay) {
        attemptPlay();
      }
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn('HLS.js fatal network error, recovering...', data.details);
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn('HLS.js fatal media error, recovering...', data.details);
            hls.recoverMediaError();
            break;
          default:
            console.error('HLS.js unrecoverable fatal error:', data.details);
            hls.destroy();
            error.value = 'Não foi possível carregar esta emissão em direto';
            emit('error', error.value);
            break;
        }
      }
    });
  } else {
    // Native HLS for Safari or direct MP4
    videoElement.value.src = url;
    if (props.autoPlay) {
      attemptPlay();
    }
  }
}

function attemptPlay() {
  if (!videoElement.value) return;

  const playPromise = videoElement.value.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isPlaying.value = true;
        isMutedAutoplay.value = false;
      })
      .catch((err) => {
        console.warn('Unmuted autoplay prevented by browser policy:', err?.message || err);
        // Fallback to muted autoplay so user immediately sees video
        if (videoElement.value && err?.name === 'NotAllowedError') {
          videoElement.value.muted = true;
          isMutedAutoplay.value = true;
          videoElement.value.play()
            .then(() => {
              isPlaying.value = true;
            })
            .catch(() => {
              isPlaying.value = false;
            });
        }
      });
  }
}

function unmute() {
  if (!videoElement.value) return;
  videoElement.value.muted = false;
  isMutedAutoplay.value = false;
  videoElement.value.volume = volume.value;
}

function handleWrapperClick() {
  if (isMutedAutoplay.value) {
    unmute();
    return;
  }
  togglePlay();
}

function togglePlay() {
  if (!videoElement.value) return;

  if (isMutedAutoplay.value) {
    unmute();
  }

  if (videoElement.value.paused) {
    videoElement.value.play().catch(err => {
      console.warn('Play error:', err);
    });
  } else {
    videoElement.value.pause();
  }
}

function play() {
  if (!videoElement.value) return;
  if (isMutedAutoplay.value) unmute();
  videoElement.value.play().catch(err => console.warn('Play error:', err));
}

function pause() {
  if (!videoElement.value) return;
  videoElement.value.pause();
}

function increaseVolume() {
  if (!videoElement.value) return;
  if (videoElement.value.muted) unmute();
  const newVol = Math.min(1, Math.round((volume.value + 0.1) * 10) / 10);
  videoElement.value.volume = newVol;
  volume.value = newVol;
}

function decreaseVolume() {
  if (!videoElement.value) return;
  if (videoElement.value.muted) unmute();
  const newVol = Math.max(0, Math.round((volume.value - 0.1) * 10) / 10);
  videoElement.value.volume = newVol;
  volume.value = newVol;
}

function handleVolumeBarClick(event: MouseEvent) {
  const bar = event.currentTarget as HTMLElement;
  const rect = bar.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const newVol = Math.max(0, Math.min(1, clickX / rect.width));
  if (videoElement.value) {
    if (videoElement.value.muted) unmute();
    videoElement.value.volume = newVol;
    volume.value = newVol;
  }
}

function retryLoad() {
  error.value = null;
  if (props.streamUrl) {
    loadStream(props.streamUrl);
  }
}

watch(
  () => props.streamUrl,
  (newUrl) => {
    if (newUrl) {
      error.value = null;
      loadStream(newUrl);
    } else {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      if (videoElement.value) {
        videoElement.value.pause();
        videoElement.value.removeAttribute('src');
        videoElement.value.load();
      }
      isPlaying.value = false;
    }
  }
);

function toggleFullscreen() {
  const target = playerContainer.value || videoElement.value;
  if (!target) return;

  const doc = document as any;
  const isCurrentlyFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

  if (!isCurrentlyFullscreen) {
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(err => {
        if (videoElement.value && (videoElement.value as any).webkitEnterFullscreen) {
          (videoElement.value as any).webkitEnterFullscreen();
        } else {
          console.warn('Error attempting fullscreen:', err);
        }
      });
    } else if ((target as any).webkitRequestFullscreen) {
      (target as any).webkitRequestFullscreen();
    } else if ((target as any).mozRequestFullScreen) {
      (target as any).mozRequestFullScreen();
    } else if ((target as any).msRequestFullscreen) {
      (target as any).msRequestFullscreen();
    } else if (videoElement.value && (videoElement.value as any).webkitEnterFullscreen) {
      (videoElement.value as any).webkitEnterFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn('Exit fullscreen error:', err));
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
  }
}

function handleFullscreenChange() {
  const doc = document as any;
  isFullscreen.value = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
}

function handleKeyDown(e: KeyboardEvent) {
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
    return;
  }
  if (e.key === 'f' || e.key === 'F') {
    if (props.streamUrl) {
      e.preventDefault();
      toggleFullscreen();
    }
  } else if (e.key === 'ArrowUp') {
    if (props.streamUrl) {
      e.preventDefault();
      increaseVolume();
    }
  } else if (e.key === 'ArrowDown') {
    if (props.streamUrl) {
      e.preventDefault();
      decreaseVolume();
    }
  } else if (e.key === 'm' || e.key === 'M') {
    if (props.streamUrl && videoElement.value) {
      e.preventDefault();
      videoElement.value.muted = !videoElement.value.muted;
    }
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  window.addEventListener('keydown', handleKeyDown);

  if (videoElement.value) {
    videoElement.value.volume = volume.value;

    videoElement.value.addEventListener('play', () => {
      isPlaying.value = true;
      emit('play');
    });

    videoElement.value.addEventListener('pause', () => {
      isPlaying.value = false;
      emit('pause');
    });

    videoElement.value.addEventListener('volumechange', () => {
      if (videoElement.value) {
        volume.value = videoElement.value.volume;
      }
    });

    videoElement.value.addEventListener('timeupdate', () => {
      if (videoElement.value) {
        currentTime.value = videoElement.value.currentTime;
      }
    });

    videoElement.value.addEventListener('loadedmetadata', () => {
      if (videoElement.value) {
        duration.value = videoElement.value.duration;
      }
      loading.value = false;
    });

    videoElement.value.addEventListener('waiting', () => {
      loading.value = true;
    });

    videoElement.value.addEventListener('playing', () => {
      loading.value = false;
      isPlaying.value = true;
      error.value = null;
    });

    videoElement.value.addEventListener('error', () => {
      loading.value = false;
      if (props.streamUrl && !hlsInstance) {
        error.value = 'Não foi possível carregar este stream';
        emit('error', error.value);
      }
    });
  }

  if (props.streamUrl) {
    loadStream(props.streamUrl);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  window.removeEventListener('keydown', handleKeyDown);

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
});

defineExpose({
  play,
  pause,
  togglePlay,
  retryLoad,
  toggleFullscreen,
  isFullscreen
});
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.video-player.error-state {
  border-color: #ff6b6b;
}

.video-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  cursor: pointer;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.big-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
  transition: background 0.2s ease;
}

.video-wrapper:hover .big-play-overlay {
  background: rgba(0, 0, 0, 0.2);
}

.big-play-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid rgba(255, 255, 255, 0.8);
  color: white;
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 102, 255, 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding-left: 6px;
}

.big-play-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 15px 40px rgba(0, 102, 255, 0.7);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.95rem;
  z-index: 5;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.unmute-banner {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 102, 255, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
  z-index: 8;
  animation: pulse-badge 2s infinite ease-in-out;
}

.unmute-banner:hover {
  background: #0051cc;
  transform: translateX(-50%) scale(1.04);
}

@keyframes pulse-badge {
  0%, 100% { opacity: 0.95; }
  50% { opacity: 0.75; }
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--glass-bg);
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
}

.control-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: var(--text-main);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.control-btn.active {
  background: var(--primary);
  color: white;
}

.volume-bar {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.volume-level {
  height: 100%;
  background: var(--primary);
  transition: width 0.1s ease;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.3);
  border-radius: 100px;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff3b30;
  animation: live-blink 1.5s infinite ease-in-out;
}

@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.live-text {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #ff3b30;
}

.time-display {
  margin-left: auto;
  font-family: monospace;
  color: var(--text-dim);
  font-size: 0.875rem;
}

.error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.error-content {
  text-align: center;
  padding: 2rem;
  background: var(--glass-bg);
  border-radius: 12px;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.error-content h3 {
  margin: 0 0 1rem 0;
  color: #ff6b6b;
}

.error-content p {
  margin: 0 0 1.5rem 0;
  color: var(--text-main);
}

.error-content button {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.error-content button:hover {
  background: #0051cc;
}

.no-stream {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-dim);
  font-style: italic;
}

.fullscreen-btn {
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.fullscreen-btn svg {
  display: block;
}

/* Fullscreen player styles */
:fullscreen.video-player,
:-webkit-full-screen.video-player,
.video-player.is-fullscreen {
  border-radius: 0;
  border: none;
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  box-shadow: none;
  background: #000;
}

:fullscreen.video-player .video-wrapper,
:-webkit-full-screen.video-player .video-wrapper,
.video-player.is-fullscreen .video-wrapper {
  height: 100%;
}

:fullscreen.video-player .player-controls,
:-webkit-full-screen.video-player .player-controls,
.video-player.is-fullscreen .player-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: linear-gradient(to top, rgba(10, 12, 16, 0.95), rgba(10, 12, 16, 0.6) 60%, transparent);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
