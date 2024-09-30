(() => {
    const LEGAL_AGE = 18;
    
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
    const pond = FilePond.create(uploader, {
        labelIdle: `Drag & Drop any picture or <span class="filepond--label-action">Browse</span>`,
        styleLoadIndicatorPosition: 'left bottom',
        styleProgressIndicatorPosition: 'right bottom',
        styleButtonRemoveItemPosition: 'left bottom',
        styleButtonProcessItemPosition: 'right bottom',
        acceptedFileTypes: ['image/png', 'image/jpeg'],
        process: null,
        maxFileSize: '5MB'
    });

    const validation = new JustValidate(
        RDC.getById('patient-form'), 
        {
            errorFieldCssClass: 'is-invalid',
            validateBeforeSubmitting: true,
            focusInvalidField: true,
            lockForm: true
        }
    );
    
    validation
        .addField('#first_name', [{ rule: 'required' }])
        .addField('#last_name', [{ rule: 'required' }])
        .onSuccess(async() => {
            const form = RDC.getById('patient-form');
            const spinner = RDC.getByClass('spinner-wrapper');
            const url = Flask.url_for('dashboard.process_add');
            const data = new FormData(form);
            const signatureFile = pond.getFile(0);
            
            if (signatureFile) {
                data.append('signature', signatureFile.getFileEncodeDataURL());
            }
            
            // Birthdate exception
            const birthdate = RDC.getById('birthdate').getAttribute('data-true-value');
            
            if (birthdate) {
                data.set('birthdate', birthdate);
            } else {
                data.delete('birthdate');
            }
            
            RDC.show(spinner);

            const result = await RDC.sendJsonData(url, data);
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);

                if (result.redirect)
                    RDC.redirect(result.redirect, 2000);
            } else {
                RDC.notify('Process error', result.message, RDC.status.danger);
                RDC.hide(spinner);
            }
        });
    
    flatpickr('#birthdate', {
        onChange: (selectedDates, dateStr, instance) => {
            const el = instance.element;
            
            el.setAttribute('data-true-value', dateStr);
            RDC.setValue(el, RDC.formatDate(dateStr));

            const minors = RDC.getByClassA('for-minors');
            const age = moment().diff(dateStr, 'years', false);
            
            if (age < LEGAL_AGE) {
                minors.map(RDC.show);
            } else {
                minors.map(RDC.hide);
            }
        }
    });
})();