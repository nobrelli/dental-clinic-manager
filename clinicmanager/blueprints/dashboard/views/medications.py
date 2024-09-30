from .. import bp
from ..models import Patient, Medication, Prescription
from ..helpers import sendJSONMessage, strtobool
from ..forms import MedicineForm
from flask_login import login_required
from flask import request, render_template

__all__ = [
    'add_medication',
    'view_medications',
    'edit_medication',
    'delete_medication'
]


#####################################################################################
@bp.post('/medications/new')
def add_medication():
    if Medication.create(request.json):
        return sendJSONMessage('Medication added.')

    return sendJSONMessage('Could not add the medication.', False)


#####################################################################################
@bp.route('/medications')
@login_required
def view_medications():
    data = dict(
        title='Meds',
        medicine_form=MedicineForm(),
        medications=Medication.read()
    )

    return render_template('medications.html', **data)


#####################################################################################
@bp.post('/medication/edit')
def edit_medication():
    data = request.json

    if Medication.update(data.get('id'), data):
        return sendJSONMessage('Data edited. Reloading...')

    return sendJSONMessage('Could not edit.', False)


#####################################################################################
@bp.post('/medication/delete')
def delete_medication():
    if Medication.delete(request.json.get('id')):
        return sendJSONMessage('Deleted. Reloading...')

    return sendJSONMessage('Could not delete', False)
