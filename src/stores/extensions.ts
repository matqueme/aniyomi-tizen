import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Types pour les extensions
export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  bundleUrl: string;
  lang: string;
  nsfw: boolean;
  baseUrl: string;
  description: string;
}

export interface AnimeExtensionInterface {
  search(query: string, filters?: unknown): Promise<unknown[]>;
  getPopular(page?: number): Promise<unknown[]>;
  getLatest(page?: number): Promise<unknown[]>;
  getAnimeDetails(animeId: string): Promise<unknown>;
  getEpisodeList(animeId: string): Promise<unknown[]>;
  getVideoSources(episodeUrl: string): Promise<unknown[]>;
}

export interface LoadedExtension {
  manifest: ExtensionManifest;
  instance: AnimeExtensionInterface;
}

export const useExtensionsStore = defineStore('extensions', () => {
  // État
  const manifest = ref<ExtensionManifest[]>([]);
  const loadedExtensions = ref<Record<string, LoadedExtension>>({});
  const activeExtensionId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const availableExtensions = computed(() => manifest.value);
  const installedExtensions = computed(() =>
    Object.values(loadedExtensions.value)
  );
  const activeExtension = computed(() =>
    activeExtensionId.value
      ? loadedExtensions.value[activeExtensionId.value]
      : null
  );

  // Actions
  const loadManifest = async (
    manifestUrl: string = '/extensions/manifest.json'
  ) => {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔍 Chargement du manifest des extensions...');
      const response = await fetch(manifestUrl);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const manifestData = await response.json();
      manifest.value = manifestData;

      console.log(
        `✅ Manifest chargé: ${manifestData.length} extensions disponibles`
      );

      // Auto-charger la première extension si aucune n'est active
      if (manifestData.length > 0 && !activeExtensionId.value) {
        await installExtension(manifestData[0].id);
        setActiveExtension(manifestData[0].id);
      }
    } catch (err) {
      error.value = `Erreur lors du chargement du manifest: ${err}`;
      console.error('❌ Erreur manifest:', err);

      // Fallback: créer une extension mock pour le développement
      console.log('🔄 Utilisation de données de fallback...');
      manifest.value = [
        {
          id: 'animesama',
          name: 'Anime-Sama',
          version: '1.0.0',
          bundleUrl: '../aniyomi-extension/bundles/animesama.bundle.js',
          lang: 'fr',
          nsfw: false,
          baseUrl: 'https://anime-sama.fr',
          description: 'Extension pour scraper Anime-Sama',
        },
      ];
    } finally {
      loading.value = false;
    }
  };

  const installExtension = async (extensionId: string) => {
    const extensionManifest = manifest.value.find(
      (ext) => ext.id === extensionId
    );
    if (!extensionManifest) {
      throw new Error(`Extension ${extensionId} introuvable dans le manifest`);
    }

    if (loadedExtensions.value[extensionId]) {
      console.log(`✅ Extension ${extensionId} déjà installée`);
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      console.log(
        `📦 Installation de l'extension ${extensionManifest.name}...`
      );

      // Chargement dynamique du module
      const bundleUrl = extensionManifest.bundleUrl.startsWith('http')
        ? extensionManifest.bundleUrl
        : new URL(
            extensionManifest.bundleUrl,
            window.location.origin
          ).toString();

      console.log(`🔗 Chargement depuis: ${bundleUrl}`);

      // Import dynamique
      const module = await import(/* @vite-ignore */ bundleUrl);
      const ExtensionClass = module.default || module.AnimeSamaExtension;

      if (!ExtensionClass) {
        throw new Error('Extension invalide: pas de classe principale trouvée');
      }

      // Instanciation de l'extension
      const extensionInstance = new ExtensionClass();

      // Vérification de l'interface
      if (!extensionInstance.search || !extensionInstance.getPopular) {
        throw new Error('Extension invalide: méthodes manquantes');
      }

      loadedExtensions.value[extensionId] = {
        manifest: extensionManifest,
        instance: extensionInstance,
      };

      console.log(
        `✅ Extension ${extensionManifest.name} installée avec succès`
      );
    } catch (err) {
      error.value = `Erreur lors de l'installation de ${extensionManifest.name}: ${err}`;
      console.error('❌ Erreur installation:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uninstallExtension = (extensionId: string) => {
    if (loadedExtensions.value[extensionId]) {
      delete loadedExtensions.value[extensionId];
      console.log(`🗑️ Extension ${extensionId} désinstallée`);

      if (activeExtensionId.value === extensionId) {
        // Basculer vers une autre extension si disponible
        const remainingExtensions = Object.keys(loadedExtensions.value);
        activeExtensionId.value =
          remainingExtensions.length > 0 ? remainingExtensions[0] : null;
      }
    }
  };

  const setActiveExtension = (extensionId: string) => {
    if (loadedExtensions.value[extensionId]) {
      activeExtensionId.value = extensionId;
      console.log(`🎯 Extension active: ${extensionId}`);
    } else {
      console.warn(`⚠️ Extension ${extensionId} non installée`);
    }
  };

  // Méthodes helper pour utiliser l'extension active
  const searchWithActiveExtension = async (
    query: string,
    filters?: unknown
  ) => {
    const ext = activeExtension.value;
    if (!ext) {
      throw new Error('Aucune extension active');
    }

    console.log(`🔍 Recherche "${query}" avec ${ext.manifest.name}`);
    return await ext.instance.search(query, filters);
  };

  const getPopularWithActiveExtension = async (page = 1) => {
    const ext = activeExtension.value;
    if (!ext) {
      throw new Error('Aucune extension active');
    }

    console.log(
      `🔥 Récupération des populaires (page ${page}) avec ${ext.manifest.name}`
    );
    return await ext.instance.getPopular(page);
  };

  const getLatestWithActiveExtension = async (page = 1) => {
    const ext = activeExtension.value;
    if (!ext) {
      throw new Error('Aucune extension active');
    }

    console.log(`📅 Récupération des derniers avec ${ext.manifest.name}`);
    return await ext.instance.getLatest(page);
  };

  const getAnimeDetailsWithActiveExtension = async (animeId: string) => {
    const ext = activeExtension.value;
    if (!ext) {
      throw new Error('Aucune extension active');
    }

    return await ext.instance.getAnimeDetails(animeId);
  };

  const getEpisodeListWithActiveExtension = async (animeId: string) => {
    const ext = activeExtension.value;
    if (!ext) {
      throw new Error('Aucune extension active');
    }

    return await ext.instance.getEpisodeList(animeId);
  };

  const getVideoSourcesWithActiveExtension = async (episodeUrl: string) => {
    const ext = activeExtension.value;
    if (!ext) {
      throw new Error('Aucune extension active');
    }

    return await ext.instance.getVideoSources(episodeUrl);
  };

  return {
    // État
    manifest,
    loadedExtensions,
    activeExtensionId,
    loading,
    error,

    // Getters
    availableExtensions,
    installedExtensions,
    activeExtension,

    // Actions
    loadManifest,
    installExtension,
    uninstallExtension,
    setActiveExtension,

    // Méthodes helper
    searchWithActiveExtension,
    getPopularWithActiveExtension,
    getLatestWithActiveExtension,
    getAnimeDetailsWithActiveExtension,
    getEpisodeListWithActiveExtension,
    getVideoSourcesWithActiveExtension,
  };
});
