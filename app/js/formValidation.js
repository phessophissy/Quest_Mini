/**
 * Form Validation - Comprehensive form validation utilities
 * Quest Mini - Farcaster Mini-App
 */

(function() {
    'use strict';

    // Inject CSS styles
    const styles = `
        .form-field {
            position: relative;
            margin-bottom: 16px;
        }

        .form-field input,
        .form-field textarea,
        .form-field select {
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .form-field.is-valid input,
        .form-field.is-valid textarea,
        .form-field.is-valid select {
            border-color: #10B981 !important;
        }

        .form-field.is-invalid input,
        .form-field.is-invalid textarea,
        .form-field.is-invalid select {
            border-color: #EF4444 !important;
        }

        .form-field.is-validating input,
        .form-field.is-validating textarea {
            border-color: #8B5CF6 !important;
        }

        .validation-message {
            font-size: 12px;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            opacity: 0;
            transform: translateY(-4px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .validation-message.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .validation-message.error {
            color: #EF4444;
        }

        .validation-message.success {
            color: #10B981;
        }

        .validation-message.warning {
            color: #F59E0B;
        }

        .validation-icon {
            width: 14px;
            height: 14px;
        }

        .form-field .input-suffix {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
        }

        .form-field .input-suffix .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(139, 92, 246, 0.2);
            border-top-color: #8B5CF6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .password-strength {
            margin-top: 8px;
        }

        .password-strength-bar {
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.1);
            overflow: hidden;
        }

        .password-strength-fill {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease, background-color 0.3s ease;
        }

        .password-strength-label {
            font-size: 11px;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    `;

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    /**
     * Built-in validators
     */
    const validators = {
        required: (value, message) => ({
            valid: value !== null && value !== undefined && String(value).trim() !== '',
            message: message || 'This field is required'
        }),

        email: (value, message) => ({
            valid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: message || 'Please enter a valid email address'
        }),

        url: (value, message) => {
            if (!value) return { valid: true, message: '' };
            try {
                new URL(value);
                return { valid: true, message: '' };
            } catch {
                return { valid: false, message: message || 'Please enter a valid URL' };
            }
        },

        minLength: (value, min, message) => ({
            valid: !value || String(value).length >= min,
            message: message || `Must be at least ${min} characters`
        }),

        maxLength: (value, max, message) => ({
            valid: !value || String(value).length <= max,
            message: message || `Must be no more than ${max} characters`
        }),

        min: (value, min, message) => ({
            valid: value === '' || Number(value) >= min,
            message: message || `Must be at least ${min}`
        }),

        max: (value, max, message) => ({
            valid: value === '' || Number(value) <= max,
            message: message || `Must be no more than ${max}`
        }),

        pattern: (value, regex, message) => ({
            valid: !value || new RegExp(regex).test(value),
            message: message || 'Invalid format'
        }),

        numeric: (value, message) => ({
            valid: !value || /^\d+$/.test(value),
            message: message || 'Please enter only numbers'
        }),

        alphanumeric: (value, message) => ({
            valid: !value || /^[a-zA-Z0-9]+$/.test(value),
            message: message || 'Please enter only letters and numbers'
        }),

        phone: (value, message) => ({
            valid: !value || /^[\d\s\-+()]+$/.test(value) && value.replace(/\D/g, '').length >= 10,
            message: message || 'Please enter a valid phone number'
        }),

        ethereumAddress: (value, message) => ({
            valid: !value || /^0x[a-fA-F0-9]{40}$/.test(value),
            message: message || 'Please enter a valid Ethereum address'
        }),

        match: (value, otherFieldId, message) => {
            const otherField = document.getElementById(otherFieldId);
            const otherValue = otherField ? otherField.value : '';
            return {
                valid: value === otherValue,
                message: message || 'Fields do not match'
            };
        },

        custom: (value, validatorFn, message) => {
            const result = validatorFn(value);
            if (typeof result === 'boolean') {
                return { valid: result, message: result ? '' : (message || 'Invalid value') };
            }
            return result;
        }
    };

    /**
     * Password strength checker
     */
    function checkPasswordStrength(password) {
        let score = 0;
        const feedback = [];

        if (!password) {
            return { score: 0, strength: 'none', feedback: [], color: '#6B7280' };
        }

        // Length
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length < 8) feedback.push('Use at least 8 characters');

        // Uppercase
        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Add uppercase letters');

        // Lowercase
        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Add lowercase letters');

        // Numbers
        if (/\d/.test(password)) score += 1;
        else feedback.push('Add numbers');

        // Special characters
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        else feedback.push('Add special characters');

        // Common patterns (negative)
        if (/^[a-z]+$/i.test(password)) score -= 1;
        if (/^[0-9]+$/.test(password)) score -= 1;
        if (/(.)\1{2,}/.test(password)) score -= 1;

        score = Math.max(0, Math.min(5, score));

        const strengths = [
            { strength: 'very-weak', label: 'Very Weak', color: '#EF4444' },
            { strength: 'weak', label: 'Weak', color: '#F97316' },
            { strength: 'fair', label: 'Fair', color: '#F59E0B' },
            { strength: 'good', label: 'Good', color: '#84CC16' },
            { strength: 'strong', label: 'Strong', color: '#22C55E' },
            { strength: 'very-strong', label: 'Very Strong', color: '#10B981' }
        ];

        return {
            score,
            ...strengths[score],
            feedback,
            percent: (score / 5) * 100
        };
    }

    /**
     * Form Validator class
     */
    class FormValidator {
        constructor(formElement, options = {}) {
            this.form = typeof formElement === 'string' 
                ? document.querySelector(formElement) 
                : formElement;
            
            this.options = {
                validateOnBlur: true,
                validateOnInput: false,
                validateOnSubmit: true,
                showMessages: true,
                showIcons: true,
                debounceMs: 300,
                ...options
            };

            this.rules = {};
            this.errors = {};
            this.asyncValidators = new Map();
            this.debounceTimers = {};

            if (this.form) {
                this.init();
            }
        }

        init() {
            // Add event listeners
            if (this.options.validateOnBlur) {
                this.form.addEventListener('blur', this.handleBlur.bind(this), true);
            }

            if (this.options.validateOnInput) {
                this.form.addEventListener('input', this.handleInput.bind(this), true);
            }

            if (this.options.validateOnSubmit) {
                this.form.addEventListener('submit', this.handleSubmit.bind(this));
            }
        }

        /**
         * Add validation rules for a field
         */
        addRules(fieldName, rules) {
            this.rules[fieldName] = rules;
            return this;
        }

        /**
         * Add async validator
         */
        addAsyncValidator(fieldName, validator) {
            this.asyncValidators.set(fieldName, validator);
            return this;
        }

        /**
         * Handle blur event
         */
        handleBlur(event) {
            const field = event.target;
            if (field.name && this.rules[field.name]) {
                this.validateField(field.name);
            }
        }

        /**
         * Handle input event with debounce
         */
        handleInput(event) {
            const field = event.target;
            if (field.name && this.rules[field.name]) {
                clearTimeout(this.debounceTimers[field.name]);
                this.debounceTimers[field.name] = setTimeout(() => {
                    this.validateField(field.name);
                }, this.options.debounceMs);
            }
        }

        /**
         * Handle form submit
         */
        async handleSubmit(event) {
            event.preventDefault();
            
            const isValid = await this.validateAll();
            
            if (isValid && this.options.onSubmit) {
                const formData = new FormData(this.form);
                const data = Object.fromEntries(formData.entries());
                this.options.onSubmit(data, this.form);
            }
        }

        /**
         * Validate a single field
         */
        async validateField(fieldName) {
            const field = this.form.elements[fieldName];
            if (!field) return true;

            const rules = this.rules[fieldName];
            if (!rules) return true;

            const value = field.value;
            const fieldContainer = field.closest('.form-field') || field.parentElement;

            // Clear previous state
            this.clearFieldState(fieldContainer);

            // Run synchronous validators
            for (const rule of rules) {
                const result = this.runValidator(value, rule);
                if (!result.valid) {
                    this.setFieldError(fieldContainer, result.message);
                    this.errors[fieldName] = result.message;
                    return false;
                }
            }

            // Run async validator if exists
            const asyncValidator = this.asyncValidators.get(fieldName);
            if (asyncValidator) {
                this.setFieldValidating(fieldContainer);
                
                try {
                    const result = await asyncValidator(value);
                    if (!result.valid) {
                        this.setFieldError(fieldContainer, result.message);
                        this.errors[fieldName] = result.message;
                        return false;
                    }
                } catch (error) {
                    this.setFieldError(fieldContainer, 'Validation failed');
                    this.errors[fieldName] = 'Validation failed';
                    return false;
                }
            }

            // Field is valid
            this.setFieldValid(fieldContainer);
            delete this.errors[fieldName];
            return true;
        }

        /**
         * Run a single validator
         */
        runValidator(value, rule) {
            if (typeof rule === 'function') {
                return validators.custom(value, rule);
            }

            if (typeof rule === 'string') {
                return validators[rule] ? validators[rule](value) : { valid: true, message: '' };
            }

            if (typeof rule === 'object') {
                const { type, ...params } = rule;
                const validator = validators[type];
                
                if (!validator) {
                    return { valid: true, message: '' };
                }

                switch (type) {
                    case 'minLength':
                        return validator(value, params.value, params.message);
                    case 'maxLength':
                        return validator(value, params.value, params.message);
                    case 'min':
                        return validator(value, params.value, params.message);
                    case 'max':
                        return validator(value, params.value, params.message);
                    case 'pattern':
                        return validator(value, params.value, params.message);
                    case 'match':
                        return validator(value, params.field, params.message);
                    default:
                        return validator(value, params.message);
                }
            }

            return { valid: true, message: '' };
        }

        /**
         * Validate all fields
         */
        async validateAll() {
            const fieldNames = Object.keys(this.rules);
            const results = await Promise.all(
                fieldNames.map(name => this.validateField(name))
            );
            return results.every(result => result === true);
        }

        /**
         * Clear field validation state
         */
        clearFieldState(container) {
            container.classList.remove('is-valid', 'is-invalid', 'is-validating');
            const message = container.querySelector('.validation-message');
            if (message) {
                message.classList.remove('visible');
            }
        }

        /**
         * Set field as valid
         */
        setFieldValid(container) {
            container.classList.remove('is-invalid', 'is-validating');
            container.classList.add('is-valid');
            
            if (this.options.showMessages) {
                this.showMessage(container, '', 'success');
            }
        }

        /**
         * Set field as invalid
         */
        setFieldError(container, message) {
            container.classList.remove('is-valid', 'is-validating');
            container.classList.add('is-invalid');
            
            if (this.options.showMessages) {
                this.showMessage(container, message, 'error');
            }
        }

        /**
         * Set field as validating
         */
        setFieldValidating(container) {
            container.classList.remove('is-valid', 'is-invalid');
            container.classList.add('is-validating');
        }

        /**
         * Show validation message
         */
        showMessage(container, text, type) {
            let messageEl = container.querySelector('.validation-message');
            
            if (!messageEl) {
                messageEl = document.createElement('div');
                messageEl.className = 'validation-message';
                container.appendChild(messageEl);
            }

            messageEl.className = `validation-message ${type}`;
            messageEl.textContent = text;
            
            requestAnimationFrame(() => {
                if (text) {
                    messageEl.classList.add('visible');
                } else {
                    messageEl.classList.remove('visible');
                }
            });
        }

        /**
         * Get all errors
         */
        getErrors() {
            return { ...this.errors };
        }

        /**
         * Check if form is valid
         */
        isValid() {
            return Object.keys(this.errors).length === 0;
        }

        /**
         * Reset validation state
         */
        reset() {
            this.errors = {};
            const fields = this.form.querySelectorAll('.form-field');
            fields.forEach(field => this.clearFieldState(field));
        }

        /**
         * Destroy the validator
         */
        destroy() {
            this.form.removeEventListener('blur', this.handleBlur, true);
            this.form.removeEventListener('input', this.handleInput, true);
            this.form.removeEventListener('submit', this.handleSubmit);
            this.reset();
        }
    }

    /**
     * Create password strength indicator
     */
    function createPasswordStrength(inputElement, options = {}) {
        const input = typeof inputElement === 'string'
            ? document.querySelector(inputElement)
            : inputElement;

        if (!input) return null;

        const container = document.createElement('div');
        container.className = 'password-strength';
        container.innerHTML = `
            <div class="password-strength-bar">
                <div class="password-strength-fill"></div>
            </div>
            <div class="password-strength-label"></div>
        `;

        input.parentElement.appendChild(container);

        const fill = container.querySelector('.password-strength-fill');
        const label = container.querySelector('.password-strength-label');

        function update() {
            const strength = checkPasswordStrength(input.value);
            fill.style.width = `${strength.percent}%`;
            fill.style.backgroundColor = strength.color;
            label.textContent = strength.label || '';
            label.style.color = strength.color;

            if (options.onStrengthChange) {
                options.onStrengthChange(strength);
            }
        }

        input.addEventListener('input', update);
        update();

        return {
            update,
            destroy: () => {
                input.removeEventListener('input', update);
                container.remove();
            }
        };
    }

    // Export API
    window.FormValidation = {
        validators,
        FormValidator,
        checkPasswordStrength,
        createPasswordStrength,
        
        // Quick validation functions
        isEmail: (v) => validators.email(v).valid,
        isUrl: (v) => validators.url(v).valid,
        isEthAddress: (v) => validators.ethereumAddress(v).valid,
        isPhone: (v) => validators.phone(v).valid,
        isNumeric: (v) => validators.numeric(v).valid
    };

    console.log('✅ FormValidation module initialized');
})();
