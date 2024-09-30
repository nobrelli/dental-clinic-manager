const Ortho = {
    create: () => {
        const searchInput = RDC.getById('patient-finder');
        const searchResults = RDC.getById('search-results');
        const url = Flask.url_for('dashboard.patient_search');
        const newPatientFields = RDC.getBySelectorA('#first-name, #last-name, #middle-initial');
        const createButton = RDC.getById('addnew');
        
        const autocomplete = async(event) => {
            const currentValue = searchInput.value;
            
            Array.from(newPatientFields).map(RDC.clear);
            RDC.hide(searchResults);

            if (currentValue) {
                const response = await fetch(url + '?query=' + currentValue, {
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
                                RDC.setValue(searchInput, data.full_name);
                                RDC.hide(searchResults);
                                sessionStorage.setItem('new_ortho_patient_id', data.unique_id);
                                RDC.redirect(Flask.url_for('dashboard.fill_new_ortho'));
                            });

                            item.appendChild(suggestion);
                            searchResults.appendChild(item);
                        });

                        RDC.show(searchResults);
                    }
                }
            }
        }
        
        searchInput.addEventListener('input', autocomplete);
        
        // Focusing on these fields would mean the intention of adding a patient
        newPatientFields.forEach(field => {
            field.addEventListener('change', () => {
                RDC.clear(searchInput);
                RDC.hide(searchResults);
                
                if (field.value === '')
                    RDC.disable(createButton);
                else
                    RDC.enable(createButton);
            });
        });
        
        const spinner = RDC.getByClass('spinner-wrapper');
        createButton.onclick = async() => {
            RDC.show(spinner);
            const result = await RDC.sendJsonData(
                Flask.url_for('dashboard.fill_new_ortho'),
                {
                    first_name: RDC.getById('first-name').value,
                    last_name: RDC.getById('last-name').value,
                    middle_initial: RDC.getById('middle-initial').value
                }
            );
            
            if (result.success) {
                sessionStorage.setItem('new_ortho_patient_id', result.data.patient_id);
                RDC.notify('Success', 'Redirecting...', RDC.status.success);
                RDC.redirect(result.redirect);
            } else {
                RDC.notify('Error', 'Error occurred.', RDC.status.danger);
                RDC.hide(spinner);
            }
        };
    },
    fillup: () => {
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
        const labelIdle = `Drag & Drop any picture or <span class="filepond--label-action">Browse</span>`;
        const acceptedFileTypes = ['image/png', 'image/jpeg']

        FilePond.create(RDC.getById('patient-signature'), {
            labelIdle: labelIdle,
            acceptedFileTypes: acceptedFileTypes,
            process: null,
            maxFileSize: '5MB'
        });
        
        FilePond.create(RDC.getById('parent-signature'), {
            labelIdle: labelIdle,
            acceptedFileTypes: acceptedFileTypes,
            process: null,
            maxFileSize: '5MB'
        });

        const fillUpForm = RDC.getById('ortho-form');
        const validation = new JustValidate(fillUpForm, 
            {
                errorFieldCssClass: 'is-invalid',
                validateBeforeSubmitting: true,
                focusInvalidField: true,
                lockForm: true
            }
        );
        
        const url = Flask.url_for('dashboard.fill_new_ortho');
        
        validation.onSuccess(async() => {
            const data = new FormData(fillUpForm);
            const spinner = RDC.getByClass('spinner-wrapper');
            data.append('patient_id', sessionStorage.getItem('new_ortho_patient_id'));
            RDC.show(spinner);
            const result = await RDC.sendJsonData(url, data);
            
            if (result.success) {
                sessionStorage.removeItem('new_ortho_patient_id');
                RDC.notify('Success', result.message, RDC.status.success);
                RDC.redirect(result.redirect);
            } else {
                RDC.notify('Failed', result.message, RDC.status.danger);
                RDC.hide(spinner);
            }
        });
    },
    view: () => {
        const patientId = sessionStorage.getItem('patient_unique_id');
        
        // Edit button click
        RDC.getByClassA('edit-button').forEach(button => {
            button.addEventListener('click', () => {
                const parent = button.closest('.profile-field');
                const textContainer = RDC.getBySelector('span', parent);
                const initialValue = RDC.getText(textContainer);
                const fieldInput = RDC.getByClass('profile-field-input', parent);

                const value = (initialValue === 'Unspecified') ? '' : initialValue;
                RDC.setValue(fieldInput, value);
                    
                fieldInput.setAttribute('data-initial-value', initialValue);
                
                RDC.hide(textContainer);
                RDC.show(fieldInput);
                RDC.show(RDC.getByClass('done-button', parent));
                RDC.hide(button);
            });
        });
        
        RDC.getByClassA('done-button').forEach(button => {
            button.addEventListener('click', async() => {
                const parent = button.closest('.profile-field');
                const textContainer = RDC.getBySelector('span', parent);
                const fieldInput = RDC.getByClass('profile-field-input', parent);
                const url = Flask.url_for('dashboard.edit_ortho_field');
                let fieldValue = RDC.getValue(fieldInput);
                
                if (fieldValue !== fieldInput.getAttribute('data-initial-value') && fieldValue !== '-') {
                    const result = await RDC.sendJsonData(url, {
                        patient_id: patientId,
                        field_name: fieldInput.getAttribute('name'),
                        field_value: fieldValue
                    });
                    
                    if (result.success) {
                        RDC.notify('Success', result.message, RDC.status.success);
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
    }
}