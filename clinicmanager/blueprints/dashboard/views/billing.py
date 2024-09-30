from flask import request, render_template, send_file, current_app

from .. import bp
from ..helpers import sendJSONMessage
from ..models import Account, Patient
from flask_login import login_required
from time import sleep
import os

__all__ = [
    'create_bill',
    'view_accounts',
    'view_account',
    'update_bill',
    'view_payments',
    'get_qr',
    'search_bill',
    'delete_bill'
]


@bp.post('/patient/bill')
def create_bill():
    if Account.create(request.json):
        return sendJSONMessage('Item added.')

    return sendJSONMessage('Could not add.', False)


@bp.post('/patient/bill/delete')
def delete_bill():
    if Account.delete(request.json):
        return sendJSONMessage('Bill deleted. Reloading...')

    return sendJSONMessage('Could not delete.', False)


@bp.route('/patient/<string:id>/accounts')
@login_required
def view_accounts(id):
    data = dict(
        title='Accounts',
        accounts=Account.read_all(id),
        patient=Patient.get(id),
        grand_total_pay=Account.get_grand_total_payment(id),
        total_balance=Account.get_total_balance(id)
    )

    return render_template('accounts.html', **data)


@bp.get('/billing/view')
def view_account():
    query = request.args
    data = Account.read(query.get('guid'))
    total_pay = Account.get_total_payment(query.get('guid'))

    return sendJSONMessage(data={
        'fullname': Patient.get(query.get('patient_id')).full_name,
        'create_date': data.created_at,
        'procedures': data.procedures,
        'items': data.products,
        'subtotal': data.subtotal,
        'discount': data.discount,
        'due': data.due,
        'balance': data.balance,
        'total_pay': total_pay,
        'status': data.status
    })


@bp.get('/patients/accounts/<string:guid>/payments/view')
def view_payments(guid):
    return sendJSONMessage(data=Account.read(guid).payments)


@bp.post('/patients/accounts/update')
def update_bill():
    if Account.update(request.json):
        return sendJSONMessage('Payment settled. Reloading...')

    return sendJSONMessage('Could not settle the payment.', False)


@bp.post('/accounts/search')
def search_bill():
    search = Account.search(request.json.get('guid'))
    
    if search:
        return sendJSONMessage(data={
            'patient_id': search.patient_id
        })

    return sendJSONMessage('There are no matching results.', False)


@bp.get('/patients/<string:patient_id>/qrs/<string:id>')
def get_qr(patient_id, id):
    qr = os.path.join(current_app.config.get('CATALOG_FOLDER'), patient_id, 'qrs', id + '.png')
    return send_file(qr, 'image/png')