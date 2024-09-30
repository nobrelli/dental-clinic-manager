from datetime import datetime

from sqlalchemy.types import JSON

from clinicmanager.app import db
from ._base import CustomModel
import uuid
from sqlalchemy.sql import func


class Prescription(db.Model, CustomModel):
    __tablename__ = 'prescriptions'
    
    id            = db.Column(db.Integer, primary_key=True)
    patient_id    = db.Column(db.String(18), db.ForeignKey('patients.unique_id'))
    prescribed_at = db.Column(db.DateTime, server_default=func.now())
    medicine_ids  = db.Column(JSON)
    disp          = db.Column(JSON)
    dosage        = db.Column(JSON)
    amount        = db.Column(JSON)
    hours         = db.Column(JSON)
    days          = db.Column(JSON)
    prn           = db.Column(JSON)
    image         = db.Column(db.Text)
    
    @staticmethod
    def get(id):
        return Prescription.query.get(id)
        
    @staticmethod
    def get_count():
        return Prescription.query.count()
        
    @staticmethod                     
    def read(sort='asc'):
        order = [
            Prescription.drug.asc() if sort == 'asc' else Prescription.drug.desc(),
            Prescription.dose.asc() if sort == 'asc' else Prescription.dose.desc()
        ]
    
        return Prescription.query.order_by(*order)
    
    @staticmethod
    def read_with_pagination(sort='asc', current_page=1, max_items_per_page=1):
        data = Prescription.read(sort)
        return data.paginate(page=current_page, per_page=max_items_per_page)
    
    @staticmethod
    def create(fields: dict):
        image = str(uuid.uuid4())
        data = dict(
            patient_id=fields['unique_id'],
            medicine_ids=fields['medications'],
            disp=fields['disp'],
            dosage=fields['dosage'],
            amount=fields['amount'],
            hours=fields['hours'],
            days=fields['days'],
            prn=fields['prn'],
            image=image
        )

        db.session.add(Prescription(**data))
        
        return (Prescription._commit(), image)
        
    @staticmethod
    def delete(id):
        db.session.delete(Prescription.query.filter_by(image=id).first())
        return Prescription._commit()