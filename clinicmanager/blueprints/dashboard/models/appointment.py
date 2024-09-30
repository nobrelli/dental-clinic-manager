from datetime import datetime, timedelta

from sqlalchemy.types import JSON

from clinicmanager.app import db
from ._base import CustomModel
from sqlalchemy.sql import func

date_now = datetime.now().strftime('%Y-%m-%d')
tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')


class Appointment(db.Model, CustomModel):
    __tablename__ = 'appointments'
    
    id            = db.Column(db.Integer, primary_key=True)
    patient_id    = db.Column(db.String(18), db.ForeignKey('patients.unique_id'))
    created_at    = db.Column(db.DateTime, server_default=func.now())
    updated_at    = db.Column(db.DateTime, onupdate=func.now())
    schedule_date = db.Column(db.Date)
    schedule_time = db.Column(db.Time, nullable=True)
    remarks       = db.Column(db.Text)
    done          = db.Column(db.Boolean, default=False)
    
    @staticmethod
    def get(id):
        return Appointment.query.filter_by(patient_id=id).order_by(Appointment.schedule_date.desc())
    
    @staticmethod
    def get_today_count():
        return Appointment.query.filter_by(schedule_date=date_now, done=False).count()
    
    @staticmethod
    def get_tomorrow_count():
        return Appointment.query.filter_by(schedule_date=tomorrow, done=False).count()
    
    @staticmethod
    def get_list_today():
        from ..models import Patient
        priority = Appointment.query.join(Patient)\
            .with_entities(
                Appointment.schedule_date, 
                Appointment.schedule_time,
                Appointment.remarks,
                Patient.full_name,
                Patient.address,
                Patient.unique_id
            )\
            .filter_by(schedule_date=date_now, done=False)\
            .order_by(Appointment.schedule_time.asc())
        
        if priority:
            return priority
        
        return None
    
    @staticmethod
    def get_list_tomorrow():
        from ..models import Patient
        priority = Appointment.query.join(Patient)\
            .with_entities(
                Appointment.schedule_date, 
                Appointment.schedule_time,
                Appointment.remarks,
                Patient.full_name,
                Patient.address,
                Patient.unique_id
            )\
            .filter_by(schedule_date=tomorrow, done=False)\
            .order_by(Appointment.schedule_time.asc())
        
        if priority:
            return priority
        
        return None
    
    @staticmethod
    def get_list_all():
        from ..models import Patient
        priority = Appointment.query.join(Patient)\
            .with_entities(
                Appointment.id,
                Appointment.schedule_date, 
                Appointment.schedule_time,
                Appointment.remarks,
                Patient.full_name,
                Patient.address,
                Patient.unique_id
            )\
            .filter_by(done=False)\
            .order_by(Appointment.schedule_time.asc())
        
        if priority:
            return priority
        
        return None
    
    @staticmethod
    def create(fields: dict):
        data = dict(
            patient_id=fields['unique_id'],
            schedule_date=Appointment._convert_date(fields['appointment_date']),
            remarks=fields['remarks']
        )
        
        if fields['appointment_time']:
            data['schedule_time'] = Appointment._convert_time(fields['appointment_time'])
        
        db.session.add(Appointment(**data))
        
        return Appointment._commit()
    
    @staticmethod
    def update(fields: dict):
        data = dict(
            schedule_date=Appointment._convert_date(fields['appointment_date']),
            remarks=fields['remarks']
        )
        
        if fields['appointment_time']:
            data['schedule_time'] = Appointment._convert_time(fields['appointment_time'])
        else:
            data['schedule_time'] = None
        
        Appointment.query.filter_by(id=fields['id']).update(data)
        
        return Appointment._commit()
    
    @staticmethod
    def mark_done(id):
        Appointment.query.filter_by(id=id).update(dict(done=True))
        return Appointment._commit()
    
    @staticmethod
    def mark_undone(id):
        Appointment.query.filter_by(id=id).update(dict(done=False))
        return Appointment._commit()
    
    @staticmethod
    def check_overlap(date, time=None):
        date = Appointment._convert_date(date)
        
        if time:
            time = Appointment._convert_time(time)
            return Appointment.query.filter_by(schedule_date=date, schedule_time=time).count() > 0
        
        return False
    
    @staticmethod
    def delete(id):
        db.session.delete(Appointment.query.get(id))
        return Appointment._commit()
    
    def _convert_date(date):
        return datetime.strptime(date, '%m-%d-%Y').date()
    
    def _convert_time(time):
        return datetime.strptime(time, '%I:%M %p').time()