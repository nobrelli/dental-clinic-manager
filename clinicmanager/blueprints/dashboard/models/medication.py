from datetime import datetime

from clinicmanager.app import db
from ._base import CustomModel
from sqlalchemy.sql import func


class Medication(db.Model, CustomModel):
    __tablename__ = 'medications'
    
    id            = db.Column(db.Integer, primary_key=True)
    added_at      = db.Column(db.DateTime, server_default=func.now())
    updated_at    = db.Column(db.DateTime, onupdate=func.now())
    drug          = db.Column(db.String(80))
    type          = db.Column(db.String(10))
    dose          = db.Column(db.Integer)
    unit          = db.Column(db.Integer)
    volume        = db.Column(db.Integer)
    
    @staticmethod
    def get(id):
        return Medication.query.get(id)
        
    @staticmethod
    def get_count():
        return Medication.query.count()
        
    @staticmethod                     
    def read(sort='asc'):
        order = [
            Medication.drug.asc() if sort == 'asc' else Medication.drug.desc(),
            Medication.dose.asc() if sort == 'asc' else Medication.dose.desc()
        ]
    
        return Medication.query.order_by(*order)
    
    @staticmethod
    def read_with_pagination(sort='asc', current_page=1, max_items_per_page=1):
        data = Medication.read(sort)
        return data.paginate(page=current_page, per_page=max_items_per_page)
        
    @staticmethod
    def create(fields: dict):
        data = Medication._populate(fields)
        db.session.add(Medication(**data))

        return Medication._commit()
        
    @staticmethod
    def delete(id):
        db.session.delete(Medication.get(id))
        return Medication._commit()
        
    @staticmethod
    def update(id, fields: dict):
        data = Medication._populate(fields)
        Medication.query.filter_by(id=id).update(data)
        
        return Medication._commit()
        
    @staticmethod
    def _populate(fields: dict):
        return dict(
            drug   = fields['drug'],
            type   = fields['type'],
            dose   = fields['dose'],
            unit   = fields['unit'],
            volume = fields['volume']
        )