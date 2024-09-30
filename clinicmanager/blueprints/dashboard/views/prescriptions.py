import base64, os

from flask import request, render_template, current_app, send_file, url_for
from flask_login import login_required

from .. import bp
from ..helpers import sendJSONMessage, strtobool, make_prescription
from ..models import Patient, Prescription, Medication

__all__ = [
    'add_prescription',
    'view_prescriptions',
    'delete_prescription',
    'get_prescription_image'
]


#####################################################################################
@bp.post('/patient/prescriptions/new')
def add_prescription():
    data = request.json
    data['prn'] = [strtobool(p) for p in data.get('prn')]
    result = Prescription.create(data)

    if result[0]:
        image = make_prescription(
            Patient.get(data.get('unique_id')), 
            data, Medication.query, result[1]
        )
        return sendJSONMessage('Prescription added.')

    return sendJSONMessage('Could not add prescription.', False)
    
    
#####################################################################################
@bp.route('/patient/<string:patient_id>/prescriptions/<string:id>')
def get_prescription_image(patient_id, id):
    dir = current_app.config.get('CATALOG_FOLDER')
    filename = Prescription.query.filter_by(image=id).first().image
    return send_file(os.path.join(dir, patient_id, 'prescriptions', filename + '.jpg'))


#####################################################################################
@bp.route('/patient/<string:id>/prescriptions')
@login_required
def view_prescriptions(id):
    data = dict(
        title='Prescriptions',
        patient=Patient.get(id),
        prescriptions=Prescription.query.filter_by(patient_id=id)
        .order_by(Prescription.prescribed_at.desc())
    )

    return render_template('prescriptions.html', **data)


#####################################################################################
@bp.post('/patients/prescriptions/delete')
def delete_prescription():
    if Prescription.delete(request.json.get('prescription_id')):
        return sendJSONMessage('Prescription deleted. Reloading...')

    return sendJSONMessage('Could not delete.', False)
