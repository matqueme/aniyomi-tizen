import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import vueSpatialNavigation from 'vue-spatial-nav';
import { register } from 'swiper/element/bundle';
import router from '@/router';

// Register Swiper custom elements
register();

import './style.css';
import App from '@/App.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'fr',
});

// Configuration pour la navigation TV
const spatialNavConfig = {
  straightOnly: true,
  straightOverlapThreshold: 0.8,
  rememberSource: false,
  disabled: false,
  defaultElement: '',
  enterTo: '',
  leaveFor: undefined,
  restrict: 'self-first' as const,
  tabIndexIgnoreList:
    'a, input, select, textarea, button, iframe, [contentEditable=true]',
  navigableFilter: undefined,
  scrollOptions: {
    behavior: 'smooth' as const,
    block: 'center' as const,
  },
};

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(i18n);
app.use(router);
app.use(vueSpatialNavigation, spatialNavConfig);

// Initialiser les extensions après que l'app soit montée
app.mount('#app');

// Initialisation des extensions
import { useExtensionsStore } from '@/stores/extensions';
const extensionsStore = useExtensionsStore();

// Chargement initial du manifest
extensionsStore.loadManifest().catch((error) => {
  console.error('Erreur lors du chargement initial des extensions:', error);
});
