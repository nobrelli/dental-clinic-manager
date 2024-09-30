from flask import render_template, request
from flask_login import login_required

from .. import bp
from ..forms import ProductForm
from ..models import Product
from ..helpers import sendJSONMessage

__all__ = [
    'add_product',
    'edit_product',
    'view_products',
    'delete_product'
]


#####################################################################################
@bp.post('/products/new')
def add_product():
    if Product.create(request.json):
        return sendJSONMessage('Item added.')

    return sendJSONMessage('Could not add.', False)


#####################################################################################
@bp.post('/products/edit')
def edit_product():
    data = request.json

    if Product.update(data.get('id'), data):
        return sendJSONMessage('Item edited. Reloading...')

    return sendJSONMessage('Could not edit.', False)


#####################################################################################
@bp.route('/products')
@login_required
def view_products():
    data = dict(
        title='Product catalog',
        products=Product.query.order_by(Product.name.asc()),
        form=ProductForm()
    )

    return render_template('products.html', **data)


#####################################################################################
@bp.post('/products/delete')
def delete_product():
    if Product.delete(request.json.get('id')):
        return sendJSONMessage('Deleted. Reloading...')

    return sendJSONMessage('Could not delete', False)