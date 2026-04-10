const CACHE_VERSION = 'swarsadhana-v3';
const AUDIO_CACHE = 'swarsadhana-audio-v1';
const FONT_CACHE = 'swarsadhana-fonts-v1';

const PRECACHE_URLS = [
  './',
  'index.html',
  'styles.css',
  'css/robot-riyaaz.css',
  'css/robot-guruji.css',
  'js/practice-defaults.js',
  'js/music-constants.js',
  'js/taal-definitions.js',
  'js/webaudiofont/WebAudioFontPlayer.js',
  'js/webaudiofont/0210_FluidR3_GM_sf2_file.js',
  'js/realistic-audio-engine.js',
  'js/robot-riyaaz.js',
  'js/robot-riyaaz-ui.js',
  'js/robot-guruji.js',
  'assets/exercises/hindustani_class1.json',
  'manifest.json',
  'favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keepCaches = new Set([CACHE_VERSION, AUDIO_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !keepCaches.has(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes('/assets/audio/')) {
    event.respondWith(cacheFirstAudio(event.request));
    return;
  }

  if (url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(networkFirstFont(event.request));
    return;
  }

  event.respondWith(cacheFirstShell(event.request));
});

async function cacheFirstShell(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // For navigation requests (page loads), serve the cached shell so the
    // app still opens offline even if the exact URL wasn't cached.
    if (request.mode === 'navigate') {
      const shell = await caches.match('index.html');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirstAudio(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(AUDIO_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Audio unavailable offline' });
  }
}

async function networkFirstFont(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(FONT_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}
