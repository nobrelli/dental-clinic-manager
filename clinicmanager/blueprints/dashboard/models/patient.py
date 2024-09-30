from datetime import datetime

from sqlalchemy import or_, text
from sqlalchemy.types import JSON
from flask import current_app
from clinicmanager.app import db
from ._base import CustomModel
from ..helpers import calculate_age
from sqlalchemy.sql import func
import shortuuid
import uuid
import os
import shutil


class Patient(db.Model, CustomModel):
    __tablename__      = 'patients'
    
    id                 = db.Column(db.Integer, primary_key=True)
    unique_id          = db.Column(db.String(18), unique=True)
    created_at         = db.Column(db.DateTime, server_default=func.now())
    updated_at         = db.Column(db.DateTime, onupdate=func.now())
    patient_type       = db.Column(db.String(10), server_default='regular')
    
    full_name          = db.Column(db.String(200))
    first_name         = db.Column(db.String(80))
    last_name          = db.Column(db.String(80))
    middle_initial     = db.Column(db.String(3))
    suffix             = db.Column(db.String(8))
    birthdate          = db.Column(db.Date)
    sex                = db.Column(db.String(1))
    occupation         = db.Column(db.String(50))
    weight             = db.Column(db.String(7))
    height             = db.Column(db.String(7))
    
    number             = db.Column(db.String(15))
    email              = db.Column(db.String(100))
    address            = db.Column(db.String(200))
    
    father_name        = db.Column(db.String(150))
    father_occupation  = db.Column(db.String(50))
    father_contact     = db.Column(db.String(15))
    mother_name        = db.Column(db.String(150))
    mother_occupation  = db.Column(db.String(50))
    mother_contact     = db.Column(db.String(15))
    
    referrer           = db.Column(db.String(150))
    reason_for_consulation = db.Column(db.String(200))
    
    current_medications = db.Column(db.String(200))
    allergies           = db.Column(db.String(150))
    previous_hospitalization = db.Column(db.String(150))
    abnormalities       = db.Column(db.String(150))
    conditions          = db.Column(JSON)
    
    has_reactions       = db.Column(db.Boolean)
    has_problems        = db.Column(db.Boolean)
    has_family_history  = db.Column(db.Boolean)
    
    blood_type          = db.Column(db.String(3))
    blood_pressure      = db.Column(db.String(10))
    
    notes               = db.Column(db.Text)
    signature           = db.Column(db.Text)
    
    @staticmethod
    def get(id):
        return Patient.query.filter_by(unique_id=id).first()
    
    @staticmethod
    def get_count():
        return Patient.query.count()
        
    @staticmethod
    def get_last_insert_time():
        return Patient.query.with_entities(Patient.created_at)\
                            .order_by(Patient.created_at.desc())\
                            .first()[0]
       
    @staticmethod                     
    def read(sort='asc'):
        order = Patient.created_at.asc() if sort == 'asc' \
                else Patient.created_at.desc()

        return Patient.query.order_by(order)
    
    @staticmethod
    def read_with_pagination(sort='asc', current_page=1, max_items_per_page=1):
        data = Patient.read(sort)
        return data.paginate(page=current_page, per_page=max_items_per_page, error_out=False)
        
    @staticmethod
    def search(query, sort='asc', set_limit=False, filter_ortho=False):
        limit = 10
        query = f'%{query}%'
        order = Patient.created_at.asc() if sort == 'asc' \
                else Patient.created_at.desc()

        data = Patient.query.with_entities(
            Patient.id,
            Patient.unique_id,
            Patient.last_name,
            Patient.first_name,
            Patient.middle_initial,
            Patient.suffix,
            Patient.created_at,
            Patient.updated_at,
            Patient.birthdate,
            Patient.address,
            Patient.full_name
        ).order_by(order).filter(or_(
            Patient.full_name.ilike(query),
            Patient.address.ilike(query)
        ))
        
        if filter_ortho:
            data = data.filter_by(patient_type='regular')
        
        if set_limit:
            return data.limit(limit)
        
        return data

    @staticmethod
    def search_with_pagination(query, sort='asc', current_page=1, max_items_per_page=1):
        data = Patient.search(query, sort)
        return data.paginate(page=current_page, per_page=max_items_per_page, error_out=False)
        
    @staticmethod
    def create(fields: dict):
        signature_filename = ''
        populated = Patient._populate(fields)
        populated['unique_id'] = shortuuid.ShortUUID().random(length=18)
        
        # create a dedicated folder for the patient
        catalog = os.path.join(current_app.config.get('CATALOG_FOLDER'), populated['unique_id'])
        
        if not os.path.exists(catalog):
            os.makedirs(catalog)
        
        if fields.signature.data:
            populated['signature'] = str(uuid.uuid4())
            signature_filename = populated['signature']

        db.session.add(Patient(**populated))
        
        return (Patient._commit(), signature_filename, populated['unique_id'])
        
    @staticmethod
    def update(id, fields: dict):
        signature_filename = ''
        populated = Patient._populate(fields)
        
        if fields.signature:
            to_remove = os.path.join(current_app.config.get('CATALOG_FOLDER'), id, id + '.svg')
            
            if os.path.exists(to_remove):
                os.remove(to_remove)
            
            populated['signature'] = str(uuid.uuid4())
            signature_filename = populated['signature']
            
        Patient.query.filter_by(unique_id=id).update(populated)
        
        return (Patient._commit(), signature_filename)
    
    @staticmethod
    def update_field(id, field_name, field_value):
        patient = Patient.get(id)
        
        if field_name == 'birthdate':
            field_value = datetime.strptime(field_value, '%Y-%m-%d')

        setattr(patient, field_name, field_value)
        
        return Patient._commit()
    
    @staticmethod
    def update_signature(id):
        patient = Patient.get(id)
        
        if patient.signature:
            to_remove = os.path.join(current_app.config.get('CATALOG_FOLDER'), 
                                    id, patient.signature + '.svg')
            
            if os.path.exists(to_remove):
                os.remove(to_remove)
                
        new_filename = str(uuid.uuid4())
        patient.signature = new_filename
        Patient._commit()
        
        return new_filename
        
    @staticmethod
    def delete(id):
        Patient._delete_folder(id)
        db.session.delete(Patient.get(id))
        
        return Patient._commit()

    @staticmethod
    def serialize_query(rows):
        copy = [row._asdict() for row in rows]

        for row in copy:
            if row.get('birthdate'):
                row['age'] = calculate_age(row['birthdate'])
                row['birthdate'] = row['birthdate'].strftime('%b %d, %Y')

        return copy
    
    def _delete_folder(id):
        # remove prescriptions
        shutil.rmtree(os.path.join(current_app.config.get('CATALOG_FOLDER'), id), True)
        
    @staticmethod
    def _populate(fields: dict):
        new_first_name = fields.first_name.data + ' '
        new_mid_ini    = fields.middle_initial.data + ' ' if fields.middle_initial.data else ''
        new_suffix     = ', ' + fields.suffix.data if fields.suffix.data else ''
        full = new_first_name + new_mid_ini + fields.last_name.data + new_suffix

        new_data = dict(
            full_name          = full,
            first_name         = fields.first_name.data,
            last_name          = fields.last_name.data,
            middle_initial     = fields.middle_initial.data,
            suffix             = fields.suffix.data,
            birthdate          = fields.birthdate.data,
            sex                = fields.sex.data,
            occupation         = fields.occupation.data,
            height             = fields.height.data,
            weight             = fields.weight.data,
            
            number             = fields.number.data,
            address            = fields.address.data,
            email              = fields.email.data,
            
            father_name        = fields.father_name.data,
            father_occupation  = fields.father_occupation.data,
            father_contact     = fields.father_contact.data,
            
            mother_name        = fields.mother_name.data,
            mother_occupation  = fields.mother_occupation.data,
            mother_contact     = fields.mother_contact.data,
            
            referrer           = fields.referrer.data,
            reason_for_consulation = fields.reason_for_consulation.data,

            current_medications = fields.current_medications.data,
            allergies           = fields.allergies.data,
            previous_hospitalization = fields.previous_hospitalization.data,
            abnormalities       = fields.abnormalities.data,
            conditions          = fields.conditions.data,
            
            has_reactions          = fields.has_reactions.data,
            has_problems  = fields.has_problems.data,
            has_family_history   = fields.has_family_history.data,
            
            blood_type         = fields.blood_type.data,
            blood_pressure     = fields.blood_pressure.data,
        )
            
        return new_data


# Relationships
Patient.prescriptions = db.relationship(
    'Prescription', 
    cascade='all, delete-orphan'
)

Patient.accounts = db.relationship(
    'Account', 
    cascade='all, delete-orphan'
)

Patient.appointments = db.relationship(
    'Appointment', 
    cascade='all, delete-orphan'
)

Patient.gallery = db.relationship(
    'Gallery', 
    cascade='all, delete-orphan'
)

Patient.ortho = db.relationship(
    'Ortho', 
    cascade='all, delete-orphan'
)