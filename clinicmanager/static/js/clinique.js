const Clinique = (() => {
    'use strict';
    
    // Dependency check
    const requirements = [
        'BSN',
        'flatpickr',
        'moment',
        'JustValidate'
    ];
    
    for (const requirement of requirements) {
        if (!(requirement in window)) {
            throw new Error(`${requirement} is required.`);
        }
    }
    
    // Utility functions
    const getByClass = (className, parent=null) => {
        if (parent)
            return parent.getElementsByClassName(className)[0];
            
        return document.getElementsByClassName(className)[0];
    }
    
    const getByClassAll = (className, parent=null) => {
        let elements = parent ?
            parent.getElementsByClassName(className) :
            document.getElementsByClassName(className);
        
        return Array.from(elements);
    }
    
    const getBySelector = (selector, parent=null) => {
        return parent ?
            parent.querySelector(selector) :
            document.querySelector(selector);
    }
    
    const formatDate = (date, format='MMM D, YYYY') => {
        return moment(date).format(format);
    }
    
    const setClass = (element, ...className) => {
        element.classList.add(...className);
    }
    
    const removeClass = (element, ...className) => {
        element.classList.remove(...className);
    }
    
    const show = (element) => {
        removeClass(element, 'hidden');
    }
    
    const hide = (element) => {
        setClass(element, 'hidden');
    }
    
    const resetField = (element) => {
        element.value = '';
    }
    
    const enable = (element) => {
        element.disabled = false;
    }
    
    const disable = (element) => {
        element.disabled = true;
    }
    
    const getAttr = (element, attr) => {
        return element.getAttribute(attr);
    }
    
    const setAttr = (element, attr, value) => {
        return element.setAttribute(attr, value);
    }
    
    const setText = (element, text) => {
        element.textContent = text;
    }
    
    
    class Fetcher {
        #defaults = {
            errorMessage: 'Could not send the data.'
        }
        
        static sendJsonData = async(url, data, method='post') => {
            data = data instanceof FormData ? Object.fromEntries(data) : data;
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                },
                body: JSON.stringify(data)
            };
            const result = {
                message: '',
                success: true,
                data: null,
                redirect: null
            };
            const response = await fetch(url, options);

            if (response.ok) {
                const data = await response.json();
                result.message = data.message;
                result.redirect = data.redirect;

                if (data.success)
                    result.data = data.data;
                else
                    result.success = false;
            } else {
                result.message = this.defaults.errorMessage;
                result.success = false;
            }

            return result;
        }
        
        get defaults() {
            return this.#defaults;
        }
    }
    
    class Autocomplete {
        constructor(element, resultsContainer, url, callback=null) {
            this.searchElement = getBySelector(element);
            this.resultsList = getBySelector(resultsContainer);
            this.url = url;
            this.callback = callback;
            
            this.searchElement.addEventListener('input', this.#autocomplete.bind(this));
        }
        
        async #autocomplete(event) {
            const currentValue = this.searchElement.value;
            const searchResults = this.resultsList;

            hide(searchResults);

            if (currentValue) {
                const response = await fetch(this.url + '?query=' + currentValue, {
                    headers: {'Content-Type': 'application/json'}
                });
                const json = await response.json();

                if (response.ok) {
                    if (json.data.length) {
                        searchResults.replaceChildren();
                        searchResults.insertAdjacentHTML('beforeend', '');

                        json.data.forEach(data => {
                            const item = document.createElement('li');
                            const suggestion = document.createElement('a');

                            suggestion.classList.add('dropdown-item');
                            suggestion.textContent = data.full_name;
                            suggestion.href = '#';

                            suggestion.addEventListener('click', event => {
                                event.preventDefault();
                                RDC.setValue(this.searchElement, data.full_name);
                                hide(searchResults);
                                this.callback(data.unique_id);
                            });

                            item.appendChild(suggestion);
                            searchResults.appendChild(item);
                        });

                        show(searchResults);
                    }
                }
            }
        }
    }
    
    // SCHEDULER
    class Scheduler {
        #defaults = {
            url: '',
            general: false,
            dateFormat: 'm-d-Y',
            minDate: 'today',
            timeFormat: 'h:i K',
            minTime: '07:00',
            maxTime: '20:00',
            optionalTime: true,
            spinnerSelector: '.spinner-wrapper',
            formSelector: '.scheduler--form',
            dateSelector: '.scheduler--date',
            timeSelector: '.scheduler--time',
            timeTogglerSelector: '.scheduler--time-toggle',
            timeHiderSelector: '.scheduler--time-close',
            submitButtonSelector: '.scheduler--submit',
            patientTypeSelector: '.scheduler--type-selector',
            newPatientFieldSelector: '.scheduler--new-field',
            existingPatientFieldSelector: '.scheduler--existing-field',
        }
        
        constructor(modalElementSelector, options=null) {
            this.options = Object.assign(this.defaults, options) || this.defaults;
            
            this.modalElement = getBySelector(modalElementSelector);
            this.scheduleForm = getBySelector(
                this.options.formSelector, this.modalElement);
            this.scheduleDate = getBySelector(
                this.options.dateSelector, this.modalElement);
            this.scheduleTime = getBySelector(
                this.options.timeSelector, this.modalElement);
            this.timeToggler = getBySelector(
                this.options.timeTogglerSelector, this.modalElement);
            this.timeHider = getBySelector(
                this.options.timeHiderSelector, this.modalElement);
            this.submitButton = getBySelector(
                this.options.submitButtonSelector, this.modalElement);
            this.spinner = getBySelector(
                this.options.spinnerSelector, this.modalElement);
            
            this.patientType = null;
            this.newPatientField = null;
            this.existingPatientField = null;
            
            if (this.options.general) {
                this.patientType = getBySelector(
                    this.options.patientTypeSelector, this.modalElement);
                this.newPatientField = getBySelector(
                    this.options.newPatientFieldSelector, this.modalElement);
                this.existingPatientField = getBySelector(
                    this.options.existingPatientFieldSelector, this.modalElement);
            }
            
            this.modalElementInstance = new BSN.Modal(this.modalElement);
            
            // Initialize date & time picker
            flatpickr(this.scheduleDate, {
                dateFormat: this.options.dateFormat,
                minDate: this.options.minDate,
                onChange: (selectedDates, dateStr, instance) => {
                    const sourceElement = instance.element;
                    
                    setAttr(sourceElement, 'data-true-value', dateStr);
                    sourceElement.value = formatDate(dateStr);
                    
                    enable(this.submitButton);
                }
            });
            
            flatpickr(this.scheduleTime, {
                enableTime: true,
                noCalendar: true,
                dateFormat: this.options.timeFormat,
                minTime: this.options.minTime,
                maxTime: this.options.maxTime
            });
            
            if (this.options.optionalTime) {
                hide(this.scheduleTime);
                hide(this.timeHider);
            }
            
            this.#bindEvents();
        }
        
        reset() {
            this.scheduleForm.reset();
            this.#hideTime();
        }
        
        #showTime() {
            hide(this.timeToggler);
            show(this.scheduleTime);
            show(this.timeHider);
        }
        
        #hideTime() {
            show(this.timeToggler);
            hide(this.scheduleTime);
            hide(this.timeHider);
            resetField(this.scheduleTime);
        }
        
        async #submit() {
            disable(this.submitButton);
            
            if (!this.options.url) {
                console.error('Please specify a URL.');
                return;
            }
            
            const data = new FormData(this.scheduleForm);
            data.set(this.scheduleDate.name, 
                getAttr(this.scheduleDate, 'data-true-value'));
            
            show(this.spinner);
            
            const result = await Fetcher.sendJsonData(this.options.url, data);
            
            if (result.success) {
                RDC.notify('Success', 'Patient scheduled.', RDC.status.success);
                RDC.redirect(Flask.url_for('dashboard.view_calendar'), 1500);
            } else {
                RDC.notify('Failed', 'Schedule failed.', RDC.status.danger);
                hide(this.spinner);
                enable(this.submitButton);
            }
        }
        
        #togglePatientType() {
            const value = this.patientType.value;
            
            if (value === 'existing') {
                show(this.existingPatientField);
                hide(this.newPatientField);
            } else {
                hide(this.existingPatientField);
                show(this.newPatientField);
            }
        }
        
        #bindEvents() {
            this.modalElement.addEventListener('show.bs.modal', this.reset.bind(this));
            this.timeToggler.addEventListener('click', this.#showTime.bind(this));
            this.timeHider.addEventListener('click', this.#hideTime.bind(this));
            this.submitButton.addEventListener('click', this.#submit.bind(this));
            
            if (this.patientType) {
                this.patientType.addEventListener('change', 
                    this.#togglePatientType.bind(this));
            }
        }
        
        get defaults() {
            return this.#defaults;
        }
    }

    return {
        Fetcher,
        Autocomplete,
        Scheduler
    }
})();
