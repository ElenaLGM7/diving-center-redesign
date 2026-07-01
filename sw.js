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

/* ==========================================================
   FETCH
========================================================== */

self.addEventListener('fetch', event => {

    const { request } = event;

    /* Solo gestionamos peticiones GET */

    if (request.method !== 'GET') {

        return;

    }

    const url = new URL(request.url);

    /* Ignorar extensiones del navegador */

    if (url.origin !== self.location.origin) {

        return;

    }

    /* ===============================
       HTML
    ================================ */

    if (request.mode === 'navigate') {

        event.respondWith(

            networkFirst(
                request,
                DYNAMIC_CACHE
            )

        );

        return;

    }

    /* ===============================
       IMÁGENES
    ================================ */

    if (

        request.destination === 'image'

    ) {

        event.respondWith(

            cacheFirst(
                request,
                IMAGE_CACHE
            )

        );

        return;

    }

    /* ===============================
       CSS / JS / Fonts / Icons
    ================================ */

    if (

        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font' ||
        request.destination === 'manifest'

    ) {

        event.respondWith(

            cacheFirst(
                request,
                STATIC_CACHE
            )

        );

        return;

    }

    /* ===============================
       Vídeos
    ================================ */

    if (

        request.destination === 'video'

    ) {

        event.respondWith(

            networkFirst(
                request,
                DYNAMIC_CACHE
            )

        );

        return;

    }

    /* ===============================
       Otros recursos
    ================================ */

    event.respondWith(

        networkFirst(
            request,
            DYNAMIC_CACHE
        )

    );

});

/* ==========================================================
   BACKGROUND SYNC
========================================================== */

self.addEventListener('sync', event => {

    if (

        event.tag === 'contact-form'

    ) {

        event.waitUntil(

            Promise.resolve()

        );

    }

});

/* ==========================================================
   PUSH
========================================================== */

self.addEventListener('push', event => {

    if (!event.data) {

        return;

    }

    const data = event.data.json();

    const options = {

        body: data.body,

        icon: '/assets/icons/icon-192x192.png',

        badge: '/assets/icons/icon-96x96.png',

        image: data.image || undefined,

        vibrate: [

            200,
            100,
            200

        ],

        data: {

            url: data.url || '/'

        },

        actions: [

            {

                action: 'open',

                title: 'Abrir'

            },

            {

                action: 'close',

                title: 'Cerrar'

            }

        ]

    };

    event.waitUntil(

        self.registration.showNotification(

            data.title,

            options

        )

    );

});

/* ==========================================================
   NOTIFICATION CLICK
========================================================== */

self.addEventListener('notificationclick', event => {

    event.notification.close();

    if (

        event.action === 'close'

    ) {

        return;

    }

    const targetUrl =

        event.notification.data?.url || '/';

    event.waitUntil(

        clients
            .matchAll({

                type: 'window',
                includeUncontrolled: true

            })
            .then(windowClients => {

                for (const client of windowClients) {

                    if (

                        client.url === targetUrl &&
                        'focus' in client

                    ) {

                        return client.focus();

                    }

                }

                if (

                    clients.openWindow

                ) {

                    return clients.openWindow(targetUrl);

                }

            })

    );

});

/* ==========================================================
   MESSAGE
========================================================== */

self.addEventListener('message', event => {

    if (

        !event.data

    ) {

        return;

    }

    switch (event.data.type) {

        case 'SKIP_WAITING':

            self.skipWaiting();

            break;

        case 'CLEAR_DYNAMIC_CACHE':

            event.waitUntil(

                caches.delete(DYNAMIC_CACHE)

            );

            break;

        case 'CLEAR_IMAGE_CACHE':

            event.waitUntil(

                caches.delete(IMAGE_CACHE)

            );

            break;

        default:

            break;

    }

});

/* ==========================================================
   PERIODIC SYNC
========================================================== */

self.addEventListener('periodicsync', event => {

    if (

        event.tag !== 'refresh-content'

    ) {

        return;

    }

    event.waitUntil(

        Promise.resolve()

    );

});

/* ==========================================================
   SHARE TARGET
========================================================== */

self.addEventListener('fetch', event => {

    if (

        event.request.method === 'POST' &&
        event.request.url.endsWith('/share')

    ) {

        event.respondWith(

            Response.redirect(

                '/contacto.html',

                303

            )

        );

    }

});

/* ==========================================================
   CACHE STORAGE INFO
========================================================== */

async function getCacheSize(cacheName) {

    const cache = await caches.open(cacheName);

    const keys = await cache.keys();

    return keys.length;

}

/* ==========================================================
   DIAGNOSTICS
========================================================== */

async function logCacheInfo() {

    const [

        staticFiles,
        dynamicFiles,
        imageFiles

    ] = await Promise.all([

        getCacheSize(STATIC_CACHE),
        getCacheSize(DYNAMIC_CACHE),
        getCacheSize(IMAGE_CACHE)

    ]);

    console.info(

        '[Atlantic Blue Diving] Cache status',

        {

            staticFiles,
            dynamicFiles,
            imageFiles,
            version: CACHE_VERSION

        }

    );

}

self.addEventListener('activate', event => {

    event.waitUntil(

        logCacheInfo()

    );

});

/* ==========================================================
   END OF SERVICE WORKER
========================================================== */
