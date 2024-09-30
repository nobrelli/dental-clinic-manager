(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader', 
        { 
            fps: 60, 
            qrbox: 250, 
            facingMode: 'environment',
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        }
    );
    const scanAgain = RDC.getById('qr-scan-again');
    const recordLink = RDC.getById('record-link');
    const status = RDC.getById('qr-reader-status');
    
    scanAgain.addEventListener('click', () => {
        html5QrcodeScanner.resume();
        RDC.hide(scanAgain);
        RDC.hide(recordLink);
        RDC.hide(status);
    });
    
    const onScanSuccess = async(decodedText, decodedResult) => {
        // Search for the ID
        const spinner = RDC.getBySelector('#qr-scanner .spinner-wrapper');
        const url = Flask.url_for('dashboard.search_bill');
        
        html5QrcodeScanner.pause(true);
        RDC.show(spinner);
        
        const result = await RDC.sendJsonData(url, {guid: decodedText});

        if (result.success) {
            RDC.setText(recordLink, 'Click here to view.');
            recordLink.href = Flask.url_for('dashboard.view_accounts', {
                id: result.data.patient_id
            }) + '?account=' + decodedText;
            RDC.show(recordLink);
            RDC.setText(status, 'Record found.');
            RDC.switchClass(status, 'text-danger', 'text-success');
        } else {
            RDC.hide(recordLink);
            RDC.setText(status, 'Record not found.');
            RDC.switchClass(status, 'text-success', 'text-danger');
        }
        
        RDC.show(status);
        scanAgain.style.display = 'inline-block';
        RDC.hide(spinner);
    }
    
    html5QrcodeScanner.render(onScanSuccess);
})();