from flask import (
    render_template, flash, request, make_response,
    redirect, url_for, current_app, send_file
)
from flask_login import login_required

from .. import bp
from ..forms import PatientForm
from ..helpers import process_signature, sendJSONMessage, get_ext, trim_image
from ..models import Patient, Medication, Product, Gallery
from time import sleep
import json, os, uuid, shutil, http

__all__ = [
    'add_patient',
    'edit_patient',
    'view_patient',
    'view_patients',
    'delete_patient',
    'search_patients',
    'process_add',
    'get_signature',
    'view_gallery',
    'gallery_upload',
    'gallery_save',
    'view_image',
    'edit_field',
    'upload_signature',
    'view_chart'
]


# Some basic CRUD operations going
#####################################################################################
@bp.route('/patients/new')
@login_required
def add_patient():
    form = PatientForm()

    data = dict(
        title='New Patient Record',
        form=form,
        edit_mode=False
    )

    return render_template('add_edit_patient.html', **data)


@bp.route('/patient/<string:id>/chart')
def view_chart(id):
    patient = Patient.get(id)

    data = dict(
        title='Dental Chart',
        patient=patient,
    )

    return render_template('teeth.html', **data)


#####################################################################################
@bp.post('/patient/new/process')
def process_add():
    data = request.json
    form = PatientForm(data=data)
    
    if form.validate_on_submit():
        new_patient = Patient.create(form)

        if new_patient[0]:
            if data.get('signature_upload'):
                process_signature(data.get('signature_upload'), new_patient[1], new_patient[2])
                
            return sendJSONMessage('New patient added.', 
                                   redirect=url_for('dashboard.view_patient', id=new_patient[2]))
    else:
        return sendJSONMessage(form.errors, False)
    
    return sendJSONMessage('Could not process the form.', False)


#####################################################################################
@bp.route('/patient/<string:id>/view')
@login_required
def view_patient(id):
    patient = Patient.get(id)
    title = 'No record'
    deleted = False

    if not patient:
        deleted = True
    else:
        title = f'Record for {patient.first_name} {patient.last_name}'

    data = dict(
        title=title,
        patient=patient,
        medications=Medication.read(),
        products=Product.query.all(),
        deleted=deleted,
        form=PatientForm()
    )

    return render_template('view_patient.html', **data)


#####################################################################################
@bp.route('/patient/<string:id>/edit')
@login_required
def edit_patient(id):
    patient = Patient.get(id)

    data = dict(
        title='Edit Patient Record',
        id=id,
        patient=patient,
        form=PatientForm(obj=patient),
        edit_mode=True
    )

    return render_template('add_edit_patient.html', **data)


#####################################################################################
@bp.post('/patient/edit_field')
def edit_field():
    data = request.json
    
    if Patient.update_field(
        data.get('patient_id'),
        data.get('field_name'),
        data.get('field_value')):
        return sendJSONMessage('Field edited.')

    return sendJSONMessage('Failed to edit.', False)


#####################################################################################
@bp.post('/patient/edit/process')
def process_edit():
    data = request.json
    
    if 'diseases' in data:
        data['diseases'] = json.loads(data.get('diseases'))

    form = PatientForm(data=data)
    id = data.get('unique_id')
    
    if form.validate_on_submit():
        newPatient = Patient.update(id, form)

        if newPatient[0]:
            if data.get('signature_upload'):
                process_signature(data.get('signature_upload'), newPatient[1], id)
                
            return sendJSONMessage('The record was successfully updated.', 
                                   redirect=url_for('dashboard.view_patient', id=id))
    else:
        return sendJSONMessage(form.errors, False)
    
    return sendJSONMessage('Failed to update record.', False)


#####################################################################################
@bp.post('/patient/delete')
def delete_patient():
    data = request.json

    if Patient.delete(data.get('unique_id')):
        return sendJSONMessage('This record was successfully deleted. Redirecting...', True,
            redirect=url_for('dashboard.view_patients')
        )

    return sendJSONMessage('Could not delete.', False)


#####################################################################################
@bp.get('/patients')
@login_required
def view_patients():
    records = None
    query = request.args.get('search')

    if query:
        records = Patient.search_with_pagination(query, 'desc',
                                                 int(request.args.get('page') or 1),
                                                 current_app.config['PATIENTS_PER_PAGE'])
    else:
        records = Patient.read_with_pagination('desc',
                                               int(request.args.get('page') or 1),
                                               current_app.config['PATIENTS_PER_PAGE'])

    data = dict(
        title='Patients',
        records=records,
        search=query or ''
    )

    return render_template('view_patients.html', **data)


#####################################################################################
@bp.get('/patients/search')
def search_patients():
    query = request.args.get('query')
    rows = Patient.search_with_pagination(query, 'desc',
                                          int(request.args.get('page') or 1),
                                          current_app.config['PATIENTS_PER_PAGE'])
    data = {}
    patient_url = 'dashboard.view_patients'

    if rows:
        serialized = Patient.serialize_query(rows)

        # Append the links
        for item in serialized:
            item['link'] = url_for('dashboard.view_patient', id=item['unique_id'])
            del item['id']

        pages = [url_for(patient_url, page=row, search=query) for row in rows.iter_pages()]

        data = {
            'current': rows.page,
            'per_page': rows.per_page,
            'total': rows.total,
            'has_prev': rows.has_prev,
            'has_next': rows.has_next,
            'prev_link': url_for(patient_url, page=rows.prev_num, search=query) if rows.has_prev else '',
            'next_link': url_for(patient_url, page=rows.next_num, search=query) if rows.has_next else '',
            'pages': pages,
            'items': serialized
        }

    return data


#####################################################################################
@bp.route('/patients/<string:patient_id>/signatures/<string:id>')
def get_signature(patient_id, id):
    signature = os.path.join(current_app.config.get('CATALOG_FOLDER'), patient_id, id + '.svg')
    return send_file(signature, 'image/svg+xml')


#####################################################################################
@bp.route('/patient/<string:id>/gallery')
@login_required
def view_gallery(id):    
    data = dict(
        title='Gallery',
        patient=Patient.get(id),
        images=Gallery.read_all(id)
    )
    
    # Clean temp folder first
    # temp = current_app.config.get('TEMP_FOLDER')
    # for filename in os.listdir(temp):
    #     file_dir = os.path.join(temp, filename)
        
    #     if os.path.isdir(file_dir):
    #         shutil.rmtree(file_dir)
    
    return render_template('gallery.html', **data)


#####################################################################################
@bp.get('/patient/<string:id>/gallery/view')
def view_image(id):
    image = Gallery.read(id, request.args.get('filename'))
    path = os.path.join(current_app.config.get('CATALOG_FOLDER'), id, 'gallery', image.filename)
    return send_file(path)


@bp.get('/patient/<string:id>/gallery/view/details')
def view_image_details(id):
    data = Gallery.read(id, request.args.get('filename'))
    return sendJSONMessage(data={
        'description': data.description,
        'date_taken': data.added_at,
        'category': data.category
    })


#####################################################################################
@bp.route('/patient/<string:id>/gallery/upload', methods=['POST', 'DELETE', 'GET'])
def gallery_upload(id):
    temp = current_app.config.get('TEMP_FOLDER')
    
    match request.method:
        case 'POST':
            file = request.files['gallery-uploader']
            loc_id = str(uuid.uuid4())
            
            # create the folder
            dest = os.path.join(temp, id, loc_id)
            os.makedirs(dest)
    
            file.save(os.path.join(dest, file.filename))
            
            response = make_response(loc_id, 200)
            response.mimetype = 'text/plain'
            
            return response
        
        case 'DELETE':
            shutil.rmtree(os.path.join(temp, id, request.get_data(as_text=True)))
            return '', http.HTTPStatus.NO_CONTENT

        case _:
            query = request.args
            patient_upload = os.path.join(temp, id)
            files = os.listdir(patient_upload) if os.path.exists(patient_upload) else []
            
            if query.get('action') == 'loadall':
                return sendJSONMessage(data=files)

            elif query.get('restore'):
                for file_dir in files:
                    if file_dir == query.get('restore'):
                        file_dir_path = os.path.join(patient_upload, file_dir)
                        actual_image = os.listdir(file_dir_path)[0]
                        
                        return send_file(os.path.join(file_dir_path, actual_image))
        
    return '', http.HTTPStatus.NO_CONTENT


@bp.post('/patient/<string:id>/gallery/upload/save')
def gallery_save(id):
    data = request.json
    temp = current_app.config.get('TEMP_FOLDER')
    patient_upload = os.path.join(temp, id)
    uploads = os.path.join(current_app.config.get('CATALOG_FOLDER'), id, 'gallery')
    files = os.listdir(patient_upload) if os.path.exists(patient_upload) else []
    success = False
    
    if not os.path.exists(uploads):
        os.makedirs(uploads)
    
    # Move everything inside the temp folder into the patient's gallery folder
    for file_dir in files:
        file_dir_path = os.path.join(patient_upload, file_dir)
        actual_image = os.listdir(file_dir_path)[0]
        ext = get_ext(actual_image)
        renamed = os.path.join(file_dir_path, file_dir + ext)
        
        # Rename the file with its unique id
        os.renames(os.path.join(file_dir_path, actual_image), renamed)
        
        # Move the file
        shutil.move(renamed, uploads)
        
        # Record the filenames into database
        success = Gallery.create(id, file_dir + ext, data)
            
    if success:
        # Remove the temp folder of this patient
        shutil.rmtree(patient_upload)
        
        return sendJSONMessage('File uploaded. Reloading...')
    
    return sendJSONMessage('Upload failed.', False)


@bp.delete('/patient/<string:id>/gallery/delete')
def delete_image(id):
    filename = request.json.get('filename')
    
    if Gallery.delete(id, filename):
        os.remove(os.path.join(current_app.config.get('CATALOG_FOLDER'), id, 'gallery', filename))
        return sendJSONMessage('Picture deleted.')
    
    return sendJSONMessage('Delete failed.', False)


@bp.post('/patient/<string:id>/upload_signature')
def upload_signature(id):
    file = request.files['signature_image']
    new_filename = Patient.update_signature(id)
    source = os.path.join(current_app.config.get('CATALOG_FOLDER'), id, file.filename)
    dest = os.path.join(current_app.config.get('CATALOG_FOLDER'), id, new_filename + '.svg')
    file.save(source)
    trim_image(source, dest)
    os.remove(source)
    return '', http.HTTPStatus.NO_CONTENT