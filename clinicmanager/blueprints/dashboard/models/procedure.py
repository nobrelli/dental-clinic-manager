from datetime import datetime

from clinicmanager.app import db
from ._base import CustomModel
from sqlalchemy import or_
from sqlalchemy.sql import func


class Procedure(db.Model, CustomModel):
    __tablename__ = 'procedures'
    
    id            = db.Column(db.Integer, primary_key=True)
    added_at      = db.Column(db.DateTime, server_default=func.now())
    updated_at    = db.Column(db.DateTime, onupdate=func.now())
    name          = db.Column(db.Text)
    details       = db.Column(db.Text)
    price         = db.Column(db.Float(2))

    @staticmethod
    def search(query):
        query = f'%{query}%'

        return Procedure.query.with_entities(
            Procedure.name,
            Procedure.price
        ).filter(or_(
            Procedure.name.ilike(query),
            Procedure.details.ilike(query)
        ))

    @staticmethod
    def create(fields: dict):
        data = Procedure(**Procedure._populate(fields))
        db.session.add(data)

        return Procedure._commit()

    @staticmethod
    def update(id, fields: dict):
        data = Procedure._populate(fields)
        Procedure.query.filter_by(id=id).update(data)

        return Procedure._commit()

    @staticmethod
    def delete(id):
        db.session.delete(Procedure.query.get(id))

        return Procedure._commit()

    @staticmethod
    def _populate(fields: dict):
        return dict(
            name=fields['name'],
            details=fields['details'],
            price=fields['price']
        )