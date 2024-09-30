from datetime import datetime

from clinicmanager.app import db
from ._base import CustomModel
from sqlalchemy.sql import func


class Gallery(db.Model, CustomModel):
    __tablename__ = 'gallery'
    
    id            = db.Column(db.Integer, primary_key=True)
    patient_id    = db.Column(db.String(18), db.ForeignKey('patients.unique_id'))
    added_at      = db.Column(db.DateTime, server_default=func.now())
    updated_at    = db.Column(db.DateTime, onupdate=func.now())
    description   = db.Column(db.Text)
    date_taken    = db.Column(db.Date)
    category      = db.Column(db.String(20))
    filename      = db.Column(db.Text)

    @staticmethod
    def create(patient_id, file, data):
        to_store = dict(
            patient_id=patient_id,
            filename=file,
            description=data.get('description'),
            category=data.get('category')
        )

        if data.get('date-taken'):
            to_store['date_taken'] = datetime.strptime(data.get('date_taken'), '%Y-%m-%d')

        db.session.add(Gallery(**to_store))

        return Gallery._commit()
    
    @staticmethod
    def read_all(id):
        return Gallery.query.filter_by(patient_id=id).order_by(Gallery.added_at.desc()).all()
    
    @staticmethod
    def read(id, filename):
        return Gallery.query.filter_by(patient_id=id, filename=filename).first()

    @staticmethod
    def delete(id, filename):
        db.session.delete(Gallery.query.filter_by(patient_id=id, filename=filename).first())

        return Gallery._commit()