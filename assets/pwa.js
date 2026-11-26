'use strict';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('[pwa] service worker registration failed', error);
    });
  });
}
