(() => {
    const selectedAppointment = RDC.getById('selected-appointment');
    
    RDC.getByClassA('appointment').forEach(item => {
        item.addEventListener('click', () => {
            RDC.setValue(selectedAppointment, 
                RDC.getText(RDC.getByClass('appointment-id', item)));
        });
        
        const date = RDC.getText(RDC.getBySelector('.appointment-date-value span', item));
        const duration = moment.duration({
            from: moment(date),
            to: moment()
        });
        
        if (duration.asDays() >= 1) {
            RDC.setClass(item, 'done');
            
            (async() => {
                const url = Flask.url_for('dashboard.mark_appointment_as_done');
                await RDC.sendJsonData(url, {
                    id: RDC.getText(RDC.getByClass('appointment-id', item))
                });
            })();
        }
            
        if (RDC.hasClass(item, 'done') && duration.asDays() >= 1) {
            RDC.getByClass('dropdown', item).remove();
            RDC.setClass(item, 'completed');
        }
    });
    
    const modal = RDC.getById('cancel-confirm');
    const modalMessage = RDC.getByClass('modal-message', modal);
    const modalNo = RDC.getByClass('modal-no', modal);
    const modalYes = RDC.getByClass('modal-yes', modal);
    
    // cancel
    modal.addEventListener('show.bs.modal', () => {
        RDC.setText(modalMessage, 'Are you sure?');
        RDC.switchClass(modalMessage, 'text-success', 'text-danger');
    });
    
    modalYes.addEventListener('click', async() => {
        RDC.disable(modalNo);
        RDC.disable(modalYes);
        
        const url = Flask.url_for('dashboard.delete_appointment');
        const result = await RDC.sendJsonData(url, {
            id: selectedAppointment.value
        });
        
        if (result.success) {
            RDC.setText(modalMessage, 'Appointment canceled.');
            RDC.switchClass(modalMessage, 'text-danger', 'text-success');
            RDC.refresh(2000);
        } else {
            RDC.setText(modalMessage, 'Could not send the data.');
            RDC.switchClass(modalMessage, 'text-success', 'text-danger');
        }
    });
    
    // mark as done
    const globalSpinner = RDC.getById('global-spinner');
    
    RDC.getByClassA('mark-done').forEach(element => {
        element.addEventListener('click', async(event) => {
            event.preventDefault();
            RDC.show(globalSpinner);
            
            const url = Flask.url_for('dashboard.mark_appointment_as_done');
            const result = await RDC.sendJsonData(url, {
                id: selectedAppointment.value
            });
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                RDC.refresh(1700);
            } else {
                RDC.notify('Failed', result.message, RDC.status.danger);
                RDC.hide(globalSpinner);
            }
        });
    });
    
    // unmark as done
    RDC.getByClassA('unmark-done').forEach(element => {
        element.addEventListener('click', async(event) => {
            event.preventDefault();
            RDC.show(globalSpinner);
            
            const url = Flask.url_for('dashboard.mark_appointment_as_undone');
            const result = await RDC.sendJsonData(url, {
                id: selectedAppointment.value
            });
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                RDC.refresh(1700);
            } else {
                RDC.notify('Failed', result.message, RDC.status.danger);
                RDC.hide(globalSpinner);
            }
        });
    });
    
    // reschedule
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
            const url = Flask.url_for('dashboard.update_appointment');
            const data = new FormData(form);
            const spinner = RDC.getByClass('spinner-wrapper', form);
            
            data.set('appointment_date', appointmentDate.getAttribute('data-true-value'));            
            data.append('id', RDC.getValue(selectedAppointment));
            RDC.show(spinner);
            
            const result = await RDC.sendJsonData(url, data);
            
            if (result.success) {
                RDC.notify('Success', result.message, RDC.status.success);
                RDC.refresh(1500);
            } else {
                RDC.notify('Process error', result.message, RDC.status.danger);
                RDC.hide(spinner);
            }
        });
        
    flatpickr('#appointment-date', {
        dateFormat: 'm-d-Y',
        minDate: 'today',
        onChange: (selectedDates, dateStr, instance) => {
            const el = instance.element;
            el.setAttribute('data-true-value', dateStr);
            RDC.setValue(el, RDC.formatDate(dateStr));
        }
    });
    
    flatpickr('#appointment-time', {
        enableTime: true,
        noCalendar: true,
        dateFormat: 'h:i K',
        minTime: '09:00',
        maxTime: '17:00'
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
    
    const schedulerModal = RDC.getById('scheduler-modal');
    
    schedulerModal.addEventListener('show.bs.modal', () => {
        RDC.setText(RDC.getByClass('scheduler-heading', schedulerModal), 'Reschedule appointment');
    });
    
    RDC.getByClassA('edit-appointment-trigger').forEach(item => {
        item.addEventListener('click', () => {
            RDC.enable(saveBtn);
            
            const date = RDC.getBySelector('.appointment-date-value span', item.closest('tr'));
            const time = RDC.getBySelector('.appointment-time-value span', item.closest('tr'));
            const remarks = RDC.getBySelector('.remarks', item.closest('tr'));
            const trueDate = RDC.getBySelector('.appointment-date-value', 
                item.closest('tr')).getAttribute('data-true-value');

            RDC.setValue(RDC.getById('appointment-date'), RDC.getText(date));
            RDC.getById('appointment-date')
                .setAttribute('data-true-value', moment(trueDate).format('MM-DD-YYYY'));
            
            if (time) {
                RDC.setValue(appointmentTime, RDC.getText(time));
                RDC.trigger(showTimeBtn, 'click');
            }
                
            RDC.setValue(RDC.getById('remarks'), RDC.getValue(remarks));
        });
    });
})();