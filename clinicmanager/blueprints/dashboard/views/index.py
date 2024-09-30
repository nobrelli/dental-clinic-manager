from flask import render_template
from flask_login import login_required

from .. import bp
from ..models import (
    Patient, 
    Medication, 
    Appointment, 
    Product,
)


@bp.route('/')
@login_required
def index():
    patient_count = Patient.get_count()
    meds_count = Medication.get_count()

    data = dict(
        title='Dashboard',
        appointments_today_count=Appointment.get_today_count(),
        appointments_tomorrow_count=Appointment.get_tomorrow_count(),
        appointment_list_today=Appointment.get_list_today(),
        appointment_list_tomorrow=Appointment.get_list_tomorrow(),
        patient_count=patient_count,
        medicine_count=meds_count,
        product_count=Product.query.count(),
        last_insert=None
    )
    
    if patient_count:
        data['last_insert'] = Patient.get_last_insert_time()
    
    return render_template('index.html', **data)