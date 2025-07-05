<template>
  <div class="min-h-screen bg-gray-900 p-6 text-white">
    <div class="mx-auto max-w-6xl">
      <h1 class="mb-8 text-3xl font-bold">🚀 Test des Extensions Aniyomi</h1>

      <!-- Section Extensions -->
      <div class="mb-8">
        <h2 class="mb-4 text-2xl font-semibold">📦 Extensions</h2>

        <div v-if="extensionsStore.loading" class="text-blue-400">
          Chargement des extensions...
        </div>

        <div v-else-if="extensionsStore.error" class="mb-4 text-red-400">
          ❌ {{ extensionsStore.error }}
        </div>

        <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="ext in extensionsStore.availableExtensions"
            :key="ext.id"
            class="rounded-lg border-2 bg-gray-800 p-4"
            :class="
              extensionsStore.activeExtensionId === ext.id
                ? 'border-green-500'
                : 'border-gray-600'
            "
          >
            <h3 class="text-lg font-semibold">{{ ext.name }}</h3>
            <p class="mb-2 text-sm text-gray-400">v{{ ext.version }}</p>
            <p class="mb-4 text-sm text-gray-300">{{ ext.description }}</p>

            <div class="flex gap-2">
              <button
                v-if="!extensionsStore.loadedExtensions[ext.id]"
                class="rounded bg-blue-600 px-3 py-1 text-sm hover:bg-blue-700"
                @click="installExtension(ext.id)"
              >
                Installer
              </button>

              <button
                v-else-if="extensionsStore.activeExtensionId !== ext.id"
                class="rounded bg-green-600 px-3 py-1 text-sm hover:bg-green-700"
                @click="extensionsStore.setActiveExtension(ext.id)"
              >
                Activer
              </button>

              <span v-else class="rounded bg-green-500 px-3 py-1 text-sm">
                ✅ Active
              </span>

              <button
                v-if="extensionsStore.loadedExtensions[ext.id]"
                class="rounded bg-red-600 px-3 py-1 text-sm hover:bg-red-700"
                @click="extensionsStore.uninstallExtension(ext.id)"
              >
                Désinstaller
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Test -->
      <div v-if="extensionsStore.activeExtension" class="mb-8">
        <h2 class="mb-4 text-2xl font-semibold">🧪 Tests</h2>

        <div class="rounded-lg bg-gray-800 p-6">
          <div class="mb-6 flex gap-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un anime..."
              class="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-white"
              @keyup.enter="testSearch"
            />
            <button
              class="rounded bg-blue-600 px-6 py-2 hover:bg-blue-700 disabled:bg-gray-600"
              :disabled="animeStore.loading"
              @click="testSearch"
            >
              🔍 Rechercher
            </button>
            <button
              class="rounded bg-green-600 px-6 py-2 hover:bg-green-700 disabled:bg-gray-600"
              :disabled="animeStore.loading"
              @click="testPopular"
            >
              🔥 Populaires
            </button>
            <button
              class="rounded bg-purple-600 px-6 py-2 hover:bg-purple-700 disabled:bg-gray-600"
              :disabled="animeStore.loading"
              @click="testLatest"
            >
              📅 Derniers
            </button>
          </div>

          <div v-if="animeStore.loading" class="text-blue-400">
            ⏳ Chargement...
          </div>

          <div v-else-if="animeStore.error" class="text-red-400">
            ❌ {{ animeStore.error }}
          </div>

          <div
            v-else
            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div
              v-for="anime in testResults.slice(0, 12)"
              :key="anime.id"
              class="cursor-pointer rounded-lg bg-gray-700 p-4 transition-colors hover:bg-gray-600"
              @click="testAnimeDetails(anime)"
            >
              <img
                v-if="anime.thumbnail"
                :src="anime.thumbnail"
                :alt="anime.title"
                class="mb-2 h-40 w-full rounded object-cover"
              />
              <h3 class="mb-1 text-sm font-semibold">{{ anime.title }}</h3>
              <p v-if="anime.status" class="text-xs text-gray-400">
                {{ anime.status }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Logs -->
      <div class="mb-8">
        <h2 class="mb-4 text-2xl font-semibold">📋 Logs</h2>
        <div class="h-40 overflow-y-auto rounded-lg bg-black p-4">
          <pre class="text-sm text-green-400">{{ logs.join('\n') }}</pre>
        </div>
        <button
          class="mt-2 rounded bg-red-600 px-4 py-2 text-sm hover:bg-red-700"
          @click="logs.length = 0"
        >
          Clear Logs
        </button>
      </div>

      <!-- Section Détails de l'anime sélectionné -->
      <div v-if="selectedAnime" class="mb-8">
        <h2 class="mb-4 text-2xl font-semibold">
          📺 {{ selectedAnime.title }}
        </h2>
        <div class="rounded-lg bg-gray-800 p-6">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <img
              v-if="selectedAnime.thumbnail"
              :src="selectedAnime.thumbnail"
              :alt="selectedAnime.title"
              class="h-80 w-full rounded object-cover"
            />
            <div class="md:col-span-2">
              <p v-if="selectedAnime.description" class="mb-4 text-gray-300">
                {{ selectedAnime.description }}
              </p>
              <div v-if="selectedAnime.genres" class="mb-4">
                <span
                  v-for="genre in selectedAnime.genres"
                  :key="genre"
                  class="mb-2 mr-2 inline-block rounded bg-blue-600 px-2 py-1 text-xs"
                >
                  {{ genre }}
                </span>
              </div>
              <button
                @click="testEpisodes(selectedAnime)"
                :disabled="animeStore.loading"
                class="rounded bg-purple-600 px-4 py-2 hover:bg-purple-700 disabled:bg-gray-600"
              >
                📋 Voir les épisodes
              </button>
            </div>
          </div>

          <!-- Episodes -->
          <div v-if="episodes.length > 0" class="mt-6">
            <h3 class="mb-4 text-xl font-semibold">
              Episodes ({{ episodes.length }})
            </h3>
            <div class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="episode in episodes.slice(0, 12)"
                :key="episode.id"
                class="cursor-pointer rounded bg-gray-700 p-3 transition-colors hover:bg-gray-600"
                @click="testVideoSources(episode)"
              >
                <span class="text-sm">{{ episode.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useExtensionsStore } from '@/stores/extensions';
import { useAnimeStore } from '@/stores/anime';

const extensionsStore = useExtensionsStore();
const animeStore = useAnimeStore();

const searchQuery = ref('naruto');
const testResults = ref<any[]>([]);
const selectedAnime = ref<any>(null);
const episodes = ref<any[]>([]);
const logs = ref<string[]>([]);

// Override console.log pour capturer les logs
const originalLog = console.log;
console.log = (...args: any[]) => {
  logs.value.push(args.join(' '));
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(-30);
  }
  originalLog(...args);
};

const installExtension = async (extensionId: string) => {
  try {
    await extensionsStore.installExtension(extensionId);
    logs.value.push(`✅ Extension ${extensionId} installée`);
  } catch (error) {
    logs.value.push(`❌ Erreur installation ${extensionId}: ${error}`);
  }
};

const testSearch = async () => {
  if (!searchQuery.value.trim()) return;

  try {
    logs.value.push(`🔍 Test recherche: "${searchQuery.value}"`);
    const results = await animeStore.searchAnimes(searchQuery.value);
    testResults.value = results;
    logs.value.push(`✅ ${results.length} résultats trouvés`);
  } catch (error) {
    logs.value.push(`❌ Erreur recherche: ${error}`);
  }
};

const testPopular = async () => {
  try {
    logs.value.push('🔥 Test animes populaires');
    const results = await extensionsStore.getPopularWithActiveExtension();
    testResults.value = results;
    logs.value.push(`✅ ${results.length} animes populaires trouvés`);
  } catch (error) {
    logs.value.push(`❌ Erreur populaires: ${error}`);
  }
};

const testLatest = async () => {
  try {
    logs.value.push('📅 Test animes récents');
    const results = await extensionsStore.getLatestWithActiveExtension();
    testResults.value = results;
    logs.value.push(`✅ ${results.length} animes récents trouvés`);
  } catch (error) {
    logs.value.push(`❌ Erreur récents: ${error}`);
  }
};

const testAnimeDetails = async (anime: any) => {
  try {
    logs.value.push(`📺 Test détails: ${anime.title}`);
    const details = await animeStore.fetchAnimeDetails(anime.id);
    selectedAnime.value = details;
    episodes.value = [];
    logs.value.push(`✅ Détails chargés pour ${anime.title}`);
  } catch (error) {
    logs.value.push(`❌ Erreur détails: ${error}`);
  }
};

const testEpisodes = async (anime: any) => {
  try {
    logs.value.push(`📋 Test épisodes: ${anime.title}`);
    const episodeList = await animeStore.fetchEpisodeList(anime.id);
    episodes.value = episodeList;
    logs.value.push(`✅ ${episodeList.length} épisodes trouvés`);
  } catch (error) {
    logs.value.push(`❌ Erreur épisodes: ${error}`);
  }
};

const testVideoSources = async (episode: any) => {
  try {
    logs.value.push(`🎥 Test sources: ${episode.title}`);
    const sources = await animeStore.fetchVideoSources(episode.url);
    logs.value.push(`✅ ${sources.length} sources trouvées`);
    sources.forEach((source: any) => {
      logs.value.push(
        `  - ${source.quality} (${source.language}): ${source.url.substring(0, 50)}...`
      );
    });
  } catch (error) {
    logs.value.push(`❌ Erreur sources: ${error}`);
  }
};

onMounted(async () => {
  logs.value.push('🚀 Initialisation du test des extensions');

  try {
    await extensionsStore.loadManifest();
    logs.value.push('✅ Manifest chargé');
  } catch (error) {
    logs.value.push(`❌ Erreur chargement manifest: ${error}`);
  }
});
</script>
