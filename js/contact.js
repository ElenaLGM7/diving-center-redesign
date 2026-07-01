/**
 * =====================================================================
 * Atlantic Blue Diving
 * Contact Module
 * ---------------------------------------------------------------------
 * Funcionalidades:
 * • Validación en tiempo real
 * • Sanitización de entradas
 * • Contador de caracteres
 * • Persistencia del borrador
 * • Recuperación automática
 * • Estado de carga
 * • Prevención de doble envío
 * • Accesibilidad WCAG AA
 * • API preparada para backend
 * =====================================================================
 */

'use strict';

class ContactForm {

    constructor() {

        /* ==========================================================
         * CONFIG
         * ========================================================== */

        this.config = Object.freeze({

            draftKey: 'abd-contact-draft',

            maxMessageLength: 1000,

            autosaveDelay: 500,

            loadingDuration: 1200,

            emailPattern:

                /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

        });

        /* ==========================================================
         * DOM
         * ========================================================== */

        this.form =
            document.querySelector('.contact-form');

        if (!this.form) return;

        this.fields = {

            name:
                this.form.querySelector('[name="name"]'),

            email:
                this.form.querySelector('[name="email"]'),

            phone:
                this.form.querySelector('[name="phone"]'),

            subject:
                this.form.querySelector('[name="subject"]'),

            message:
                this.form.querySelector('[name="message"]')

        };

        this.submitButton =
            this.form.querySelector('[type="submit"]');

        this.characterCounter =
            this.form.querySelector('.message-counter');

        this.status =
            this.form.querySelector('.form-status');

        /* ==========================================================
         * STATE
         * ========================================================== */

        this.isSubmitting = false;

        this.autosaveTimer = null;

        this.abortController =
            new AbortController();

        this.signal =
            this.abortController.signal;

    }

    /* ==========================================================
     * INIT
     * ========================================================== */

    init() {

        if (!this.form) return;

        this.restoreDraft();

        this.updateCharacterCounter();

        this.bindEvents();

        this.validateForm(false);

    }

    /* ==========================================================
     * EVENTS
     * ========================================================== */

    bindEvents() {

        Object.values(this.fields).forEach(field => {

            if (!field) return;

            field.addEventListener(

                'input',

                event => {

                    this.handleInput(event.target);

                },

                {
                    signal: this.signal
                }

            );

            field.addEventListener(

                'blur',

                event => {

                    this.validateField(event.target);

                },

                {
                    signal: this.signal
                }

            );

        });

        this.form.addEventListener(

            'submit',

            event => {

                event.preventDefault();

                this.handleSubmit();

            },

            {
                signal: this.signal
            }

        );

    }

    /* ==========================================================
     * INPUT
     * ========================================================== */

    handleInput(field) {

        this.sanitizeField(field);

        this.validateField(field);

        this.updateCharacterCounter();

        this.scheduleAutosave();

        this.validateForm();

    }

    sanitizeField(field) {

        if (!field) return;

        let value = field.value;

        value = value.replace(/\u200B/g, '');

        value = value.replace(/\s{2,}/g, ' ');

        if (

            field.name !== 'message'

        ) {

            value = value.trimStart();

        }

        field.value = value;

    }

    /* ==========================================================
     * VALIDACIÓN
     * ========================================================== */

    validateField(field) {

        if (!field) return true;

        const value =
            field.value.trim();

        let valid = true;

        switch (field.name) {

            case 'name':

                valid =
                    value.length >= 2;

                break;

            case 'email':

                valid =
                    this.config.emailPattern.test(value);

                break;

            case 'phone':

                valid =

                    value === '' ||

                    /^[+0-9()\-\s]{6,20}$/.test(value);

                break;

            case 'subject':

                valid =
                    value.length >= 3;

                break;

            case 'message':

                valid =
                    value.length >= 20 &&
                    value.length <=
                    this.config.maxMessageLength;

                break;

        }

        this.updateFieldState(

            field,

            valid

        );

        return valid;

    }

    /* ==========================================================
     * ESTADO VISUAL DE LOS CAMPOS
     * ========================================================== */

    updateFieldState(field, valid) {

        const fieldGroup =
            field.closest('.form-group');

        if (!fieldGroup) return;

        field.classList.toggle(
            'is-valid',
            valid
        );

        field.classList.toggle(
            'is-invalid',
            !valid
        );

        field.setAttribute(
            'aria-invalid',
            String(!valid)
        );

        const errorElement =
            fieldGroup.querySelector('.field-error');

        if (errorElement) {

            if (valid) {

                errorElement.textContent = '';

                errorElement.hidden = true;

            } else {

                errorElement.textContent =
                    this.getErrorMessage(field);

                errorElement.hidden = false;

                if (!errorElement.id) {

                    errorElement.id =
                        `${field.name}-error`;

                }

                field.setAttribute(
                    'aria-describedby',
                    errorElement.id
                );

            }

        }

    }


    getErrorMessage(field) {

        const messages = {

            name:
                'Introduce tu nombre completo.',

            email:
                'Introduce un correo electrónico válido.',

            phone:
                'Introduce un teléfono válido o deja este campo vacío.',

            subject:
                'El asunto debe tener al menos 3 caracteres.',

            message:
                `El mensaje debe tener entre 20 y ${this.config.maxMessageLength} caracteres.`

        };

        return messages[field.name] ||
            'Campo no válido.';

    }


    /* ==========================================================
     * VALIDACIÓN GLOBAL
     * ========================================================== */

    validateForm(showErrors = true) {

        const results = Object.values(this.fields)

            .filter(Boolean)

            .map(field => {

                if (!showErrors) {

                    return this.validateFieldSilently(field);

                }

                return this.validateField(field);

            });

        const valid =
            results.every(Boolean);

        if (this.submitButton) {

            this.submitButton.disabled =
                !valid || this.isSubmitting;

        }

        return valid;

    }


    validateFieldSilently(field) {

        const value =
            field.value.trim();

        switch (field.name) {

            case 'name':
                return value.length >= 2;

            case 'email':
                return this.config.emailPattern.test(value);

            case 'phone':
                return (
                    value === '' ||
                    /^[+0-9()\-\s]{6,20}$/.test(value)
                );

            case 'subject':
                return value.length >= 3;

            case 'message':
                return (
                    value.length >= 20 &&
                    value.length <= this.config.maxMessageLength
                );

            default:
                return true;

        }

    }


    /* ==========================================================
     * CONTADOR DE CARACTERES
     * ========================================================== */

    updateCharacterCounter() {

        if (
            !this.characterCounter ||
            !this.fields.message
        ) {

            return;

        }

        const current =
            this.fields.message.value.length;

        const maximum =
            this.config.maxMessageLength;

        this.characterCounter.textContent =
            `${current} / ${maximum}`;

        this.characterCounter.classList.toggle(
            'is-limit',
            current > maximum * 0.9
        );

    }


    /* ==========================================================
     * AUTOGUARDADO
     * ========================================================== */

    scheduleAutosave() {

        clearTimeout(this.autosaveTimer);

        this.autosaveTimer = setTimeout(() => {

            this.saveDraft();

        }, this.config.autosaveDelay);

    }


    saveDraft() {

        const draft = {};

        Object.entries(this.fields).forEach(

            ([key, field]) => {

                if (!field) return;

                draft[key] = field.value;

            }

        );

        try {

            sessionStorage.setItem(

                this.config.draftKey,

                JSON.stringify(draft)

            );

        }

        catch (error) {

            console.warn(

                'No se pudo guardar el borrador.',

                error

            );

        }

    }


    restoreDraft() {

        try {

            const draft = JSON.parse(

                sessionStorage.getItem(
                    this.config.draftKey
                )

            );

            if (!draft) return;

            Object.entries(draft).forEach(

                ([key, value]) => {

                    if (this.fields[key]) {

                        this.fields[key].value =
                            value;

                    }

                }

            );

        }

        catch {

            sessionStorage.removeItem(
                this.config.draftKey
            );

        }

    }

    /* ==========================================================
     * ENVÍO DEL FORMULARIO
     * ========================================================== */

    async handleSubmit() {

        if (
            this.isSubmitting ||
            !this.validateForm(true)
        ) {

            return;

        }

        this.isSubmitting = true;

        this.updateSubmitState(true);

        const formData =
            this.getFormData();

        document.dispatchEvent(

            new CustomEvent(

                'form:submit',

                {

                    detail: formData

                }

            )

        );

        try {

            await this.send(formData);

            this.handleSuccess();

        }

        catch (error) {

            this.handleError(error);

        }

        finally {

            this.isSubmitting = false;

            this.updateSubmitState(false);

        }

    }


    async send(data) {

        /*
         * Este método está preparado para sustituirse
         * por:
         *
         * - fetch()
         * - Formspree
         * - Netlify Forms
         * - Backend propio
         */

        await new Promise(resolve => {

            setTimeout(

                resolve,

                this.config.loadingDuration

            );

        });

        return data;

    }


    /* ==========================================================
     * DATOS
     * ========================================================== */

    getFormData() {

        const data = {};

        Object.entries(this.fields).forEach(

            ([key, field]) => {

                if (!field) return;

                data[key] =
                    field.value.trim();

            }

        );

        return data;

    }


    /* ==========================================================
     * ESTADO DEL BOTÓN
     * ========================================================== */

    updateSubmitState(loading) {

        if (!this.submitButton) return;

        this.submitButton.disabled = loading;

        this.submitButton.classList.toggle(
            'is-loading',
            loading
        );

        const idleText =
            this.submitButton.dataset.label ||
            'Enviar';

        const loadingText =
            this.submitButton.dataset.loading ||
            'Enviando...';

        this.submitButton.textContent =
            loading
                ? loadingText
                : idleText;

        this.form.classList.toggle(
            'is-submitting',
            loading
        );

    }


    /* ==========================================================
     * RESPUESTAS
     * ========================================================== */

    handleSuccess() {

        sessionStorage.removeItem(
            this.config.draftKey
        );

        this.form.reset();

        this.updateCharacterCounter();

        this.validateForm(false);

        this.showStatus(

            'success',

            '¡Mensaje enviado correctamente!'

        );

        document.dispatchEvent(

            new CustomEvent(

                'form:success'

            )

        );

    }


    handleError(error) {

        console.error(error);

        this.showStatus(

            'error',

            'No se pudo enviar el formulario. Inténtalo de nuevo.'

        );

        document.dispatchEvent(

            new CustomEvent(

                'form:error',

                {

                    detail: error

                }

            )

        );

    }


    showStatus(type, message) {

        if (!this.status) return;

        this.status.textContent = message;

        this.status.className =
            `form-status ${type}`;

        this.status.hidden = false;

        this.status.setAttribute(
            'role',
            'status'
        );

        this.status.setAttribute(
            'aria-live',
            'polite'
        );

    }


    /* ==========================================================
     * API PÚBLICA
     * ========================================================== */

    clearDraft() {

        sessionStorage.removeItem(
            this.config.draftKey
        );

    }


    reset() {

        this.form.reset();

        this.clearDraft();

        this.updateCharacterCounter();

        this.validateForm(false);

    }


    destroy() {

        clearTimeout(this.autosaveTimer);

        this.abortController.abort();

    }

}


/* ==========================================================
 * INICIALIZACIÓN
 * ========================================================== */

document.addEventListener(

    'DOMContentLoaded',

    () => {

        const contactForm =
            new ContactForm();

        contactForm.init();

        window.AtlanticBlue = Object.freeze({

            ...(window.AtlanticBlue || {}),

            contact: contactForm

        });

    },

    {
        once: true
    }

);
