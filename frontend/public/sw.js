// Service Worker Minimal
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Biarkan request lewat secara normal
});