from flask import Blueprint

bp = Blueprint('admin', __name__, template_folder='templates')


@bp.after_request
def after_request(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


from ..admin import views, forms, models
