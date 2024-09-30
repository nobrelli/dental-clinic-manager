(() => {
    'use strict';

    let selectedGuid = new URLSearchParams(window.location.search).get('account');
    let currentBalance;
    
    const modal = RDC.getById('account-modal');
    const modalInstance = new BSN.Modal(modal);
    
    if (selectedGuid) {
        modalInstance.show();
    }
    
    modal.addEventListener('shown.bs.modal', () => {
        const spinner = RDC.getByClass('spinner-wrapper', modal);

        RDC.show(spinner);

        // Set the URL with the selected GUID
        const url = Flask.url_for('dashboard.view_account', {
            patient_id: RDC.getValue(RDC.getById('patient-id')),
            guid:  selectedGuid
        });
        
        // Query data
        (async() => {
            const result = await RDC.getJsonData(url);
            const list = RDC.getById('items-list');
            
            // Clear the table first
            list.replaceChildren();
            RDC.hide(spinner);
            
            if (result.success) {
                const data = result.data;
                
                currentBalance = data.balance;
                
                // Fill in the bill info
                RDC.setText(RDC.getById('statement-for'), data.fullname);
                RDC.setText(RDC.getById('account-id'), selectedGuid);
                RDC.setText(RDC.getById('account-create-date'), RDC.formatDateTime(data.create_date));
                
                // List out all procedures
                data.procedures.forEach(procedure => {
                    const row = RDC.makeElement('tr');
                    
                    row.insertAdjacentHTML('beforeend', `<td>${procedure.name}</td>`);
                    row.insertAdjacentHTML('beforeend', `<td>-</td>`);
                    row.insertAdjacentHTML('beforeend', 
                        `<td class="text-end">${RDC.formatCurrency(procedure.price)}</td>`);
                    list.appendChild(row);
                });
                
                // Items
                data.items.forEach(item => {
                    const row = RDC.makeElement('tr');
                    
                    row.insertAdjacentHTML('beforeend', `<td>${item.name}</td>`);
                    row.insertAdjacentHTML('beforeend', `<td>x ${item.quantity}</td>`);
                    row.insertAdjacentHTML('beforeend', 
                        `<td class="text-end">${RDC.formatCurrency(item.price)}</td>`);
                    list.appendChild(row);
                });
                
                // Subtotal
                RDC.setText(RDC.getById('bill-subtotal'), RDC.formatCurrency(data.subtotal));
                // Discount
                RDC.setText(RDC.getById('bill-discount'), RDC.formatCurrency(data.discount));
                // Total Due
                RDC.setText(RDC.getById('bill-due'), RDC.formatCurrency(data.due));
                // Total Payment
                RDC.setText(RDC.getById('bill-payment'), RDC.formatCurrency(data.total_pay));
                // Balance
                RDC.setText(RDC.getById('bill-balance'), RDC.formatCurrency(data.balance));
                // QR
                RDC.getById('bill-qr').src = Flask.url_for('dashboard.get_qr', {
                    patient_id: RDC.getValue(RDC.getById('patient-id')),
                    id: selectedGuid
                });
                
                if (data.status === 'Pending')
                    RDC.showI(RDC.getById('settle-btn'));
                else
                    RDC.hide(RDC.getById('settle-btn'));
            }
        })();
    });

    RDC.getByClassA('account').forEach(account => {
        account.addEventListener('click', () => {
            selectedGuid = RDC.getValue(RDC.getByClass('account-guid', account));
            modalInstance.show();
        });
    });

    const settleForm = RDC.getById('settle-form');
    const payment = RDC.getById('payment-field');
    const paymentMode = RDC.getById('mop-field');
    const balance = RDC.getById('balance-field');
    const change = RDC.getById('change-field');
    const settleModal = RDC.getById('settle-modal');
    
    // Validate settlement form
    const validation = new JustValidate(settleForm, {
        errorFieldCssClass: 'is-invalid',
        validateBeforeSubmitting: true,
        focusInvalidField: true
    });

    validation
        .addField(payment, [
            { rule: 'required' }
        ])
        .addField(paymentMode, [
            { rule: 'required' }
        ])
        .onSuccess(async() => {
            const spinner = RDC.getByClass('spinner-wrapper', settleModal);
            
            RDC.show(spinner);
            
            const data = {
                guid: selectedGuid,
                mop: RDC.getValue(paymentMode),
                payment: RDC.getFValue(payment),
                new_balance: RDC.getFValue(balance),
                old_balance: currentBalance
            };
            const url = Flask.url_for('dashboard.update_bill');
            const result = await sendJsonData(url, data);
            
            if (result.success) {
                const url = Flask.url_for('dashboard.view_accounts', {
                    id: RDC.getValue(RDC.getById('patient-id'))
                });
                RDC.notify('Success', result.message, 'success');
                RDC.redirect(url, 1500);
            } else {
                RDC.notify('Process error', result.message, 'danger');
                RDC.hide(spinner);
            }
        });

    RDC.formatAsMoney(payment);
    RDC.formatAsMoney(change);
    RDC.formatAsMoney(balance);

    payment.addEventListener('change', () => {
        const value = RDC.toFloat(payment.value);
        
        if (value > currentBalance) {
            RDC.setValue(change, value - currentBalance);
            RDC.resetF(balance);
        } else {
            RDC.resetF(change);
            RDC.setValue(balance, currentBalance - value);
        }
        
        RDC.trigger(change, 'change');
        RDC.trigger(balance, 'change');
    });
    
    RDC.getById('settle-btn').addEventListener('click', () => {
        RDC.resetF(payment);
        RDC.resetF(change);
        RDC.reset(paymentMode);
        RDC.setValue(balance, RDC.formatCurrency(currentBalance, false));
    });

    RDC.getById('confirm-btn').addEventListener('click', () => {
        RDC.trigger(settleForm, 'submit');
    });

    // Payment history
    const paymentsModal = RDC.getById('payments-modal');
    const paymentsList = RDC.getById('payments-list');

    RDC.getById('payment-history-btn').addEventListener('click', () => {
        const spinner = RDC.getByClass('spinner-wrapper', paymentsModal);
        const url = Flask.url_for('dashboard.view_payments', { guid: selectedGuid });
        
        RDC.show(spinner);
        paymentsList.replaceChildren();
        
        (async() => {
            const result = await RDC.getJsonData(url);

            if (result.success) {
                result.data.forEach(data => {
                    const row = RDC.makeElement('tr');
                    
                    row.insertAdjacentHTML('beforeend', `<td>${data.timestamp}</td>`);
                    row.insertAdjacentHTML('beforeend', `<td>${data.mop}</td>`);
                    row.insertAdjacentHTML('beforeend', 
                        `<td class="text-end">${RDC.formatCurrency(data.amount)}</td>`);
                    paymentsList.appendChild(row);
                });
            } else {
                RDC.notify('Retrieve error', result.message, 'danger');
            }
            
            RDC.hide(spinner);
        })();
    });
    
    RDC.getById('print-btn').addEventListener('click', () => {
        print();
    });
    
    RDC.getById('delete-btn').addEventListener('click', () => {
        const spinner = RDC.getById('main-spinner');
        const url = Flask.url_for('dashboard.delete_bill');
        
        RDC.show(spinner);
        
        (async() => {
            const result = await RDC.sendJsonData(url, { guid: selectedGuid });

            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                RDC.refresh(1500);
            } else {
                RDC.notify('Retrieve error', result.message, RDC.status.danger);
                RDC.hide(spinner);
            }
        })();
    });
})();