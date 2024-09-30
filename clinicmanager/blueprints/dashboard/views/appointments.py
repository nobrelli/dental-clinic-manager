from .. import bp
from flask_login import login_required
from flask import render_template, request
from ..models import Patient, Appointment
from ..helpers import sendJSONMessage
from ..forms import PatientForm

__all__ = [
    'view_appointments',
    'make_appointment',
    'delete_appointment',
    'mark_appointment_as_done',
    'mark_appointment_as_undone',
    'update_appointment'
]


@bp.route('/patient/<string:id>/appointments', strict_slashes=False)
@login_required
def view_appointments(id):
    data = dict(
        title='Appointments',
        patient=Patient.get(id),
        appointments=Appointment.get(id)
    )
    
    return render_template('appointments.html', **data)


@bp.post('/appointments/new')
def make_appointment():
    data = request.json
    
    if data.get('patient_type') == 'existing':
        data['unique_id'] = data.get('patient_id')
    elif data.get('patient_type') == 'new':
        form = PatientForm(data=data)
        data['unique_id'] = Patient.create(form)[2]
        
    if Appointment.check_overlap(data.get('appointment_date'), data.get('appointment_time')):
        return sendJSONMessage('A patient is already appointed on this schedule.', False)
    
    if Appointment.create(data):
        return sendJSONMessage('Appointment scheduled.')

    return sendJSONMessage('Could not make an appointment.', False)


@bp.post('/appointments/reschedule')
def update_appointment():
    data = request.json
    
    if Appointment.check_overlap(data.get('appointment_date'), data.get('appointment_time')):
        return sendJSONMessage('A patient is already appointed on this schedule.', False)
    
    if Appointment.update(data):
        return sendJSONMessage('Appointment rescheduled.')

    return sendJSONMessage('Could not reschedule this appointment.', False)


@bp.post('/appointment/delete')
def delete_appointment():
    if Appointment.delete(request.json.get('id')):
        return sendJSONMessage('Appointment canceled.')

    return sendJSONMessage('Could not cancel the appointment.', False)


@bp.post('/appointment/done')
def mark_appointment_as_done():
    if Appointment.mark_done(request.json.get('id')):
        return sendJSONMessage('Marked as done.')

    return sendJSONMessage('Could not mark.', False)


@bp.post('/appointment/undone')
def mark_appointment_as_undone():
    if Appointment.mark_undone(request.json.get('id')):
        return sendJSONMessage('Unmarked as done.')

    return sendJSONMessage('Could not unmark.', False)