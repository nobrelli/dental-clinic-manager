from flask import Blueprint

bp = Blueprint('dashboard', __name__, template_folder='templates')

@bp.after_request
def after_request(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

from ..dashboard import views, forms, models
