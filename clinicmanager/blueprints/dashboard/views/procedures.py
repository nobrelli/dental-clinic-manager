from flask import request, render_template
from flask_login import login_required

from .. import bp
from ..forms import ProcedureForm
from ..helpers import sendJSONMessage
from ..models import Procedure

__all__ = [
    'add_procedure',
    'edit_procedure',
    'view_procedures',
    'delete_procedure',
    'search_procedures'
]


#####################################################################################
@bp.post('/procedures/new')
def add_procedure():
    if Procedure.create(request.json):
        return sendJSONMessage('Item added.')

    return sendJSONMessage('Could not add.', False)


#####################################################################################
@bp.post('/procedure/edit')
def edit_procedure():
    data = request.json

    if Procedure.update(data.get('id'), data):
        return sendJSONMessage('Item edited. Reloading...')

    return sendJSONMessage('Could not edit.', False)


#####################################################################################
@bp.route('/procedures')
@login_required
def view_procedures():
    data = dict(
        title='Procedures',
        procedures=Procedure.query.order_by(Procedure.name.asc()),
        form=ProcedureForm()
    )

    return render_template('procedures.html', **data)


#####################################################################################
@bp.post('/procedure/delete')
def delete_procedure():
    if Procedure.delete(request.json.get('id')):
        return sendJSONMessage('Deleted. Reloading...')

    return sendJSONMessage('Could not delete', False)


#####################################################################################
@bp.get('/procedures/search')
def search_procedures():
    query = request.args.get('query')

    if query:
        data = Procedure.serialize_query(Procedure.search(query))
        return sendJSONMessage('', True, data)

    return sendJSONMessage('', True, {})