(() => {
    'use strict';

    const logout = RDC.getById('logout');
    
    logout.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        logout.parentNode.submit();
    });

    /* FOR SIGNATURE */
    /*const canvas = el('signature-pad');
    const signaturePad = new SignaturePad(canvas, { backgroundColor: '#ffffff00' });
    const canvasParent = canvas.parentNode;
    const canvasModal = el('canvas');

    function resizeCanvas()
    {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);

		canvas.width = canvasParent.clientWidth * ratio;
		canvas.height = canvasParent.clientHeight * ratio;

        canvas.getContext('2d').scale(ratio, ratio);
        signaturePad.fromData(signaturePad.toData());
		canvas.style.display = 'block';
    }

    window.onresize = resizeCanvas;

    const undoBtn = el('undoSign');
    const clearBtn = el('clearSign');
    const doneBtn = el('doneSign');
    const closeBtn = el('closeSign');
    const signatureVal = el('signature');
    const signatureImage = el('signatureImage');
    const signatureUpload = el('signature_upload');

    window.onload = () =>
    {
		resizeCanvas();
		
        if (signatureVal.value && signatureImage.src)
        {
            signatureImage.src = signatureVal.value;
            signatureImage.style.display = 'block';
            signatureUpload.setAttribute('disabled', true);
        }
    };

    signaturePad.addEventListener('beginStroke', () =>
    {
        undoBtn.removeAttribute('disabled');
        clearBtn.removeAttribute('disabled');
        doneBtn.removeAttribute('disabled');
    });

    undoBtn.addEventListener('click', () =>
    {
        const data = signaturePad.toData();

        if (data)
        {
            data.pop();
            signaturePad.fromData(data);
        }

        if (signaturePad.isEmpty())
        {
            undoBtn.setAttribute('disabled', true);
            clearBtn.setAttribute('disabled', true);
            doneBtn.setAttribute('disabled', true);
        }
    });

    clearBtn.addEventListener('click', () =>
    {
        signaturePad.clear();
        undoBtn.setAttribute('disabled', true);
        clearBtn.setAttribute('disabled', true);
        doneBtn.setAttribute('disabled', true);
    });

    doneBtn.addEventListener('click', () =>
    {
        // Trim the canvas and convert to SVG
 		//const trimmed = trimCanvas(canvas);
		//canvasTrimmed.fromData(signaturePad.toData());
        //const data = canvasTrimmed.toDataURL('image/svg+xml');
		console.log(cropSignatureCanvas(canvas, 'image/svg+xml'));
        //signatureVal.value = data;
        //signatureImage.src = data;
    });

    closeBtn.addEventListener('click', () =>
    {
        if (signaturePad.isEmpty())
        {
            signatureImage.style.display = 'none';
            signatureUpload.removeAttribute('disabled');
        }
    });

    canvasModal.addEventListener('shown.bs.modal', resizeCanvas);
	canvasModal.addEventListener('hidden.bs.modal', () => {
        if (signaturePad.isEmpty())
        {
            signatureImage.style.display = 'none';
            signatureUpload.removeAttribute('disabled');
        }
        else
        {
            signatureImage.style.display = 'block';
            signatureUpload.setAttribute('disabled', true);
        }
	});
	
	canvasModal.addEventListener('hide.bs.modal', () => {
		canvas.style.display = 'none';
	});

    const MAX_UPLOAD_SIZE = 5; // 5 MiB

    signatureUpload.onchange = () =>
    {
        // Validate file size
        const fileSize = signatureUpload.files[0].size / 1024 / 1024;
        if (fileSize > MAX_UPLOAD_SIZE)
        {
            alert('File size exceeded ' + MAX_UPLOAD_SIZE + ' MiB');
            signatureUpload.value = '';
            signatureUpload.classList.remove('is-valid');
            signatureUpload.classList.add('is-invalid');
        }
        else
        {
            signatureUpload.classList.remove('is-invalid');
            signatureUpload.classList.add('is-valid');
        }
    };
    */
})();