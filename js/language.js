/**
 * ============================================================
 * Atlantic Blue Diving
 * Language Module
 * ------------------------------------------------------------
 * Internacionalización (i18n)
 * Idiomas soportados:
 * - Español
 * - English
 * - Galego
 * ============================================================
 */

'use strict';

class LanguageManager {

    constructor() {

        this.supportedLanguages = [
            'es',
            'en',
            'gl'
        ];

        this.defaultLanguage = 'es';

        this.currentLanguage = this.defaultLanguage;

        this.translations = {};

        this.abortController = new AbortController();

        this.signal = this.abortController.signal;

        this.selector =
            document.querySelector('.language-selector');

        this.buttons = [
            ...document.querySelectorAll('[data-language]')
        ];

        this.translatableElements = [
            ...document.querySelectorAll('[data-i18n]')
        ];

    }

    async init() {

        this.currentLanguage =
            this.detectLanguage();

        await this.loadAllLanguages();

        this.translatePage();

        this.updateSelector();

        this.bindEvents();

    }

    /* ============================================================
     * DETECCIÓN DE IDIOMA
     * ============================================================ */

    detectLanguage() {

        const saved =
            localStorage.getItem('abd-language');

        if (
            saved &&
            this.supportedLanguages.includes(saved)
        ) {

            return saved;

        }

        const browser =
            navigator.language
                .slice(0, 2)
                .toLowerCase();

        if (
            this.supportedLanguages.includes(browser)
        ) {

            return browser;

        }

        return this.defaultLanguage;

    }

    /* ============================================================
     * CARGA DE ARCHIVOS JSON
     * ============================================================ */

    async loadAllLanguages() {

        const promises =
            this.supportedLanguages.map(

                language =>

                    this.loadLanguage(language)

            );

        await Promise.all(promises);

    }

    async loadLanguage(language) {

        try {

            const response =
                await fetch(

                    `./locales/${language}.json`

                );

            if (!response.ok) {

                throw new Error(

                    `No se pudo cargar ${language}`

                );

            }

            this.translations[language] =
                await response.json();

        }

        catch (error) {

            console.error(

                `Error cargando idioma ${language}:`,

                error

            );

        }

    }

    /* ============================================================
     * CAMBIO DE IDIOMA
     * ============================================================ */

    async changeLanguage(language) {

        if (
            !this.supportedLanguages.includes(language)
        ) {

            return;

        }

        this.currentLanguage = language;

        localStorage.setItem(

            'abd-language',

            language

        );

        document.documentElement.lang =
            language;

        this.translatePage();

        this.updateSelector();

        document.dispatchEvent(

            new CustomEvent(

                'languagechange',

                {

                    detail: {

                        language

                    }

                }

            )

        );

    }

    /* ============================================================
     * TRADUCCIÓN DE LA PÁGINA
     * ============================================================ */

    translatePage() {

        const dictionary =
            this.translations[this.currentLanguage];

        if (!dictionary) return;

        this.translatableElements.forEach(element => {

            const key =
                element.dataset.i18n;

            const translation =
                this.getNestedValue(dictionary, key);

            if (translation === undefined) return;

            if (element.hasAttribute('data-i18n-html')) {

                element.innerHTML = translation;

                return;

            }

            element.textContent = translation;

        });

        this.translateAttributes(dictionary);

    }


    /* ============================================================
     * ATRIBUTOS TRADUCIBLES
     * ============================================================ */

    translateAttributes(dictionary) {

        document
            .querySelectorAll('[data-i18n-placeholder]')
            .forEach(element => {

                const key =
                    element.dataset.i18nPlaceholder;

                const value =
                    this.getNestedValue(dictionary, key);

                if (value !== undefined) {

                    element.setAttribute(
                        'placeholder',
                        value
                    );

                }

            });


        document
            .querySelectorAll('[data-i18n-title]')
            .forEach(element => {

                const key =
                    element.dataset.i18nTitle;

                const value =
                    this.getNestedValue(dictionary, key);

                if (value !== undefined) {

                    element.setAttribute(
                        'title',
                        value
                    );

                }

            });


        document
            .querySelectorAll('[data-i18n-alt]')
            .forEach(element => {

                const key =
                    element.dataset.i18nAlt;

                const value =
                    this.getNestedValue(dictionary, key);

                if (value !== undefined) {

                    element.setAttribute(
                        'alt',
                        value
                    );

                }

            });


        document
            .querySelectorAll('[data-i18n-aria-label]')
            .forEach(element => {

                const key =
                    element.dataset.i18nAriaLabel;

                const value =
                    this.getNestedValue(dictionary, key);

                if (value !== undefined) {

                    element.setAttribute(
                        'aria-label',
                        value
                    );

                }

            });

    }


    /* ============================================================
     * UTILIDADES
     * ============================================================ */

    getNestedValue(object, path) {

        return path
            .split('.')
            .reduce((current, key) => {

                if (
                    current &&
                    Object.prototype.hasOwnProperty.call(current, key)
                ) {

                    return current[key];

                }

                return undefined;

            }, object);

    }


    /* ============================================================
     * SELECTOR DE IDIOMA
     * ============================================================ */

    updateSelector() {

        this.buttons.forEach(button => {

            const isActive =
                button.dataset.language ===
                this.currentLanguage;

            button.classList.toggle(
                'is-active',
                isActive
            );

            button.setAttribute(
                'aria-pressed',
                String(isActive)
            );

        });

    }

    /* ============================================================
     * EVENTOS
     * ============================================================ */

    bindEvents() {

        this.buttons.forEach(button => {

            button.addEventListener(

                'click',

                () => {

                    const language =
                        button.dataset.language;

                    if (
                        language &&
                        language !== this.currentLanguage
                    ) {

                        this.changeLanguage(language);

                    }

                },

                {
                    signal: this.signal
                }

            );

        });


        window.addEventListener(

            'storage',

            event => {

                if (
                    event.key !== 'abd-language' ||
                    !event.newValue
                ) {

                    return;

                }

                if (
                    this.supportedLanguages.includes(
                        event.newValue
                    )
                ) {

                    this.currentLanguage =
                        event.newValue;

                    this.translatePage();

                    this.updateSelector();

                }

            },

            {
                signal: this.signal
            }

        );

    }


    /* ============================================================
     * API PÚBLICA
     * ============================================================ */

    getCurrentLanguage() {

        return this.currentLanguage;

    }


    getAvailableLanguages() {

        return [...this.supportedLanguages];

    }


    async reload() {

        await this.loadAllLanguages();

        this.translatePage();

    }


    /* ============================================================
     * CLEANUP
     * ============================================================ */

    destroy() {

        this.abortController.abort();

    }

}


/* ============================================================
 * INICIALIZACIÓN
 * ============================================================ */

document.addEventListener(

    'DOMContentLoaded',

    async () => {

        const languageManager =
            new LanguageManager();

        await languageManager.init();

        window.AtlanticBlue = Object.freeze({

            ...(window.AtlanticBlue || {}),

            language: languageManager

        });

    },

    {
        once: true
    }

);

