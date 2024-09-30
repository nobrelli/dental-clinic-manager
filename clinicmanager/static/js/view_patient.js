(() => {
    //////////////////////////////////////////////////////////////////////////////////////////
    // Delete
    //////////////////////////////////////////////////////////////////////////////////////////
    const confirmDelete = document.getElementById('confirm-delete');
    const unconfirmDelete = document.getElementById('unconfirm-delete');
    const deleteMessage = document.getElementById('delete-message');
    const patientId = sessionStorage.getItem('patient_unique_id');
    
    confirmDelete.addEventListener('click', async() => {
        const url = Flask.url_for('dashboard.delete_patient');

        RDC.setText(deleteMessage, 'Deleting...');
        RDC.disable(confirmDelete);
        RDC.disable(unconfirmDelete);
        
        const result = await RDC.sendJsonData(url, {
            unique_id: sessionStorage.getItem('patient_unique_id')
        });
        
        if (result.success) {
            RDC.setText(deleteMessage, result.message);
            RDC.switchClass(deleteMessage, RDC.status.danger, RDC.status.success);
            RDC.redirect(result.redirect, 3000);
        } else {
            RDC.setText(deleteMessage, result.message);
            RDC.setClass(deleteMessage, RDC.status.success, RDC.status.danger);
            RDC.enable(confirmDelete);
            RDC.enable(unconfirmDelete);
        }
    });

    RDC.getById('deleteToggle').onclick = () =>
    {
        setErrorMsg(deleteMessage, 'Everything associated with this record will be permanently erased. Do you really want to proceed?')
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Billing
    //////////////////////////////////////////////////////////////////////////////////////////
    const settleBtn = RDC.getById('billButton');
    
    // Initialize the validator
    const validation = new JustValidate('#billingForm', {
        errorFieldCssClass: 'is-invalid',
        validateBeforeSubmitting: true,
        focusInvalidField: true,
        lockForm: true
    });

    validation
        // Validate payment
        .addField('[name=payment]', [
            {
                validator: value => {
                    return toFloat(value) > 0;
                }
            }
        ])
        // Validate mode of payment
        .addField('[name=mop]', [
            {
                rule: 'required'
            }
        ])
        .onSuccess(async() => {
            // Gather the fields
            let procedures = [];
            let items = [];

            RDC.getBySelectorA('.procedure-field:not(.template)').forEach(field => {
                procedures.push({
                    'name': RDC.getBySelector('[name=procedure]', field).value,
                    'price': toFloat(field.querySelector('[name=price]').value)
                });
            });

            RDC.getBySelectorA('.item-field:not(.template)').forEach(field => {
                items.push({
                    'name': field.querySelector('[name=item]').value,
                    'quantity': field.querySelector('[name=qty]').value,
                    'price': toFloat(field.querySelector('[name=price]').value)
                });
            });

            const status = parseFloat(RDC.getBySelector('[name=balance]').value) > 0 ?
                            'Pending' : 'Cleared';

            const data = {
                type: document.querySelector('[name=account_type]').value,
                timestamp: document.getElementById('account-date').getAttribute('data-true-value'),
                procedures: procedures,
                products: items,
                mop: document.querySelector('[name=mop]').value,
                subtotal: toFloat(document.querySelector('[name=subtotal]').value),
                discount: toFloat(document.querySelector('[name=discount]').value),
                due: toFloat(document.querySelector('[name=total]').value),
                payment: toFloat(document.querySelector('[name=payment]').value),
                change: toFloat(document.querySelector('[name=change]').value),
                balance: toFloat(document.querySelector('[name=balance]').value),
                unique_id: document.querySelector('[name=patient_id]').value,
                status: status
            };

            const spinner = RDC.getBySelector('#billing .spinner-wrapper');
            const url = Flask.url_for('dashboard.create_bill');

            RDC.show(spinner);
            
            const result = await RDC.sendJsonData(url, data);
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                RDC.refresh(2000);
            } else {
                RDC.hide(spinner);
                RDC.notify('Process error', result.message, RDC.status.danger);
            }
        })
        .onFail(fields => {
            RDC.notify('Process error', 'Please double check the form.', RDC.status.danger);
        });
        
    const accountDate = document.getElementById('account-date');
    const accountType = document.querySelector('[name=account_type]');
    
    flatpickr(accountDate, {
        enableTime: true,
        dateFormat: 'm-d-Y h:i K',
        onChange: (selectedDates, dateStr, instance) => {
            const sourceElement = instance.element;
            
            sourceElement.setAttribute('data-true-value', dateStr);
            sourceElement.value = RDC.formatDateTime(dateStr);
        }
    });
    
    accountType.onchange = () => {
        if (accountType.value === 'existing') {
            accountDate.classList.remove('hidden');
            validation.addField(accountDate, [{ rule: 'required' }]);
        } else {
            accountDate.classList.add('hidden');
            validation.removeField(accountDate);
        }
    }

    const calculate = () => {
        const subtotal = document.querySelector('[name="subtotal"]');
        const total = document.querySelector('[name="total"]');
        const discount = document.querySelector('[name="discount"]');
        const payment = document.querySelector('[name="payment"]');
        const change = document.querySelector('[name="change"]');
        const balance = document.querySelector('[name="balance"]');
        const prices = document.querySelectorAll('[name="price"]');
        let sum = 0;

        prices.forEach(price => {
            sum += toFloat(price.value);
        });

        if (sum > 0) {
            enable(discount);
            enable(payment);
            enable(settleBtn);

            if (toFloat(discount.value) > sum)
                discount.value = '0.00';
        }
        else {
            disable(discount);
            disable(payment);
            disable(settleBtn);
        }

        subtotal.value = formatCurrency(sum);
        total.value = formatCurrency(sum - toFloat(discount.value));

        if (toFloat(payment.value) > 0) {
            if (toFloat(payment.value) > toFloat(total.value)) {
                balance.value = '0.00';
                change.value = formatCurrency(toFloat(payment.value) - toFloat(total.value));
            } else {
                change.value = '0.00';
                balance.value = formatCurrency(toFloat(total.value) - toFloat(payment.value));
            }
        }
        else {
            balance.value = '0.00';
            change.value = '0.00';
        }
    }

    // Autocomplete feature
    const autocomplete = async(event) => {
        const field = event.target;
        const currentValue = field.value;
        const url = Flask.url_for('dashboard.search_procedures');
        const dropdown = new BSN.Dropdown(field);
        const price = field.closest('.procedure-field').querySelector('[name="price"]');

        dropdown.hide();

        if (currentValue) {
            const response = await fetch(url + '?query=' + currentValue, {
                headers: {'Content-Type': 'application/json'}
            });
            const json = await response.json();

            if (response.ok) {
                if (json.data.length) {
                    const listContainer = event.srcElement.nextElementSibling;
                    listContainer.replaceChildren();

                    json.data.forEach(data => {
                        const item = document.createElement('li');
                        const suggestion = document.createElement('a');

                        suggestion.classList.add('dropdown-item');
                        suggestion.textContent = data.name;
                        suggestion.href = '#';

                        suggestion.addEventListener('click', event => {
                            event.preventDefault();
                            field.value = data.name;
                            dropdown.hide();

                            // Update the price field
                            price.value = data.price;
                            price.dispatchEvent(new Event('change'));
                        });

                        item.appendChild(suggestion);
                        listContainer.appendChild(item);
                    });

                    dropdown.show();
                }
            }
        }
        else {
            price.value = '0.00';
        }
    }

    // Add new fields
    document.querySelectorAll('.add-field').forEach(button => {
        button.addEventListener('click', () => {
            const fields = document.getElementsByClassName(button.getAttribute('data-template'));
            const clone = fields[0].cloneNode(true);
            const field = clone.querySelector('[name=procedure]');
            const select = clone.querySelector('[name="item"]');
            const price = clone.querySelector('[name="price"]');
            const quantity = clone.querySelector('[name="qty"]');
            const remover = clone.getElementsByClassName('remove-field')[0];

            if (field) {
                validation.addField(field, [
                    {
                        rule: 'required'
                    }
                ]);

                field.addEventListener('input', autocomplete);
                field.value = '';
            }

            if (quantity) {
                disable(quantity);
                quantity.addEventListener('change', () => {
                    if (parseInt(quantity.value) > 0) {
                        const currentPrice = parseFloat(select.selectedOptions[0].getAttribute('data-price').replace(/,/g, ''));
                        price.value = formatCurrency(currentPrice * parseInt(quantity.value));
                        calculate();
                    }
                });

                quantity.addEventListener('change', () => {
                    if (parseInt(quantity.value) < 1) {
                        quantity.value = 1;
                        quantity.dispatchEvent(new Event('change'));
                    }
                });
            }

            if (select) {
                validation.addField(select, [
                    {
                        rule: 'required'
                    }
                ]);

                select.addEventListener('change', () => {
                    price.value = RDC.formatCurrency(select.selectedOptions[0].getAttribute('data-price'), false);
                    calculate();
                    RDC.enable(quantity);
                });
            }

            price.addEventListener('change', () => {
                const floatValue = toFloat(price.value);

                if (floatValue < 0 || isNaN(floatValue))
                    price.value = '0.00';
                else
                    price.value = formatCurrency(floatValue);

                calculate();
            });

            validation.addField(price, [
                {
                    rule: 'required'
                },
                {
                    validator: value => {
                        return parseFloat(value) > 0;
                    }
                }
            ]);

            remover.addEventListener('click', () => {
                clone.remove();
                calculate();
                validation.removeField(price);

                if (field) validation.removeField(field);
                if (select) {
                    validation.removeField(quantity);
                    validation.removeField(select);
                }
            });

            clone.removeAttribute('style');
            clone.classList.remove('template');
            fields[0].parentElement.appendChild(clone);
        });
    });

    const discount = document.getElementsByName('discount')[0];
    discount.addEventListener('change', () => {
        if (toFloat(discount.value) < 0 || isNaN(discount.value))
            discount.value = '0.00';
        else
            discount.value = formatCurrency(discount.value);

        calculate();
    });

    const payment = document.getElementsByName('payment')[0];
    payment.addEventListener('change', () => {
        if (toFloat(payment.value) < 0 || isNaN(payment.value))
            payment.value = '0.00';
        else
            payment.value = formatCurrency(payment.value);

        calculate();
    });

    settleBtn.addEventListener('click', () => {
        document.getElementById('billingForm').dispatchEvent(new Event('submit'));
    });
    
    //////////////////////////////////////////////////////////////////////////////////////////
    // Prescription
    //////////////////////////////////////////////////////////////////////////////////////////
    const prescriptionForm = RDC.getById('prescription-form');
    
    const prescribeValidation = new JustValidate(prescriptionForm, {
        errorFieldCssClass: 'is-invalid',
        validateBeforeSubmitting: true,
        focusInvalidField: true,
        lockForm: true
    });
    
    prescribeValidation
        .addField('[name=medication]', [{rule: 'required'}])
        .addField('[name=disp]', [{rule: 'required'}])
        .addField('[name=dosage]', [{rule: 'required'}])
        .addField('[name=freqh]', [{rule: 'required'}])
        .onSuccess(async() => {
            const url = Flask.url_for('dashboard.add_prescription');
            const spinner = RDC.getByClass('spinner-wrapper', RDC.getById('prescription'));
            const data = {
                unique_id: RDC.getBySelector('[name=unique_id]').value,
                medications: getInputValues('medication', true),
                disp: getInputValues('disp'),
                dosage: getInputValues('dosage'),
                amount: getInputValues('amount'),
                hours: getInputValues('freqh'),
                days: getInputValues('freqd'),
                prn: getInputValues('prn')
            };

            RDC.show(spinner);
            
            const result = await RDC.sendJsonData(url, data);
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                form.reset();
                RDC.refresh(2000);
            } else {
                RDC.notify('Process error', result.message, RDC.status.danger);
                RDC.hide(spinner);
            }
        });
        
    const togglePrn = event => {
        field = event.target;
        const freqd = RDC.getBySelector('[name=freqd]', field.closest('.prescription-entry'));
        freqd.disabled = field.checked;
    };
        
    const getInputValues = (name, is_int=false) =>
    {
        const inputs = RDC.getBySelectorA('[name="' + name + '"]', prescriptionForm);
        let arr = [];

        for (const input of inputs)
        {
            let val = '';

            if (input.type === 'checkbox')
                val = input.checked.toString();
            else if (input.type === 'number')
                val = input.value ? parseInt(input.value) : 0;
            else
            {
                val = input.value;

                if (is_int)
                    val = parseInt(val);
            }

            arr.push(val);
        }

        return arr;
    }
    
    RDC.getById('prescribe-button').onclick = () => {
        RDC.trigger(prescriptionForm, 'submit');
    }
        
    const checkMedicationType = event => {
        field = event.target;

        const parent = field.closest('.prescription-entry');
        const dispType = RDC.getByClass('disp_type', parent);
        const doseType = RDC.getByClass('dose_type', parent);
        const amountField = RDC.getByClass('amount-field', parent);
        const amount = RDC.getBySelector('[name=amount]', parent);
        const disp = RDC.getBySelector('[name=disp]', parent);

        switch (field.options[field.selectedIndex].getAttribute('data-type'))
        {
            case 'tab':
                dispType.setAttribute('data-text', 'tablet');
                RDC.setText(dispType, 'tablet');
                RDC.setText(doseType, 'tab');
                RDC.hide(amountField);
                RDC.disable(amount);
                RDC.trigger(disp, 'input');
                amount.value = 0;
                break;
            case 'cap':
                dispType.setAttribute('data-text', 'capsule');
                RDC.setText(dispType, 'capsule');
                RDC.setText(doseType, 'cap');
                RDC.hide(amountField);
                RDC.disable(amount);
                RDC.trigger(disp, 'input');
                amount.value = 0;
                break;
            case 'bot':
                dispType.setAttribute('data-text', 'bottle');
                RDC.setText(dispType, 'bottle');
                RDC.setText(doseType, 'tsp.');
                RDC.show(amountField);
                RDC.enable(amount);
                RDC.trigger(disp, 'input');
                amount.value = '';
                break;
        }
    };
    
    const makePlural = event =>
    {
        field = event.target;
        const parent = field.closest('.prescription-entry');
        const t = RDC.getByClass('disp_type', parent);

        if (t.getAttribute('data-text'))
            t.textContent = pluralize(t.getAttribute('data-text'), field.value);
    }
    
    const removeForm = event => {
        const parent = event.target.closest('.prescription-entry');
        const medication = RDC.getBySelector('[name=medication]', parent);
        const disp = RDC.getBySelector('[name=disp]', parent);
        const dosage = RDC.getBySelector('[name=dosage]', parent);
        const freqh = RDC.getBySelector('[name=freqh]', parent);
        
        prescribeValidation
            .removeField(medication)
            .removeField(disp)
            .removeField(dosage)
            .removeField(freqh);
        
        parent.remove();
    }
    
    RDC.getById('addMed').addEventListener('click', () => {
        const newForm = RDC.getBySelector('#newDrugForm .row').cloneNode(true);
        const newButtonSection = RDC.getById('newButtonSection');
        const medication = RDC.getBySelector('[name=medication]', newForm);
        const disp = RDC.getBySelector('[name=disp]', newForm);
        const dosage = RDC.getBySelector('[name=dosage]', newForm);
        const freqh = RDC.getBySelector('[name=freqh]', newForm);
        
        // bind events
        RDC.getBySelector('[name=prn]', newForm).addEventListener('change', togglePrn);
        medication.addEventListener('change', checkMedicationType);
        disp.addEventListener('input', makePlural);
        RDC.trigger(medication, 'change');
        RDC.getByClass('remove-form', newForm).addEventListener('click', removeForm);
        
        prescribeValidation
            .addField(medication, [{rule: 'required'}])
            .addField(disp, [{rule: 'required'}])
            .addField(dosage, [{rule: 'required'}])
            .addField(freqh, [{rule: 'required'}]);
        
        prescriptionForm.insertBefore(newForm, newButtonSection);
    });

    // initial fields
    RDC.getByClass('remove-form').addEventListener('click', removeForm);
    RDC.getBySelector('[name=prn]').addEventListener('change', togglePrn);
    RDC.getBySelector('[name=medication]').addEventListener('change', checkMedicationType);
    RDC.getBySelector('[name=disp]').addEventListener('input', makePlural);
    
    //////////////////////////////////////////////////////////////////////////////////////////
    // Appointment scheduler
    //////////////////////////////////////////////////////////////////////////////////////////
    // const holidays = [
    //     '12-30-2022',
    //     '01-01-2023',
    //     '04-06-2023',
    //     '04-07-2023'
    // ];
    const time = RDC.getById('appointment-time');
    const showTimeBtn = RDC.getById('specify-time');
    const hideTimeBtn = RDC.getById('unspecify-time');
    const appointmentDate = RDC.getById('appointment-date');
    const appointmentTime = RDC.getById('appointment-time');
    const saveBtn = RDC.getById('save-appointment-btn');
    const form = RDC.getById('schedule-form');
    
    const schedValidation = new JustValidate(form, {
        errorFieldCssClass: 'is-invalid',
        validateBeforeSubmitting: true,
        focusInvalidField: true,
        lockForm: true
    });
    
    schedValidation
        .addField(appointmentDate, [{rule: 'required'}])
        .onSuccess(async() => {
            const url = Flask.url_for('dashboard.make_appointment');
            const data = new FormData(form);
            const spinner = RDC.getByClass('spinner-wrapper', form);
            
            data.set('appointment_date', appointmentDate.getAttribute('data-true-value'));
            RDC.show(spinner);
            
            const result = await RDC.sendJsonData(url, data);
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                form.reset();
            } else {
                RDC.notify('Process error', result.message, RDC.status.danger);
            }
            
            RDC.hide(spinner);
        });
    
    flatpickr(appointmentDate, {
        dateFormat: 'm-d-Y',
        minDate: 'today',
        onChange: (selectedDates, dateStr, instance) => {
            const el = instance.element;
            el.setAttribute('data-true-value', dateStr);
            RDC.setValue(el, RDC.formatDate(dateStr));
        }
    });
    
    flatpickr(appointmentTime, {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'h:i K',
        minTime: '09:00',
        maxTime: '17:00'
    });
    
    flatpickr('#birthdate', {
        onChange: (selectedDates, dateStr, instance) => {
            const el = instance.element;
            
            el.setAttribute('data-true-value', dateStr);
            RDC.setValue(el, RDC.formatDate(dateStr));
        }
    });
    
    appointmentDate.onchange = () => RDC.enable(saveBtn);
    appointmentTime.onchange = () => RDC.enable(saveBtn);
    saveBtn.onclick = () => RDC.trigger(form, 'submit');
    
    RDC.hide(time);
    RDC.hide(hideTimeBtn);
    
    showTimeBtn.addEventListener('click', () => {
        RDC.show(time);
        RDC.hide(showTimeBtn);
        RDC.show(hideTimeBtn);
        schedValidation.addField(appointmentTime, [{rule: 'required'}]);
    });
    
    hideTimeBtn.addEventListener('click', () => {
        RDC.hide(time);
        RDC.show(showTimeBtn);
        RDC.hide(hideTimeBtn);
        RDC.clear(appointmentTime);
        schedValidation.removeField(appointmentTime);
    });
    
    // Signature uploader
    FilePond.registerPlugin(
        FilePondPluginFileValidateType,
        FilePondPluginFileValidateSize,
        FilePondPluginImageExifOrientation,
        FilePondPluginImagePreview,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
        FilePondPluginImageTransform,
        FilePondPluginImageEdit,
        FilePondPluginFileRename,
        FilePondPluginFileEncode
    );
    
    const uploader = RDC.getById('signature-uploader');
    const uploadUrl = Flask.url_for('dashboard.upload_signature', {id: patientId});
    FilePond.create(uploader, {
        labelIdle: `Drag & Drop any picture or <span class="filepond--label-action">Browse</span>`,
        styleLoadIndicatorPosition: 'left bottom',
        styleProgressIndicatorPosition: 'right bottom',
        styleButtonRemoveItemPosition: 'left bottom',
        styleButtonProcessItemPosition: 'right bottom',
        acceptedFileTypes: ['image/png', 'image/jpeg'],
        maxFileSize: '5MB',
        name: 'signature_image',
        server: {
            url: uploadUrl,
            revert: null
        },
        onprocessfile: (error, file) => {
            if (!error) {
                RDC.refresh(2000);
                RDC.notify('Success', 'Signature uploaded.', RDC.status.success);
            }
        }
    });
    
    // Edit button click
    RDC.getByClassA('edit-button').forEach(button => {
        button.addEventListener('click', () => {
            const parent = button.closest('.profile-field');
            const textContainer = RDC.getBySelector('span', parent);
            const initialValue = RDC.getText(textContainer);
            const fieldInput = RDC.getByClass('profile-field-input', parent);
            
            // Exception for datepicker
            if (!RDC.hasClass(fieldInput, 'flatpickr')) {
                const value = (initialValue === 'Unspecified') ? '' : initialValue;
                
                if (fieldInput.type === 'checkbox')
                    fieldInput.checked = ('Yes' === RDC.getText(textContainer));
                else
                    RDC.setValue(fieldInput, value);
                    
                fieldInput.setAttribute('data-initial-value', initialValue);
            }
            
            RDC.hide(textContainer);
            RDC.show(fieldInput);
            RDC.show(RDC.getByClass('done-button', parent));
            RDC.hide(button);
        });
    });
    
    const asBool = value => {
        return ('Yes' === value) ? 1 : 0;
    }
    
    RDC.getByClassA('done-button').forEach(button => {
        button.addEventListener('click', async() => {
            const parent = button.closest('.profile-field');
            const textContainer = RDC.getBySelector('span', parent);
            const initialValue = RDC.getText(textContainer);
            const fieldInput = RDC.getByClass('profile-field-input', parent);
            const url = Flask.url_for('dashboard.edit_field');
            const birthdate = fieldInput.getAttribute('data-true-value');
            let fieldValue = RDC.getValue(fieldInput);
            let isValid = false;
            
            // Birthdate exception
            if (birthdate)
                fieldValue = birthdate;
                
            // Checkbox exception
            if (fieldInput.type === 'checkbox')
                fieldValue = fieldInput.checked ? 1 : 0;
                
            // Validate
            if (fieldValue !== fieldInput.getAttribute('data-initial-value'))
                isValid = true;
                
            if (fieldValue !== asBool(initialValue))
                isValid = true;
            
            if (isValid) {
                const result = await RDC.sendJsonData(url, {
                    patient_id: patientId,
                    field_name: fieldInput.getAttribute('name'),
                    field_value: fieldValue
                });
                
                if (result.success) {
                    RDC.notify('Success', result.message, RDC.status.success);
                    if (birthdate)
                        RDC.setText(textContainer, RDC.getValue(fieldInput));
                    else if (fieldInput.type === 'checkbox')
                        RDC.setText(textContainer, fieldValue ? 'Yes' : 'No');
                    else
                        RDC.setText(textContainer, fieldValue || 'Unspecified');
                    RDC.refresh(1000);
                } else {
                    RDC.notify('Error', result.message, RDC.status.danger);
                }
            }
            
            RDC.hide(button);
            RDC.show(textContainer);
            RDC.hide(fieldInput);
            RDC.show(RDC.getByClass('edit-button', parent));
        });
    });
})();