from clinicmanager.app import db
from ._base import CustomModel
from ..models import Patient
from sqlalchemy.sql import func


class Ortho(db.Model, CustomModel):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.unique_id'))
    created_at = db.Column(db.DateTime, server_default=func.now())
    updated_at = db.Column(db.DateTime, onupdate=func.now())
    
    # General info
    has_past_ortho = db.Column(db.String(3))
    has_nasorepiratory = db.Column(db.String(3))
    has_tonsilitis = db.Column(db.String(3))
    has_allergy = db.Column(db.String(3))
    other_problems = db.Column(db.Text)
    
    # Facial features
    posture_at_rest = db.Column(db.String(6))
    upper_lip = db.Column(db.String(10))
    lower_lip = db.Column(db.String(10))
    soft_tissue_profile = db.Column(db.String(8))
    breathing_pattern = db.Column(db.String(8))
    
    # Intra-oral features
    gingiva = db.Column(db.String(10))
    tonsils = db.Column(db.String(10))
    adenoids = db.Column(db.String(10))
    
    extent_mobility = db.Column(db.String(8))
    postural_position = db.Column(db.String(8))
    position_speech = db.Column(db.String(8))
    
    unconscious = db.Column(db.String(14))
    command = db.Column(db.String(14))
    water = db.Column(db.String(14))
    masticatory = db.Column(db.String(14))
    swallowing_notes = db.Column(db.Text)
    
    digital_habit = db.Column(db.String(200))
    bruxism = db.Column(db.String(200))
    habit_notes = db.Column(db.Text)
    
    occurrence = db.Column(db.String(8))
    continuous = db.Column(db.String(3))
    night_only = db.Column(db.String(3))
    tension_only = db.Column(db.String(3))
    correction_attempt = db.Column(db.String(10))
    
    supernumerary_teeth = db.Column(db.String(100))
    missing_teeth = db.Column(db.String(100))
    malformed_impacted = db.Column(db.String(100))
    delayed_development = db.Column(db.String(100))
    eruptions_sequence = db.Column(db.String(100))
    maxillary_arch_form = db.Column(db.String(9))
    mandibular_arch_form = db.Column(db.String(9))
    molar_relationship = db.Column(db.String(9))
    cuspid_relationship = db.Column(db.String(9))
    overjet = db.Column(db.Float)
    overbite = db.Column(db.Float)
    openbite = db.Column(db.Float)
    together = db.Column(db.String(3))
    lower1 = db.Column(db.Float)
    to_right = db.Column(db.Float)
    lower2 = db.Column(db.Float)
    to_left = db.Column(db.Float)
    arch_asymmetry = db.Column(db.String(100))
    teeth_displaced = db.Column(db.String(100))
    
    @staticmethod
    def create(fields):
        ortho = Ortho()
        # Populate object
        attrs = filter(lambda attr: not attr.startswith('_'), dir(ortho))
        empty_values = ['-', '']
        
        for attr in attrs:
            current = fields.get(attr)
            if current not in empty_values:
                setattr(ortho, attr, current)
            
        db.session.add(ortho)
        
        # Make the patient ortho
        Patient.update_field(fields.get('patient_id'), 'patient_type', 'ortho')
        
        # Display the attributes and their values
        # pprint([(x, getattr(ortho, x)) for x in filter(lambda attr: not attr.startswith('_'), dir(ortho))])
        
        return Ortho._commit()
    
    @staticmethod
    def update_field(id, field_name, field_value):
        ortho = Ortho.query.filter_by(patient_id=id).first()
        setattr(ortho, field_name, field_value)
        
        return Ortho._commit()