// Minimal no-op service worker to avoid 404s when the browser had a previous registration.
// This file is intentionally small. Remove or replace with your real service worker logic if needed.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Optional fetch handler: uncomment if you want the SW to be totally passive.
// self.addEventListener('fetch', (event) => {
//   // Let the network handle requests by default
// });
