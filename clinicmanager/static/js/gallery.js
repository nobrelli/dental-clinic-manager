(async() => {
    // Masonry
    const gallery = RDC.getById('gallery');
    const msnry = new Masonry(gallery, {
        itemSelector: '.gallery-image',
        columnWidth: '.gallery-sizer',
        percentPosition: true
    });
    
    imagesLoaded(gallery).on('progress', () => {
        msnry.layout();
    });
    
    flatpickr('[name=date_taken]', {
        onChange: (selectedDates, dateStr, instance) => {
            const el = instance.element;
            
            el.setAttribute('data-true-value', dateStr);
            RDC.setValue(el, RDC.formatDate(dateStr));
        }
    });
    
    FilePond.registerPlugin(
        FilePondPluginFileValidateType,
        FilePondPluginFileValidateSize,
        FilePondPluginImageExifOrientation,
        FilePondPluginImagePreview,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
        FilePondPluginImageTransform,
        FilePondPluginImageEdit,
        FilePondPluginFileRename
    );

    // Select the file input and use 
    // create() to turn it into a pond
    const uploadButton = RDC.getById('upload-button');
    const patientId = sessionStorage.getItem('patient_unique_id');
    const url = Flask.url_for('dashboard.gallery_upload', {id: patientId});
    const fileIds = await RDC.getJsonData(url + '?action=loadall');
    const files = [];
    
    fileIds.data.forEach(id => {
        files.push({
            source: id,
            options: {type: 'limbo'}
        });
    });
    
    FilePond.create(RDC.getById('gallery-uploader'), {
        labelIdle: `Drag & Drop any picture or <span class="filepond--label-action">Browse</span>`,
        styleLoadIndicatorPosition: 'left bottom',
        styleProgressIndicatorPosition: 'right bottom',
        styleButtonRemoveItemPosition: 'left bottom',
        styleButtonProcessItemPosition: 'right bottom',
        imagePreviewHeight: 150,
        acceptedFileTypes: ['image/png', 'image/jpeg'],
        server: url,
        files: files,
        forceRevert: true,
        maxFileSize: '15MB',
        onprocessfile: files => {
            RDC.enable(uploadButton);
        },
        onremovefile: () => {
            RDC.disable(uploadButton);
        }
        // fileRenameFunction: file =>
        //     new Promise((resolve) => {
        //         resolve(window.prompt('Rename this file', filenameWithoutExtension) + file.extension);
        //     }),
        // onactivatefile: file => {
            
        // }
    });
    
    const spinner = RDC.getByClass('spinner-wrapper');
    
    uploadButton.onclick = async() => {
        
        RDC.show(spinner);
        
        const url = Flask.url_for('dashboard.gallery_save', {id: patientId});
        const data = new FormData();
        
        data.append('date_taken', RDC.getBySelector('[name=date_taken]').getAttribute('data-true-value'));
        data.append('category', RDC.getBySelector('[name=category]').value);
        data.append('description', RDC.getBySelector('[name=description]').value);
        
        const result = await RDC.sendJsonData(url, data);
        
        if (result.success) {
            RDC.notify('Success', result.message, RDC.status.success);
            RDC.refresh(2000);
        } else {
            RDC.notify('Failed', result.message, RDC.status.danger);
            RDC.hide(spinner);
        }
    };

    const toDelete = RDC.getById('image-to-delete');
    const deleteBtn = RDC.getById('confirm-delete');
    const modalInstance = new BSN.Modal(RDC.getById('delete-confirm'));
    let clicked = null;
    
    RDC.getByClassA('gallery-image').forEach(item => {
        item.onclick = () => {
            const image = RDC.getBySelector('img', item);
            RDC.setValue(toDelete, image.getAttribute('data-filename'));
            clicked = item;
        };
    });
    
    deleteBtn.onclick = async() => {
        RDC.show(spinner);
        
        const url = Flask.url_for('dashboard.delete_image', {
            id: patientId
        });
        const result = await RDC.sendJsonData(url, {
            filename: RDC.getValue(toDelete)
        }, 'delete');
        
        if (result.success) {
            RDC.notify('Success', result.message, RDC.status.success);
            new Promise(resolve => {
                clicked.remove();
                modalInstance.hide();
                modalInstance.addEventListener('hidden.bs.modal', resolve(true));
                
                return resolve(false);
            }).then(() => {
                msnry.layout();
            });
        } else {
            RDC.notify('Failed', result.message, RDC.status.danger);
        }
        
        RDC.hide(spinner);
    };
    
    RDC.getBySelectorA('.gallery-image img').forEach(image => {
        image.addEventListener('click', async() => {
            const data = {
                id: patientId,
                filename: image.getAttribute('data-filename')
            };
            
            RDC.getById('gallery-image-preview').src = Flask.url_for('dashboard.view_image', data);
            const url = Flask.url_for('dashboard.view_image_details', data);
            const result = await RDC.getJsonData(url);
            
            if (result.success) {
                RDC.setText(RDC.getById('date-taken-preview'), RDC.formatDate(result.data.date_taken));
                RDC.setText(RDC.getById('category-preview'), result.data.category);
                RDC.setText(RDC.getById('description-preview'), result.data.description);
            }
        });
    });
})();