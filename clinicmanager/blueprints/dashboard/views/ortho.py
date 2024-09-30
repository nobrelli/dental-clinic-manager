from flask import request, render_template, send_file, current_app, url_for

from .. import bp
from ..helpers import sendJSONMessage
from ..models import Account, Patient, Ortho
from ..forms import OrthoForm, PatientForm
from flask_login import login_required
from time import sleep
import os

__all__ = [
    'view_ortho',
    'new_ortho',
    'fill_new_ortho',
    'edit_ortho_field',
    'patient_search_general'
]


@bp.route('/patient/<string:id>/ortho')
def view_ortho(id):
    ortho = Ortho.query.filter_by(patient_id=id).first()
    
    data = dict(
        title='Orthodontic',
        ortho=ortho,
        patient=Patient.get(id),
        form=OrthoForm()
    )
    return render_template('view_ortho.html', **data)


@bp.post('/patient/ortho/edit')
def edit_ortho_field():
    data = request.json
    
    if Ortho.update_field(
        data.get('patient_id'),
        data.get('field_name'),
        data.get('field_value')):
        return sendJSONMessage('Field edited.')

    return sendJSONMessage('Failed to edit.', False)


@bp.route('/ortho/new')
def new_ortho():
    data = dict(
        title='New Ortho Patient'
    )
    return render_template('new_ortho.html', **data)


@bp.route('/ortho/new/fillup', methods=['GET', 'POST'])
def fill_new_ortho():
    if request.method == 'POST':
        data = request.json
        
        if 'first_name' in data.keys() or 'last_name' in data.keys():
            form = PatientForm(data=data)
            result = Patient.create(form)
            
            if result[0]:
                return sendJSONMessage(
                    data={'patient_id': result[2]}, 
                    redirect=url_for('dashboard.fill_new_ortho'))

            return sendJSONMessage(success=False)
        
        if Ortho.create(data):
            return sendJSONMessage('Details saved.', redirect=url_for('dashboard.view_ortho', 
                                                                      id=data.get('patient_id')))

        return sendJSONMessage('Could not save the information.', False)
    
    data = dict(
        title='Ortho Patient Details',
        form=OrthoForm()
    )
    return render_template('ortho_full.html', **data)


@bp.route('/ortho/new/search')
def patient_search():
    query = request.args.get('query')
    rows = Patient.search(query, set_limit=True, filter_ortho=True)
    results = Patient.serialize_query(rows)
    
    return sendJSONMessage(data=[
            {
                'full_name': result.get('full_name'),
                'unique_id': result.get('unique_id') 
            } 
            for result in results
        ]
    )
    
    
@bp.route('/ortho/new/search')
def patient_search_general():
    query = request.args.get('query')
    rows = Patient.search(query, set_limit=True)
    results = Patient.serialize_query(rows)
    
    return sendJSONMessage(data=[
            {
                'full_name': result.get('full_name'),
                'unique_id': result.get('unique_id') 
            } 
            for result in results
        ]
    )