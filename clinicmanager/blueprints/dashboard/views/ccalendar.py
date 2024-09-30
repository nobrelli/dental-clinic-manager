from flask import render_template
from flask_login import login_required

from .. import bp
from ..models import Appointment

__all__ = [
    'view_calendar',
    'get_events'
]


@bp.route('/calendar')
@login_required
def view_calendar():
    data = dict(
        title='Calendar'
    )
    
    return render_template('calendar.html', **data)


@bp.route('/calendar/load')
def get_events():
    return [
        {
            'url': '#',
            'title': event.full_name,
            'start': event.schedule_date.strftime('%Y-%m-%d'),
            'extendedProps': {
                'startTime': event.schedule_time.strftime('%H:%M') if event.schedule_time else '',
                'remarks': event.remarks or '-',
                'id': event.id,
                'patient_id': event.unique_id
            }
        }
        
        for event in Appointment.get_list_all()
    ]