/**
 * ============================================================
 * Atlantic Blue Diving
 * Navbar Module
 * ------------------------------------------------------------
 * Gestión completa de la navegación:
 * - Navbar sticky
 * - Menú móvil
 * - Accesibilidad
 * - Scroll Spy
 * - Navegación suave
 * ============================================================
 */

'use strict';

class Navbar {

    constructor() {

        this.navbar =
            document.querySelector('.navbar');

        this.toggle =
            document.querySelector('.nav-toggle');

        this.menu =
            document.querySelector('.nav-menu');

        this.overlay =
            document.querySelector('.nav-overlay');

        this.links = [
            ...document.querySelectorAll('.nav-link')
        ];

        this.isOpen = false;

        this.abortController =
            new AbortController();

        this.signal =
            this.abortController.signal;

        this.sectionObserver = null;

    }

    init() {

        if (!this.navbar) return;

        this.setupAccessibility();

        this.createObserver();

        this.observeSections();

        this.bindEvents();

        this.updateStickyState();

    }

    /* ============================================================
     * ACCESIBILIDAD
     * ============================================================ */

    setupAccessibility() {

        if (!this.toggle || !this.menu) return;

        this.toggle.setAttribute(
            'aria-expanded',
            'false'
        );

        this.toggle.setAttribute(
            'aria-label',
            'Abrir menú de navegación'
        );

        this.menu.setAttribute(
            'aria-hidden',
            'true'
        );

    }

    /* ============================================================
     * OBSERVER
     * ============================================================ */

    createObserver() {

        if (!('IntersectionObserver' in window))
            return;

        this.sectionObserver =
            new IntersectionObserver(

                this.handleSections.bind(this),

                {
                    threshold: 0.55,
                    rootMargin: '-80px 0px -40% 0px'
                }

            );

    }

    observeSections() {

        if (!this.sectionObserver) return;

        this.links.forEach(link => {

            const href =
                link.getAttribute('href');

            if (!href?.startsWith('#'))
                return;

            const section =
                document.querySelector(href);

            if (!section) return;

            this.sectionObserver.observe(section);

        });

    }

    handleSections(entries) {

        entries.forEach(entry => {

            if (!entry.isIntersecting)
                return;

            const id =
                `#${entry.target.id}`;

            this.links.forEach(link => {

                link.classList.toggle(

                    'is-active',

                    link.getAttribute('href') === id

                );

            });

        });

    }

    /* ============================================================
     * MENÚ MÓVIL
     * ============================================================ */

    openMenu() {

        if (!this.menu || !this.toggle) return;

        this.isOpen = true;

        this.menu.classList.add('is-open');

        this.toggle.classList.add('is-active');

        this.overlay?.classList.add('is-visible');

        document.body.classList.add('menu-open');

        this.toggle.setAttribute(
            'aria-expanded',
            'true'
        );

        this.menu.setAttribute(
            'aria-hidden',
            'false'
        );

        this.toggle.setAttribute(
            'aria-label',
            'Cerrar menú de navegación'
        );

        this.trapFocus();

    }


    closeMenu() {

        if (!this.menu || !this.toggle) return;

        this.isOpen = false;

        this.menu.classList.remove('is-open');

        this.toggle.classList.remove('is-active');

        this.overlay?.classList.remove('is-visible');

        document.body.classList.remove('menu-open');

        this.toggle.setAttribute(
            'aria-expanded',
            'false'
        );

        this.menu.setAttribute(
            'aria-hidden',
            'true'
        );

        this.toggle.setAttribute(
            'aria-label',
            'Abrir menú de navegación'
        );

        this.toggle.focus();

    }


    toggleMenu() {

        this.isOpen
            ? this.closeMenu()
            : this.openMenu();

    }


    /* ============================================================
     * NAVEGACIÓN SUAVE
     * ============================================================ */

    scrollToSection(target) {

        if (!target) return;

        const navbarHeight =
            this.navbar?.offsetHeight || 0;

        const offset =
            target.getBoundingClientRect().top +
            window.scrollY -
            navbarHeight;

        window.scrollTo({

            top: offset,

            behavior: window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches
                ? 'auto'
                : 'smooth'

        });

    }


    /* ============================================================
     * STICKY NAVBAR
     * ============================================================ */

    updateStickyState() {

        if (!this.navbar) return;

        this.navbar.classList.toggle(

            'is-sticky',

            window.scrollY > 20

        );

    }


    /* ============================================================
     * FOCUS TRAP
     * ============================================================ */

    trapFocus() {

        const focusable = this.menu.querySelectorAll(

            'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'

        );

        if (!focusable.length) return;

        const first = focusable[0];

        const last = focusable[focusable.length - 1];

        first.focus();

        const handleFocus = (event) => {

            if (!this.isOpen) return;

            if (event.key !== 'Tab') return;

            if (
                event.shiftKey &&
                document.activeElement === first
            ) {

                event.preventDefault();

                last.focus();

            }

            else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {

                event.preventDefault();

                first.focus();

            }

        };

        document.addEventListener(

            'keydown',

            handleFocus,

            {
                signal: this.signal
            }

        );

    }

    /* ============================================================
     * EVENTOS
     * ============================================================ */

    bindEvents() {

        if (this.toggle) {

            this.toggle.addEventListener(

                'click',

                () => {

                    this.toggleMenu();

                },

                {
                    signal: this.signal
                }

            );

        }


        if (this.overlay) {

            this.overlay.addEventListener(

                'click',

                () => {

                    this.closeMenu();

                },

                {
                    signal: this.signal
                }

            );

        }


        this.links.forEach(link => {

            link.addEventListener(

                'click',

                event => {

                    const href =
                        link.getAttribute('href');

                    if (href?.startsWith('#')) {

                        const target =
                            document.querySelector(href);

                        if (target) {

                            event.preventDefault();

                            this.scrollToSection(target);

                        }

                    }

                    this.closeMenu();

                },

                {
                    signal: this.signal
                }

            );

        });


        document.addEventListener(

            'keydown',

            event => {

                if (
                    event.key === 'Escape' &&
                    this.isOpen
                ) {

                    this.closeMenu();

                }

            },

            {
                signal: this.signal
            }

        );


        window.addEventListener(

            'scroll',

            () => {

                this.updateStickyState();

            },

            {
                passive: true,
                signal: this.signal
            }

        );


        window.addEventListener(

            'resize',

            () => {

                if (
                    window.innerWidth > 992 &&
                    this.isOpen
                ) {

                    this.closeMenu();

                }

            },

            {
                passive: true,
                signal: this.signal
            }

        );

    }


    /* ============================================================
     * CLEANUP
     * ============================================================ */

    destroy() {

        this.abortController.abort();

        this.sectionObserver?.disconnect();

    }

}


/* ============================================================
 * INICIALIZACIÓN
 * ============================================================ */

document.addEventListener(

    'DOMContentLoaded',

    () => {

        const navbar = new Navbar();

        navbar.init();

        window.AtlanticBlue = Object.freeze({

            ...(window.AtlanticBlue || {}),

            navbar

        });

    },

    {
        once: true
    }

);
