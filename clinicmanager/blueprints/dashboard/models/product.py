from datetime import datetime

from clinicmanager.app import db
from ._base import CustomModel
from sqlalchemy.sql import func


class Product(db.Model, CustomModel):
    __tablename__ = 'products'
    
    id            = db.Column(db.Integer, primary_key=True)
    added_at      = db.Column(db.DateTime, server_default=func.now())
    updated_at    = db.Column(db.DateTime, onupdate=func.now())
    name          = db.Column(db.String(100))
    details       = db.Column(db.Text)
    price         = db.Column(db.Float(2))

    @staticmethod
    def create(fields: dict):
        data = Product(**Product._populate(fields))
        db.session.add(data)

        return Product._commit()

    @staticmethod
    def update(id, fields: dict):
        data = Product._populate(fields)
        Product.query.filter_by(id=id).update(data)

        return Product._commit()

    @staticmethod
    def delete(id):
        db.session.delete(Product.query.get(id))

        return Product._commit()

    @staticmethod
    def _populate(fields: dict):
        return dict(
            name=fields['name'],
            details=fields['details'],
            price=fields['price']
        )