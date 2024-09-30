'use strict';

// Helpers
const setText = (element, text) => {
    element.textContent = text;
}

const show = (element) => {
    removeClass(element, 'hidden');
}

const hide = (element) => {
    setClass(element, 'hidden');
}
    
const enable = (element) =>
{
	element.disabled = false;
}

const setClass = (element, ...className) => {
    element.classList.add(...className);
}

const removeClass = (element, ...className) => {
    element.classList.remove(...className);
}

const disable = (element) =>
{
	element.disabled = true;
}

const setSuccess = (element) =>
{
	element.classList.remove('text-danger');
	element.classList.add('text-success');
}

const setSuccessMsg = (element, message) =>
{
	setText(element, message);
	setSuccess(element);
	show(element);
}

const setError = (element) =>
{
	element.classList.remove('text-success');
	element.classList.add('text-danger');
}

const setErrorMsg = (element, message) =>
{
	setText(element, message);
	setError(element);
	show(element);
}

const refresh = (milliseconds) =>
{
	setTimeout(() => {
		window.location.reload();
	}, milliseconds);
}

const redirect = (href, milliseconds=0) =>
{
	setTimeout(() => {
		window.location.href = href;
	}, milliseconds);
}

const pluralize = (text, count, plural='s') =>
{
	return count <= 1 ? text : text + 's';
}

const postData = async(button, messageBox, url, data, callback=null, onerror=null, refreshTime=1500) =>
{
	disable(button);
	setSuccessMsg(messageBox, 'Processing...');
	
	const response = await fetch(url, {
		method: 'post',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(data)
	});
	
	if (response.ok)
	{
		response.json().then(fields =>
		{
			if (fields.success)
			{
                setSuccessMsg(messageBox, fields.message);
                if (callback) callback(fields.data);
                else refresh(refreshTime);
            }
			else
			{
				setErrorMsg(messageBox, fields.message);
			}
		});

		return;
	}

	if (onerror) onerror();

    enable(button);
    setErrorMsg(messageBox, 'Could not send the data.');
}

const getData = async(messageBox, url, callback) =>
{
    setSuccessMsg(messageBox, 'Retrieving data...');

	const response = await fetch(url, {
		headers: {'Content-Type': 'application/json'}
	});

	if (response.ok)
	{
		response.json().then(fields =>
		{
			if (fields.success)
			{
			    hide(messageBox);
				callback(fields.data);
			}
			else
			{
				setErrorMsg(messageBox, fields.message);
			}
		});

		return;
	}

	setErrorMsg(messageBox, 'Could not retrieve the data.');
}

const isMobile = () =>
{
    let parser = new UAParser();
    return parser.getDevice().type === 'mobile';
}

const toFloat = input => {
    return parseFloat(input.replace(/,/g, ''));
}

const formatCurrency = input => {
    return parseFloat(input).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

const trigger = (element, event) => {
    element.dispatchEvent(new Event(event));
}

const sendJsonData = async(url, data) => {
    const options = {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        cache: 'no-cache',
        body: JSON.stringify(data)
    };
    const result = {
        message: '',
        success: true,
        data: null
    };
    const response = await fetch(url, options);

    if (response.ok) {
        const data = await response.json();
        result.message = data.message;

        if (data.success)
            result.data = data.data;
        else
            result.success = false;
    }
    else {
        result.message = 'Could not send the data.';
        result.success = false;
    }

    return result;
}

const getJsonData = async(url) => {
    const options = {
        headers: {'Content-Type': 'application/json'},
        cache: 'no-cache'
    };
    const result = {
        message: '',
        success: true,
        data: null
    };
    const response = await fetch(url, options);

    if (response.ok) {
        const data = await response.json();
        result.message = data.message;

        if (data.success)
            result.data = data.data;
        else
            result.success = false;
    }
    else {
        result.message = 'Could not retrieve the data.';
        result.success = false;
    }

    return result;
}

const showToast = (element, title, message, status) => {
    if (!element)
        element = document.querySelector('.toast');

    element.classList.remove(
        'text-bg-danger',
        'text-bg-warning',
        'text-bg-success',
        'text-bg-info'
    );
    element.classList.add('text-bg-' + status);
    setText(element.querySelector('.toast-title'), title);
    setText(element.querySelector('.toast-body'), message);

    const toast = new BSN.Toast(element);
    toast.show();
}

class RDC {
    static status = {
        info: 'info',
        warning: 'warning',
        danger: 'danger',
        success: 'success'
    };
    
    static appendEnye = (el, trigger=false) => {
        const target = el.getAttribute('data-field');
        const field = this.getById(target);
        field.value += 'ñ';
        field.focus();

        if (trigger)
            this.trigger(field, 'input');
    }

    static cappy = el =>
    {
        el.value = el.value.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    static dotize = el =>
    {
        this.cappy(el);
        const val = el.value;

        if (val)
            el.value += val.indexOf('.') < 0 ? '.' : '';
    }
    
    // For accessing/creating elements
    static getById = (id, parent=null) => {
        if (parent)
            return parent.getElementById(id);

        return document.getElementById(id);
    }

    static getByClass = (className, parent=null) => {
        if (parent)
            return parent.getElementsByClassName(className)[0];

        return document.getElementsByClassName(className)[0];
    }

    static getByClassA = (className, parent=null) => {
        if (parent)
            return Array.from(parent.getElementsByClassName(className));

        return Array.from(document.getElementsByClassName(className));
    }

    static getBySelector = (selector, parent=null) => {
        if (parent)
            return parent.querySelector(selector);

        return document.querySelector(selector);
    }

    static getBySelectorA = (selector, parent=null) => {
        if (parent)
            return parent.querySelectorAll(selector);

        return document.querySelectorAll(selector);
    }
    
    static makeElement = element => {
        return document.createElement(element);
    }
    
    static setClass = (element, ...className) => {
        element.classList.add(...className);
    }
    
    static removeClass = (element, ...className) => {
        element.classList.remove(...className);
    }
    
    static switchClass = (element, oldClass, newClass) => {
        this.removeClass(element, oldClass);
        this.setClass(element, newClass);
    }
    
    static hasClass = (element, className) => {
        return element.classList.contains(className);
    }

    // For manipulating/getting values
    static getText = element => {
        return element.textContent;
    }

    static setText = (element, text) => {
        element.textContent = text;
    }

    static getValue = element => {
        return element.value;
    }
    
    static getFValue = element => {
        return this.toFloat(element.value);
    }

    static setValue = (element, value) => {
        element.value = value;
    }

    static getText = element => {
        return element.textContent;
    }
    
    static clear = element => {
        element.value = '';
    }
    
    static reset = this.clear;
    
    static resetF = element => {
        element.value = Number(0).toFixed(2);
    }
    
    static formatAsMoney = (element) => {
        element.addEventListener('focus', () => {
            this.setValue(element, element.value.replace(/,/g, ''));
        });

        element.addEventListener('change', () => {
            if (!this.isValidMoney(element.value))
                this.resetF(element);
            else
                this.setValue(element, this.formatCurrency(element.value, false));
        });
    }
    
    // Floats
    static formatCurrency = (value, includeSign=true, sign='₱') => {
        let result = this.toFloat(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        if (includeSign)
            result = sign + ' ' + result;
            
        return result;
    }
    
    static toFloat = value => {
        return typeof(value) === 'number' ? value : 
            parseFloat(value.replace(/,/g, ''));
    }

    // Simple showing/hiding
    static show = element => {
        element.style.display = 'block';
    }
    
    static showI = element => {
        element.style.display = 'inline-block';
    }

    static hide = element => {
        element.style.display = 'none';
    }
    
    // Asynchronous data handling
    static getJsonData = async(url) => {
        const options = {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
            cache: 'no-cache'
        };
        const result = {
            message: '',
            success: true,
            data: null
        };
        const response = await fetch(url, options);

        if (response.ok) {
            const data = await response.json();
            result.message = data.message;

            if (data.success) {
                result.data = data.data;
            }
            else
                result.success = false;
        } else {
            result.message = 'Could not retrieve the data.';
            result.success = false;
        }

        return result;
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
            result.message = 'Could not send the data.';
            result.success = false;
        }

        return result;
    }
    
    // Validations
    static isValidMoney = value => {
        value = this.toFloat(value);
        return value > 0 && !isNaN(value) && isFinite(value);
    }
    
    // Notifications
    static notify = (title, message, status=this.status.info, element=null) => {
        if (!element)
            element = this.getByClass('toast');

        this.removeClass(
            element,
            'text-bg-danger',
            'text-bg-warning',
            'text-bg-success',
            'text-bg-info'
        );
        this.setClass(element, 'text-bg-' + status);
        this.setText(this.getBySelector('.toast-header strong', element), title);
        
        const toastBody = this.getByClass('toast-body', element);
        
        if ('string' !== typeof message) {
            toastBody.replaceChildren();
            
            const ul = this.makeElement('ul');
            
            this.setClass(ul, 'ps-3', 'm-0');

            Object.values(message).forEach(item => {
                const li = this.makeElement('li');
                this.setText(li, item[0]);
                ul.appendChild(li);
            });
            
            toastBody.appendChild(ul);
        } else {
            this.setText(toastBody, message);
        }

        const toast = new BSN.Toast(element);
        toast.show();
    }
    
    static showFormMessage = (form, message, status=this.status.info) => {
        const element = this.getByClass('form-message', form);
        
        this.removeClass(
            element,
            'alert-danger',
            'alert-warning',
            'alert-success',
            'alert-info'
        );
        this.setClass(element, 'alert-' + status);
        this.setText(element, message);
        this.show(element);
    }
    
    static hideFormMessage = form => {
        this.hide(this.getByClass('form-message', form));
    }
    
    static refresh = time => {
        setTimeout(() => {
            window.location.reload();
        }, time);
    }
    
    static redirect = (location, time) => {
        setTimeout(() => {
            window.location.replace(location);
        }, time);
    }
    
    static trigger = (element, event) => {
        element.dispatchEvent(new Event(event));
    }
    
    static formatDate = date => {
        return moment(date).format('MMM D, YYYY');
    }
    
    static formatDateTime = datetime => {
        return moment(datetime).format('MMM D, YYYY, h:mm A');
    }
    
    static convertFileToBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
    });
    
    static scrollTop = () => window.scrollTo(0, 0);
    
    static enable(element) {
        element.disabled = false;
    }
    
    static disable(element) {
        element.disabled = true;
    }
};

(() => {
    RDC.getByClassA('cappy').forEach(el => {
        el.addEventListener('input', () => RDC.cappy(el));
    });
    
    RDC.getByClassA('dotize').forEach(el => {
        el.addEventListener('change', () => RDC.dotize(el));
    });
    
    RDC.getByClassA('enye-append').forEach(el => {
        el.addEventListener('click', () => RDC.appendEnye(el));
    });
})();