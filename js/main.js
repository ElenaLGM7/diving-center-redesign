/**
 * ============================================================
 * Atlantic Blue Diving
 * Main JavaScript
 * ------------------------------------------------------------
 * Inicialización global del sitio.
 * Las funcionalidades específicas (navbar, idiomas,
 * galería y formulario) se encuentran en sus módulos.
 * ============================================================
 */

'use strict';

/* ============================================================
 * CONFIGURACIÓN
 * ============================================================ */

const CONFIG = Object.freeze({
    selectors: {
        loader: '.loader',
        backToTop: '.back-to-top',
        floatingBar: '.floating-bar',
        counter: '[data-counter]',
        reveal: '[data-reveal]',
        lazySection: '[data-lazy-section]'
    },

    classes: {
        hidden: 'is-hidden',
        visible: 'is-visible',
        active: 'is-active',
        loaded: 'is-loaded',
        animated: 'is-animated'
    },

    observer: {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    }
});


/* ============================================================
 * UTILIDADES
 * ============================================================ */

const Utils = {

    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    isElement(element) {
        return element instanceof HTMLElement;
    },

    $(selector, scope = document) {
        return scope.querySelector(selector);
    },

    $$(selector, scope = document) {
        return [...scope.querySelectorAll(selector)];
    },

    debounce(callback, delay = 150) {

        let timeout;

        return (...args) => {

            clearTimeout(timeout);

            timeout = setTimeout(() => {
                callback(...args);
            }, delay);

        };

    },

    throttle(callback, delay = 100) {

        let waiting = false;

        return (...args) => {

            if (waiting) return;

            callback(...args);

            waiting = true;

            setTimeout(() => {
                waiting = false;
            }, delay);

        };

    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

};


/* ============================================================
 * CLASE PRINCIPAL
 * ============================================================ */

class App {

    constructor() {

        this.abortController = new AbortController();
        this.signal = this.abortController.signal;

        this.loader = Utils.$(CONFIG.selectors.loader);
        this.backToTop = Utils.$(CONFIG.selectors.backToTop);
        this.floatingBar = Utils.$(CONFIG.selectors.floatingBar);

        this.revealElements = [];
        this.counterElements = [];

        this.observer = null;

    }

    init() {

        this.cacheElements();

        this.createObserver();

        this.initLoader();

        this.initRevealAnimations();

        this.initCounters();

        this.initBackToTop();

        this.initFloatingBar();

        this.bindEvents();

    }

    cacheElements() {

        this.revealElements =
            Utils.$$(CONFIG.selectors.reveal);

        this.counterElements =
            Utils.$$(CONFIG.selectors.counter);

    }

    createObserver() {

        if (!('IntersectionObserver' in window)) return;

        this.observer = new IntersectionObserver(

            this.handleIntersection.bind(this),

            {
                threshold: CONFIG.observer.threshold,
                rootMargin: CONFIG.observer.rootMargin
            }

        );

    }


    handleIntersection(entries) {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            const element = entry.target;

            if (
                element.matches(CONFIG.selectors.reveal)
            ) {

                element.classList.add(
                    CONFIG.classes.visible
                );

            }

            if (
                element.matches(CONFIG.selectors.counter)
            ) {

                this.animateCounter(element);

            }

            this.observer.unobserve(element);

        });

    }


    observe(elements) {

        if (!this.observer) return;

        elements.forEach(element => {

            if (!Utils.isElement(element)) return;

            this.observer.observe(element);

        });

    }

    /* ============================================================
     * LOADER
     * ============================================================ */

    initLoader() {

        if (!this.loader) return;

        const finishLoading = () => {

            this.loader.classList.add(CONFIG.classes.loaded);

            window.setTimeout(() => {
                this.loader.remove();
            }, 600);

        };

        if (document.readyState === 'complete') {
            finishLoading();
        } else {
            window.addEventListener(
                'load',
                finishLoading,
                {
                    once: true,
                    signal: this.signal
                }
            );
        }

    }


    /* ============================================================
     * REVEAL ANIMATIONS
     * ============================================================ */

    initRevealAnimations() {

        if (!this.revealElements.length) return;

        if (Utils.prefersReducedMotion()) {

            this.revealElements.forEach(element => {
                element.classList.add(CONFIG.classes.visible);
            });

            return;

        }

        this.observe(this.revealElements);

    }


    /* ============================================================
     * COUNTERS
     * ============================================================ */

    initCounters() {

        if (!this.counterElements.length) return;

        if (Utils.prefersReducedMotion()) {

            this.counterElements.forEach(counter => {

                const target =
                    Number(counter.dataset.counter) || 0;

                counter.textContent =
                    target.toLocaleString();

            });

            return;

        }

        this.observe(this.counterElements);

    }


    animateCounter(element) {

        if (!Utils.isElement(element)) return;

        if (element.dataset.animated === 'true') return;

        element.dataset.animated = 'true';

        const target =
            Number(element.dataset.counter) || 0;

        const duration =
            Number(element.dataset.duration) || 1800;

        const suffix =
            element.dataset.suffix || '';

        const prefix =
            element.dataset.prefix || '';

        let startTime = null;

        const update = (timestamp) => {

            if (!startTime) {

                startTime = timestamp;

            }

            const progress =
                Math.min(
                    (timestamp - startTime) / duration,
                    1
                );

            const eased =
                Utils.easeOutCubic(progress);

            const value =
                Math.round(target * eased);

            element.textContent =
                `${prefix}${value.toLocaleString()}${suffix}`;

            if (progress < 1) {

                requestAnimationFrame(update);

            }

        };

        requestAnimationFrame(update);

    }


    /* ============================================================
     * BOTÓN VOLVER ARRIBA
     * ============================================================ */

    initBackToTop() {

        if (!this.backToTop) return;

        this.updateBackToTop();

        this.backToTop.addEventListener(

            'click',

            event => {

                event.preventDefault();

                window.scrollTo({

                    top: 0,

                    behavior: Utils.prefersReducedMotion()
                        ? 'auto'
                        : 'smooth'

                });

            },

            {
                signal: this.signal
            }

        );

    }


    updateBackToTop() {

        if (!this.backToTop) return;

        const shouldShow =
            window.scrollY > 500;

        this.backToTop.classList.toggle(

            CONFIG.classes.visible,

            shouldShow

        );

    }


    /* ============================================================
     * FLOATING BAR
     * ============================================================ */

    initFloatingBar() {

        if (!this.floatingBar) return;

        this.updateFloatingBar();

    }


    updateFloatingBar() {

        if (!this.floatingBar) return;

        const shouldShow =
            window.scrollY > 350;

        this.floatingBar.classList.toggle(

            CONFIG.classes.visible,

            shouldShow

        );

    }

    /* ============================================================
     * EVENTOS GLOBALES
     * ============================================================ */

    bindEvents() {

        const onScroll = Utils.throttle(() => {

            this.updateBackToTop();

            this.updateFloatingBar();

            this.updateScrollProgress();

            this.detectScrolledState();

        }, 50);


        window.addEventListener(

            'scroll',

            onScroll,

            {
                passive: true,
                signal: this.signal
            }

        );


        window.addEventListener(

            'resize',

            Utils.debounce(() => {

                this.handleResize();

            }, 200),

            {
                passive: true,
                signal: this.signal
            }

        );


        document.addEventListener(

            'visibilitychange',

            () => {

                if (document.hidden) return;

                this.refreshObserver();

            },

            {
                signal: this.signal
            }

        );

    }


    /* ============================================================
     * SCROLL PROGRESS
     * ============================================================ */

    updateScrollProgress() {

        const progressBar =
            document.querySelector('.scroll-progress');

        if (!progressBar) return;

        const scrollTop =
            window.scrollY;

        const documentHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const percentage =
            documentHeight > 0
                ? (scrollTop / documentHeight) * 100
                : 0;

        progressBar.style.width =
            `${Utils.clamp(percentage, 0, 100)}%`;

    }


    /* ============================================================
     * DETECTAR SCROLL
     * ============================================================ */

    detectScrolledState() {

        document.body.classList.toggle(

            'is-scrolled',

            window.scrollY > 20

        );

    }


    /* ============================================================
     * RESIZE
     * ============================================================ */

    handleResize() {

        this.updateBackToTop();

        this.updateFloatingBar();

        this.updateScrollProgress();

    }


    /* ============================================================
     * REFRESH OBSERVER
     * ============================================================ */

    refreshObserver() {

        if (!this.observer) return;

        this.revealElements.forEach(element => {

            if (
                element.classList.contains(
                    CONFIG.classes.visible
                )
            ) {
                return;
            }

            this.observer.observe(element);

        });


        this.counterElements.forEach(counter => {

            if (
                counter.dataset.animated === 'true'
            ) {
                return;
            }

            this.observer.observe(counter);

        });

    }


    /* ============================================================
     * CLEANUP
     * ============================================================ */

    destroy() {

        this.abortController.abort();

        if (this.observer) {

            this.observer.disconnect();

        }

    }

}


/* ============================================================
 * INICIALIZACIÓN
 * ============================================================ */

const app = new App();

document.addEventListener(

    'DOMContentLoaded',

    () => {

        app.init();

    },

    {
        once: true
    }

);


/* ============================================================
 * EXPORT FUTURO
 * ============================================================ */

window.AtlanticBlue = Object.freeze({

    app

});

