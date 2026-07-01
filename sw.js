/* ==========================================================
   Atlantic Blue Diving
   Service Worker
   Version 1.0.0
========================================================== */

'use strict';

/* ==========================================================
   CACHE
========================================================== */

const CACHE_VERSION = 'v1.0.0';

const STATIC_CACHE = `abd-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `abd-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `abd-images-${CACHE_VERSION}`;

/* ==========================================================
   OFFLINE PAGE
========================================================== */

const OFFLINE_URL = 'index.html';

/* ==========================================================
   STATIC FILES
========================================================== */

const STATIC_ASSETS = [

    /* HTML */

    '/',
    '/index.html',
    '/cursos.html',
    '/salidas.html',
    '/galeria.html',
    '/contacto.html',

    /* CSS */

    '/assets/css/variables.css',
    '/assets/css/style.css',
    '/assets/css/animations.css',
    '/assets/css/responsive.css',

    /* JavaScript */

    '/assets/js/main.js',
    '/assets/js/navbar.js',
    '/assets/js/gallery.js',
    '/assets/js/contact.js',
    '/assets/js/language.js',

    /* Manifest */

    '/manifest.webmanifest'

];

/* ==========================================================
   INSTALL
========================================================== */

self.addEventListener('install', event => {

    self.skipWaiting();

    event.waitUntil(

        caches
            .open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))

    );

});

/* ==========================================================
   ACTIVATE
========================================================== */

self.addEventListener('activate', event => {

    event.waitUntil(

        (async () => {

            const keys = await caches.keys();

            await Promise.all(

                keys.map(key => {

                    if (

                        key !== STATIC_CACHE &&
                        key !== DYNAMIC_CACHE &&
                        key !== IMAGE_CACHE

                    ) {

                        return caches.delete(key);

                    }

                })

            );

            await self.clients.claim();

        })()

    );

});

/* ==========================================================
   HELPERS
========================================================== */

async function cacheFirst(request, cacheName) {

    const cache = await caches.open(cacheName);

    const cached = await cache.match(request);

    if (cached) {

        return cached;

    }

    const response = await fetch(request);

    if (response.ok) {

        cache.put(request, response.clone());

    }

    return response;

}

async function networkFirst(request, cacheName) {

    const cache = await caches.open(cacheName);

    try {

        const response = await fetch(request);

        if (response.ok) {

            cache.put(request, response.clone());

        }

        return response;

    }

    catch {

        const cached = await cache.match(request);

        if (cached) {

            return cached;

        }

        return caches.match(OFFLINE_URL);

    }

}
