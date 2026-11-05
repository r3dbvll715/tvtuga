<template>
  <aside class="channel-list">
    <header>
      <h3>Canais em Destaque</h3>
      <div class="filter-tabs">
        <button
          v-for="category in categories"
          :key="category"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </header>

    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Pesquisar canais..."
        @input="filterChannels"
      />
      <button class="clear-search" v-if="searchQuery" @click="clearSearch">×</button>
    </div>

    <div v-if="loading" class="loading">
      <LoadingSpinner message="Carregando canais..." />
    </div>

    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="retryFetch">Tentar novamente</button>
    </div>

    <ul v-if="!loading && !error">
      <li
        v-for="channel in filteredChannels"
        :key="channel.url"
        :class="{
          active: selectedChannel?.url === channel.url,
          featured: channel.featured
        }"
        @click="selectChannel(channel)
      "
      >
        <div class="channel-info">
          <img
            v-if="channel.logo"
            :src="channel.logo"
            :alt="channel.name"
            @error="handleImageError"
          />
          <div class="channel-details">
            <span class="channel-name">{{ channel.name }}</span>
            <span class="channel-category">{{ channel.category }}</span>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="filteredChannels.length === 0 && !loading && !error" class="no-results">
      Nenhum canal encontrado
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineProps, defineEmits } from 'vue';
import { Channel } from '../types/channel';
import { ChannelService } from '../services/channelService';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  modelValue: { type: Object as () => Channel | null, default: null },
  selected: { type: Object as () => Channel | null, default: null },
  featuredOnly: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'update:selected', 'channel-selected']);

const channelService = new ChannelService();
const channels = ref<Channel[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const activeCategory = ref('Todas');
const categories = computed(() => {
  const unique = ['Todas', ...new Set(channels.value.map(c => c.category))];
  return unique;
});

const filteredChannels = computed(() => {
  let filtered = channels.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
    );
  }

  if (activeCategory.value !== 'Todas') {
    filtered = filtered.filter(c => c.category === activeCategory.value);
  }

  if (props.featuredOnly) {
    filtered = filtered.filter(c => c.featured);
  }

  return filtered;
});

const selectedChannel = computed(() => props.selected || props.modelValue);

onMounted(() => {
  loadChannels();
});

async function loadChannels() {
  loading.value = true;
  error.value = null;

  try {
    channels.value = await channelService.fetchChannels();
    if (channels.value.length > 0 && !props.modelValue && !props.selected) {
      selectChannel(channels.value[0]);
    }
  } catch (err) {
    error.value = 'Erro ao carregar a lista de canais';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function selectChannel(channel: Channel) {
  emit('update:modelValue', channel);
  emit('update:selected', channel);
  emit('channel-selected', channel);
}

function filterChannels() {
  // Computed property handles filtering
}

function clearSearch() {
  searchQuery.value = '';
}

function retryFetch() {
  loadChannels();
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement as HTMLElement;
  parent?.classList.add('no-image');
}
</script>

<style scoped>
.channel-list {
  width: var(--sidebar-width);
  background: var(--glass-bg);
  backdrop-filter: blur(15px);
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
  margin: 0;
  padding-left: 10px;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tabs button {
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-dim);
  border-radius: 20px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tabs button.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.filter-tabs button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
}

.search-container {
  position: relative;
  width: 100%;
}

.search-container input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-main);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.search-container input:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.08);
}

.search-container input::placeholder {
  color: var(--text-dim);
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.clear-search:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
}

.loading, .error-message {
  padding: 2rem;
  text-align: center;
}

.error-message {
  color: #ff6b6b;
}

.error-message button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-message button:hover {
  background: #0051cc;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

li {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  font-weight: 400;
  font-size: 0.9rem;
}

li:hover {
  background: var(--card-bg);
  transform: translateX(5px);
  border-color: rgba(255, 255, 255, 0.1);
}

li.active {
  background: linear-gradient(135deg, rgba(0, 102, 255, 0.2), rgba(0, 210, 255, 0.2));
  border-color: rgba(0, 102, 255, 0.4);
  color: #00d2ff;
}

li.featured {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid var(--primary);
  margin: 8px 0;
  padding: 14px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
}

li.featured:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(0, 102, 255, 0.3);
}

.channel-info {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.channel-info img {
  width: 28px !important;
  height: 28px !important;
  object-fit: contain !important;
  margin-right: 12px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.channel-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.channel-name {
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.channel-category {
  font-size: 0.75rem;
  color: var(--text-dim);
}

li.active .channel-name,
li.active .channel-category {
  color: #00d2ff;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--text-dim);
  font-style: italic;
}
</style>