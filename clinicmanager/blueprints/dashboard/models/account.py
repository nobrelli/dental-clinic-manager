from datetime import datetime

from sqlalchemy.types import JSON

from clinicmanager.app import db
from ._base import CustomModel
from sqlalchemy.sql import func
import uuid, qrcode, os


class Account(db.Model, CustomModel):
    __tablename__ = 'accounts'
    
    id            = db.Column(db.Integer, primary_key=True)
    patient_id    = db.Column(db.Integer, db.ForeignKey('patients.unique_id'))
    guid          = db.Column(db.Text)
    created_at    = db.Column(db.DateTime, server_default=func.now())
    updated_at    = db.Column(db.DateTime, onupdate=func.now())
    procedures    = db.Column(JSON)
    products      = db.Column(JSON)
    subtotal      = db.Column(db.Float(2))
    due           = db.Column(db.Float(2))
    discount      = db.Column(db.Float(2))
    balance       = db.Column(db.Float(2))
    payments      = db.Column(JSON)
    status        = db.Column(db.String(10))

    @staticmethod
    def read(guid):
        return Account.query.filter_by(guid=guid).first()

    @staticmethod
    def read_all(id):
        data = Account.query.filter_by(patient_id=id).order_by(Account.created_at.desc()).all()

        for item in data:
            item.total_pay = sum([payment['amount'] for payment in item.payments])

        return data

    @staticmethod
    def create(fields: dict):
        # Generate GUID
        guid = str(uuid.uuid4())
        timestamp = None
        
        if fields['type'] == 'existing':
            timestamp = datetime.strptime(fields['timestamp'], '%m-%d-%Y %I:%M %p')
        else:
            timestamp = datetime.now()
        
        payments = [
            {
                'timestamp': timestamp.strftime('%b %d, %Y %I:%M %p'),
                'mop': fields['mop'],
                'amount': fields['payment'] if fields['payment'] < fields['due'] else fields['due']
            }
        ]

        data = Account(
            patient_id=fields['unique_id'],
            procedures=fields['procedures'],
            products=fields['products'],
            subtotal=fields['subtotal'],
            discount=fields['discount'],
            payments=payments,
            status=fields['status'],
            due=fields['due'],
            balance=fields['balance'],
            guid=guid
        )
        db.session.add(data)

        result = Account._commit()
        
        if result:
            from flask import current_app
            # Make QR code
            qr = qrcode.QRCode(version=1, box_size=10)
            qr.add_data(guid)
            qr.make(fit=True)
            img = qr.make_image()
            dir = os.path.join(current_app.config.get('CATALOG_FOLDER'), data.patient_id, 'qrs')
            
            if not os.path.exists(dir):
                os.makedirs(dir)
            
            img.save(os.path.join(dir, guid + '.png'))
            
        return result

    @staticmethod
    def update(fields):
        bill = Account.query.filter_by(guid=fields['guid'])
        payments = bill.first().payments # make a copy
        payments.append({
            'timestamp': datetime.now().strftime('%b %d, %Y %I:%M %p'),
            'mop': fields['mop'],
            'amount': fields['payment'] 
                    if fields['payment'] < fields['old_balance'] 
                    else fields['old_balance']
        })
        bill.update(dict(
            payments=payments,
            balance=fields['new_balance'],
            status='Pending' if fields['new_balance'] > 0 else 'Cleared'
        ))

        return Account._commit()
    
    @staticmethod
    def delete(fields: dict):
        account = Account.query.filter_by(guid=fields.get('guid')).first()
        db.session.delete(account)
        return Account._commit()
    
    @staticmethod
    def search(id):
        return Account.query.filter_by(guid=id).first()

    @staticmethod
    def get_total_payment(guid):
        return sum([payment['amount'] for payment in Account.read(guid).payments])
    
    @staticmethod
    def get_grand_total_payment(id):
        return sum([Account.get_total_payment(account.guid) 
                    for account in Account.query.filter_by(patient_id=id)])
    
    @staticmethod
    def get_total_balance(id):
        return sum([account.balance for account in Account.query.filter_by(patient_id=id)])