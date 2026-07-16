const CACHE_NAME = 'bubble-paradise-v2';
const ASSETS = [
    'index.html',
    'style.css',
    'script.js',
    'icon.png',
    'manifest.json',
    'sounds/pop.mp3',
    'sounds/pop.mp3.mp3',
    'sounds/dog.mp3',
    'sounds/dog.mp3.mp3',
    'sounds/cat.mp3',
    'sounds/cat.mp3.mp3',
    'sounds/cow.mp3',
    'sounds/cow.mp3.mp3',
    'sounds/goat.mp3',
    'sounds/goat.mp3.mp3',
    'sounds/heart.mp3',
    'sounds/heart.mp3.mp3',
    'sounds/rainbow.mp3',
    'sounds/rainbow.mp3.mp3',
    'sounds/flower.mp3',
    'sounds/flower.mp3.mp3',
    'sounds/candy.mp3',
    'sounds/candy.mp3.mp3',
    'sounds/star.mp3',
    'sounds/star.mp3.mp3',
    'sounds/music.mp3',
    'sounds/music.mp3.mp3',
    'sounds/bgMusic.mp3',
    'sounds/bgMusic.mp3.mp3',
    'sounds/celebrationMusic.mp3',
    'sounds/celebrationMusic.mp3.mp3'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                ASSETS.map((asset) => {
                    return cache.add(asset).catch(() => {
                        // Silently ignore missing custom sounds during install
                    });
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || fetch(e.request);
        })
    );
});
