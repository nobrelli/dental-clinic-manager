(() => {
    const validation = new JustValidate('#signin-form', {
        errorFieldCssClass: 'is-invalid',
        validateBeforeSubmitting: true,
        focusInvalidField: true,
        lockForm: true
    });
    
    validation
        .addField('#username', [
            { 
                rule: 'required' 
            }
        ])
        .addField('#password', [
            { 
                rule: 'required' 
            }
        ])
        .onSuccess(async() => {
            const form = RDC.getById('signin-form');
            const spinner = RDC.getByClass('spinner-wrapper', form);
            const loginUrl = Flask.url_for('admin.check_login');
            const next = window.location.search;
            const redirectUrl = next ? decodeURIComponent(next.replace('?next=', ''))
                                : Flask.url_for('dashboard.index');
            
            RDC.show(spinner);
            RDC.hideFormMessage(form);
            
            const result = await RDC.sendJsonData(loginUrl, new FormData(form));
            
            if (result.success) {
                RDC.showFormMessage(form, result.message, RDC.status.success);
                RDC.redirect(redirectUrl, 2000);
            } else {
                RDC.hide(spinner);
                RDC.showFormMessage(form, result.message, RDC.status.danger);
                RDC.clear(RDC.getById('password'));
            }
        });
})();