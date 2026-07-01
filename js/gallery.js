/**
 * =====================================================================
 * Atlantic Blue Diving
 * Gallery Module
 * ---------------------------------------------------------------------
 * Características:
 * • Masonry Layout
 * • Lazy Loading
 * • Responsive Images
 * • Lightbox Premium
 * • Keyboard Navigation
 * • Swipe Navigation
 * • Focus Trap
 * • Restore Focus
 * • ResizeObserver
 * • MutationObserver
 * • Image.decode()
 * • Caption Translation Ready
 * • WCAG AA
 * =====================================================================
 */

'use strict';

class Gallery {

    constructor() {

        /* ==========================================================
         * CONFIG
         * ========================================================== */

        this.config = Object.freeze({

            animationDuration: 350,

            swipeThreshold: 60,

            masonryGap: 24,

            preloadDistance: 2,

            observerMargin: '250px',

            observerThreshold: 0.15

        });

        /* ==========================================================
         * DOM
         * ========================================================== */

        this.gallery =
            document.querySelector('.gallery-grid');

        this.items = [];

        this.filters = [];

        this.lightbox =
            document.querySelector('.lightbox');

        this.image =
            document.querySelector('.lightbox-image');

        this.caption =
            document.querySelector('.lightbox-caption');

        this.closeButton =
            document.querySelector('.lightbox-close');

        this.previousButton =
            document.querySelector('.lightbox-prev');

        this.nextButton =
            document.querySelector('.lightbox-next');

        this.counter =
            document.querySelector('.lightbox-counter');

        /* ==========================================================
         * STATE
         * ========================================================== */

        this.currentIndex = 0;

        this.visibleItems = [];

        this.lastFocusedElement = null;

        this.isOpen = false;

        this.isAnimating = false;

        this.touchStartX = 0;

        this.touchEndX = 0;

        /* ==========================================================
         * OBSERVERS
         * ========================================================== */

        this.lazyObserver = null;

        this.resizeObserver = null;

        this.mutationObserver = null;

        /* ==========================================================
         * EVENTS
         * ========================================================== */

        this.abortController =
            new AbortController();

        this.signal =
            this.abortController.signal;

    }

    /* ==============================================================
     * INIT
     * ============================================================== */

    init() {

        if (!this.gallery) return;

        this.cacheDom();

        this.createObservers();

        this.bindEvents();

        this.observeImages();

        this.observeLayout();

        this.observeMutations();

        this.updateLayout();

    }

    /* ==============================================================
     * CACHE
     * ============================================================== */

    cacheDom() {

        this.items = [

            ...this.gallery.querySelectorAll(

                '.gallery-item'

            )

        ];

        this.visibleItems = [...this.items];

        this.filters = [

            ...document.querySelectorAll(

                '.gallery-filter'

            )

        ];

    }

    /* ==============================================================
     * OBSERVERS
     * ============================================================== */

    createObservers() {

        this.createLazyObserver();

        this.createResizeObserver();

        this.createMutationObserver();

    }

    createLazyObserver() {

        if (!('IntersectionObserver' in window))
            return;

        this.lazyObserver =
            new IntersectionObserver(

                this.handleLazyEntries.bind(this),

                {

                    rootMargin:
                        this.config.observerMargin,

                    threshold:
                        this.config.observerThreshold

                }

            );

    }

    createResizeObserver() {

        if (!('ResizeObserver' in window))
            return;

        this.resizeObserver =
            new ResizeObserver(() => {

                this.scheduleLayout();

            });

    }

    createMutationObserver() {

        if (!('MutationObserver' in window))
            return;

        this.mutationObserver =
            new MutationObserver(() => {

                this.cacheDom();

                this.observeImages();

                this.scheduleLayout();

            });

    }

    observeImages() {

        if (!this.lazyObserver) {

            this.items.forEach(item => {

                this.loadImage(item);

            });

            return;

        }

        this.items.forEach(item => {

            this.lazyObserver.observe(item);

        });

    }

    observeLayout() {

        if (!this.resizeObserver)
            return;

        this.items.forEach(item => {

            this.resizeObserver.observe(item);

        });

    }

    observeMutations() {

        if (!this.mutationObserver)
            return;

        this.mutationObserver.observe(

            this.gallery,

            {

                childList: true,

                subtree: true

            }

        );

    }

    /* ==============================================================
     * LAZY LOADING
     * ============================================================== */

    async handleLazyEntries(entries) {

        for (const entry of entries) {

            if (!entry.isIntersecting) continue;

            this.lazyObserver.unobserve(entry.target);

            await this.loadImage(entry.target);

        }

    }

    async loadImage(item) {

        const image = item.querySelector('img');

        if (!image) return;

        const source =
            image.dataset.src ||
            image.dataset.full ||
            image.currentSrc ||
            image.src;

        if (!source) return;

        try {

            if (image.dataset.src) {

                image.src = image.dataset.src;

            }

            if (image.dataset.srcset) {

                image.srcset = image.dataset.srcset;

            }

            if (image.dataset.sizes) {

                image.sizes = image.dataset.sizes;

            }

            if ('decode' in image) {

                await image.decode();

            }

            image.classList.add('is-loaded');

            item.classList.add('image-loaded');

            this.scheduleLayout();

        }

        catch {

            this.handleImageError(image);

        }

    }

    handleImageError(image) {

        image.classList.add('image-error');

        image.alt =
            image.alt ||
            'Imagen no disponible';

    }


    /* ==============================================================
     * MASONRY ENGINE
     * ============================================================== */

    scheduleLayout() {

        cancelAnimationFrame(this.layoutFrame);

        this.layoutFrame = requestAnimationFrame(() => {

            this.updateLayout();

        });

    }

    updateLayout() {

        if (!this.gallery) return;

        if (
            window.matchMedia('(max-width: 768px)').matches
        ) {

            this.resetLayout();

            return;

        }

        const computed =
            getComputedStyle(this.gallery);

        const columns =
            parseInt(
                computed.getPropertyValue('--gallery-columns')
            ) || 3;

        const columnHeights =
            new Array(columns).fill(0);

        this.items.forEach(item => {

            if (
                item.classList.contains('is-hidden')
            ) {

                item.style.order = '';

                return;

            }

            const shortest =
                columnHeights.indexOf(
                    Math.min(...columnHeights)
                );

            item.style.order = shortest;

            columnHeights[shortest] +=
                item.offsetHeight +
                this.config.masonryGap;

        });

    }

    resetLayout() {

        this.items.forEach(item => {

            item.style.order = '';

        });

    }


    /* ==============================================================
     * FILTERS
     * ============================================================== */

    filter(category = 'all') {

        this.visibleItems = [];

        this.filters.forEach(button => {

            button.classList.toggle(

                'is-active',

                button.dataset.filter === category

            );

            button.setAttribute(

                'aria-pressed',

                String(
                    button.dataset.filter === category
                )

            );

        });

        this.items.forEach(item => {

            const visible =

                category === 'all' ||

                item.dataset.category === category;

            item.classList.toggle(

                'is-hidden',

                !visible

            );

            item.setAttribute(

                'aria-hidden',

                String(!visible)

            );

            if (visible) {

                this.visibleItems.push(item);

            }

        });

        this.scheduleLayout();

    }

    /* ==============================================================
     * LIGHTBOX
     * ============================================================== */

    open(index, triggerElement = null) {

        if (
            this.isAnimating ||
            !this.visibleItems.length
        ) {
            return;
        }

        this.currentIndex = Math.max(
            0,
            Math.min(index, this.visibleItems.length - 1)
        );

        this.lastFocusedElement =
            triggerElement || document.activeElement;

        this.isAnimating = true;
        this.isOpen = true;

        document.body.classList.add('lightbox-open');

        this.lightbox.classList.add('is-open');

        this.lightbox.setAttribute(
            'aria-hidden',
            'false'
        );

        this.renderCurrentImage()
            .then(() => {

                this.closeButton?.focus();

                this.isAnimating = false;

            });

    }


    close() {

        if (
            !this.isOpen ||
            this.isAnimating
        ) {

            return;

        }

        this.isAnimating = true;

        this.lightbox.classList.remove('is-open');

        this.lightbox.setAttribute(
            'aria-hidden',
            'true'
        );

        document.body.classList.remove(
            'lightbox-open'
        );

        window.setTimeout(() => {

            this.isOpen = false;

            this.isAnimating = false;

            if (
                this.lastFocusedElement instanceof HTMLElement
            ) {

                this.lastFocusedElement.focus();

            }

        }, this.config.animationDuration);

    }


    async renderCurrentImage() {

        const item =
            this.visibleItems[this.currentIndex];

        if (!item) return;

        const image =
            item.querySelector('img');

        if (!image) return;

        const source =

            image.dataset.full ||

            image.currentSrc ||

            image.src;

        const preload =
            new Image();

        preload.src = source;

        if ('decode' in preload) {

            try {

                await preload.decode();

            }

            catch {}

        }

        this.image.src = source;

        this.image.alt = image.alt;

        if (this.caption) {

            this.caption.textContent =

                image.dataset.caption ||

                image.alt ||

                '';

        }

        if (this.counter) {

            this.counter.textContent =

                `${this.currentIndex + 1} / ${this.visibleItems.length}`;

        }

        this.preloadNearbyImages();

    }


    next() {

        if (
            this.isAnimating ||
            !this.isOpen
        ) {

            return;

        }

        this.currentIndex =

            (this.currentIndex + 1) %

            this.visibleItems.length;

        this.renderCurrentImage();

    }


    previous() {

        if (
            this.isAnimating ||
            !this.isOpen
        ) {

            return;

        }

        this.currentIndex =

            (this.currentIndex - 1 + this.visibleItems.length)

            %

            this.visibleItems.length;

        this.renderCurrentImage();

    }


    preloadNearbyImages() {

        const total =
            this.visibleItems.length;

        for (

            let offset = 1;

            offset <= this.config.preloadDistance;

            offset++

        ) {

            const next =

                this.visibleItems[

                    (this.currentIndex + offset) % total

                ];

            const previous =

                this.visibleItems[

                    (this.currentIndex - offset + total) % total

                ];

            [next, previous].forEach(item => {

                if (!item) return;

                const image =
                    item.querySelector('img');

                if (!image) return;

                const preload =
                    new Image();

                preload.src =

                    image.dataset.full ||

                    image.currentSrc ||

                    image.src;

            });

        }

    }

    /* ==============================================================
     * EVENT BINDING
     * ============================================================== */

    bindEvents() {

        /* -------------------------
         * Filtros
         * ------------------------- */

        this.filters.forEach(button => {

            button.addEventListener(

                'click',

                () => {

                    this.filter(
                        button.dataset.filter || 'all'
                    );

                },

                {
                    signal: this.signal
                }

            );

        });


        /* -------------------------
         * Apertura del lightbox
         * ------------------------- */

        this.items.forEach((item) => {

            item.addEventListener(

                'click',

                () => {

                    if (
                        item.classList.contains('is-hidden')
                    ) {

                        return;

                    }

                    const index =
                        this.visibleItems.indexOf(item);

                    this.open(index, item);

                },

                {
                    signal: this.signal
                }

            );

        });


        /* -------------------------
         * Controles
         * ------------------------- */

        this.closeButton?.addEventListener(

            'click',

            () => this.close(),

            {
                signal: this.signal
            }

        );

        this.nextButton?.addEventListener(

            'click',

            () => this.next(),

            {
                signal: this.signal
            }

        );

        this.previousButton?.addEventListener(

            'click',

            () => this.previous(),

            {
                signal: this.signal
            }

        );


        /* -------------------------
         * Overlay
         * ------------------------- */

        this.lightbox?.addEventListener(

            'click',

            event => {

                if (
                    event.target === this.lightbox
                ) {

                    this.close();

                }

            },

            {
                signal: this.signal
            }

        );


        /* -------------------------
         * Teclado
         * ------------------------- */

        document.addEventListener(

            'keydown',

            event => {

                if (!this.isOpen) return;

                switch (event.key) {

                    case 'Escape':

                        this.close();

                        break;

                    case 'ArrowRight':

                        this.next();

                        break;

                    case 'ArrowLeft':

                        this.previous();

                        break;

                    case 'Tab':

                        this.handleFocusTrap(event);

                        break;

                }

            },

            {
                signal: this.signal
            }

        );


        /* -------------------------
         * Touch
         * ------------------------- */

        this.lightbox?.addEventListener(

            'touchstart',

            event => {

                this.touchStartX =
                    event.changedTouches[0].clientX;

            },

            {
                passive: true,
                signal: this.signal
            }

        );


        this.lightbox?.addEventListener(

            'touchend',

            event => {

                this.touchEndX =
                    event.changedTouches[0].clientX;

                this.handleSwipe();

            },

            {
                passive: true,
                signal: this.signal
            }

        );


        /* -------------------------
         * Cambio de idioma
         * ------------------------- */

        document.addEventListener(

            'languagechange',

            () => {

                if (this.isOpen) {

                    this.renderCurrentImage();

                }

            },

            {
                signal: this.signal
            }

        );

    }


    /* ==============================================================
     * FOCUS TRAP
     * ============================================================== */

    handleFocusTrap(event) {

        const focusable = [

            ...this.lightbox.querySelectorAll(

                'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'

            )

        ];

        if (!focusable.length) return;

        const first =
            focusable[0];

        const last =
            focusable[focusable.length - 1];

        if (

            event.shiftKey &&

            document.activeElement === first

        ) {

            event.preventDefault();

            last.focus();

            return;

        }

        if (

            !event.shiftKey &&

            document.activeElement === last

        ) {

            event.preventDefault();

            first.focus();

        }

    }


    /* ==============================================================
     * SWIPE
     * ============================================================== */

    handleSwipe() {

        const distance =

            this.touchStartX -

            this.touchEndX;

        if (

            Math.abs(distance) <

            this.config.swipeThreshold

        ) {

            return;

        }

        if (distance > 0) {

            this.next();

        }

        else {

            this.previous();

        }

    }
