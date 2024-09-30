from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    DateField,
    SubmitField,
    BooleanField,
    SelectField,
    IntegerField,
    TextAreaField,
    HiddenField
)
from wtforms.validators import (
    DataRequired,
    NumberRange
)


class MedicineForm(FlaskForm):
    drug = StringField(
        'Medication', 
        validators=[
            DataRequired()
        ]
    )
    
    type = SelectField(
        'Category', 
        choices=[
            ('tab', 'Tablet'), 
            ('cap', 'Capsule'), 
            ('bot', 'Bottle')
        ]
    )
    
    dose = IntegerField(
        'Dose', 
        validators=[
            DataRequired(), 
            NumberRange(min=0)
        ]
    )
    
    unit = IntegerField(
        'per', 
        validators=[
            DataRequired(), 
            NumberRange(min=1)
        ]
    )
    
    volume = IntegerField(
        'Volume per bottle', 
        validators=[
            DataRequired(), 
            NumberRange(min=1)
        ]
    )
    
    submit = SubmitField('Submit')
    
    
class ProcedureForm(FlaskForm):
    name = StringField(
        'Name of the procedure', 
        validators=[
            DataRequired()
        ]
    )
    
    details = TextAreaField('Other details')
    
    price = StringField(
        'Medication', 
        validators=[
            DataRequired()
        ]
    )


class ProductForm(FlaskForm):
    name = StringField(
        'Name', 
        validators=[
            DataRequired()
        ]
    )
    
    details = TextAreaField('Other details')
    
    price = StringField(
        'Price', 
        validators=[
            DataRequired()
        ]
    )


class PatientForm(FlaskForm):
    # Basic info    
    first_name = StringField(
        'First name', 
        validators=[
            DataRequired()
        ]
    )
    
    last_name = StringField(
        'Last name', 
        validators=[
            DataRequired()
        ]
    )
    
    middle_initial = StringField('Middle initial')
    suffix = StringField('Suffix (Jr, Sr, III...)')
    birthdate = DateField('Birthdate')
    height = StringField('Height')
    weight = StringField('Weight')
    
    sex = SelectField(
        'Gender', 
        choices=[
            ('M', 'Male'),
            ('F', 'Female')
        ]
    )
    occupation = StringField('Occupation')

    # Contact info
    number = StringField('Contact number')
    email = StringField('Email')
    address = TextAreaField('Address')
    
    # If minor
    father_name = StringField('Father\'s name')
    father_occupation = StringField('Father\'s occupation')
    father_contact = StringField('Contact number')
    mother_name = StringField('Mother\'s name')
    mother_occupation = StringField('Mother\'s occupation')
    mother_contact = StringField('Contact number')

    # Referral
    referrer = StringField('Referrer')
    reason_for_consulation = StringField('Reason for consultation')
    
    # History
    current_medications = StringField('Current medications')
    allergies = StringField('Allergies')
    previous_hospitalization = StringField('Previous hospitalization of surgery')
    abnormalities = StringField('Development abnormalities')
    conditions = StringField('Health conditions')
    # Minors
    has_reactions = BooleanField('Has your child experience any unfavourable reaction from any previous dental or medical care?')
    has_problems = BooleanField('Has your child ever had any hearing, sight, speech, coordination or special schooling?')
    has_family_history = BooleanField('Pertinent social and family history')
    
    blood_type = SelectField(
        'Blood type', 
        choices=[
            'Unspecified', 
            'A+', 'A-', 'B+', 
            'B-', 'O+', 'O-', 
            'AB+', 'AB-'
        ]
    )
    blood_pressure = StringField('Blood pressure')
    notes = TextAreaField('Notes')
    signature = HiddenField()
    

class OrthoForm(FlaskForm):
    has_past_ortho = SelectField('Past ortho treatment', choices=['-', 'Yes', 'No'])
    has_nasorespiratory = SelectField('Nasorespiratory', choices=['-', 'Yes', 'No'])
    has_tonsilitis = SelectField('Tonsilitis', choices=['-', 'Yes', 'No'])
    has_allergy = SelectField('Allergy', choices=['-', 'Yes', 'No'])
    other_problems = TextAreaField('Notes')
    
    cast = DateField('Cast')
    panoramic_radiograph = DateField('Panoramic Radiograph')
    lateral_cephalogram = DateField('Lateral Cephalogram')
    photographs = DateField('Photographs')
    other_records = DateField('Others')
    
    posture_at_rest = SelectField('Posture at rest', choices=['-', 'Open', 'Closed'])
    upper_lip = SelectField('Upper lip', choices=['-', 'Normal', 'Hypotonic', 'Hypertonic'])
    lower_lip = SelectField('Lower lip', choices=['-', 'Normal', 'Hypotonic', 'Hypertonic'])
    soft_tissue_profile = SelectField('Soft tissue profile', choices=['-', 'Normal', 'Abnormal'])
    breathing_pattern = SelectField('Breathing pattern', choices=['-', 'Normal', 'Abnormal'])
    
    gingiva = SelectField('Gingiva', choices=['-', 'Yes', 'No', 'Condition'])
    tonsils = SelectField('Tonsils present', choices=['-', 'Yes', 'No', 'Condition'])
    adenoids = SelectField('Adenoids present', choices=['-', 'Yes', 'No', 'Condition'])
    
    extent_mobility = SelectField('Extent and mobility', choices=['-', 'Normal', 'Abnormal'])
    postural_position = SelectField('Postural position', choices=['-', 'Normal', 'Abnormal'])
    position_speech = SelectField('Position during speech', choices=['-', 'Normal', 'Abnormal'])
    
    unconscious = SelectField('Unconscious', choices=['-', 'Teeth together', 'Apart'])
    command = SelectField('Command', choices=['-', 'Teeth together', 'Apart'])
    water = SelectField('Water', choices=['-', 'Teeth together', 'Apart'])
    masticatory = SelectField('Masticatory', choices=['-', 'Teeth together', 'Apart'])
    swallowing_notes = TextAreaField('Notes')
    
    digital_habit = StringField('Digital')
    bruxism = StringField('Bruxism')
    habit_notes = TextAreaField('Notes')
    
    occurrence = SelectField('Occurrence', choices=['-', 'Active', 'Inactive'])
    continuous = SelectField('Continuous', choices=['-', 'Yes', 'No'])
    night_only = SelectField('Night only', choices=['-', 'Yes', 'No'])
    tension_only = SelectField('Tension only', choices=['-', 'Yes', 'No'])
    correction_attempt = SelectField('Previous attempts at correction', choices=['-', 'by parents', 'by others'])
    
    supernumerary_teeth = StringField('Supernumerary teeth')
    missing_teeth = StringField('Missing teeth')
    malformed_impacted = StringField('Malformed, impacted or ectopic teeth')
    delayed_development = StringField('Teeth showing delayed development')
    eruptions_sequence = StringField('Eruptions sequence apparent')
    maxillary_arch_form = SelectField('Maxillary arch form', 
                                      choices=['-', 'Tapering', 'Trapezoid', 'Avoid', '"U" Type'])
    mandibular_arch_form = SelectField('Mandibular arch form', 
                                       choices=['-', 'Tapering', 'Trapezoid', 'Avoid', '"U" Type'])
    molar_relationship = SelectField('Moral relationship', 
                                     choices=['-', 'Class I', 'Class II', 'Class III', 'E-E'])
    cuspid_relationship = SelectField('Cuspid relationship',
                                      choices=['-', 'Class I', 'Class II', 'Class III', 'E-E'])
    overjet = IntegerField('Over jet')
    overbite = IntegerField('Over bite')
    openbite = IntegerField('Open bite')
    
    together = StringField('Together')
    lower1 = IntegerField('Lower')
    to_right = IntegerField('to right')
    lower2 = IntegerField('Lower')
    to_left = IntegerField('to left')
    arch_asymmetry = StringField('Arch asymmetry')
    teeth_displaced = StringField('Teeth mesially displaced')
    
    concerns = TextAreaField('Other problems or concerns')
    
    with_retainer = StringField('with retainer')
    without_retainer = StringField('excluding retainer')
    
    # first_payment = StringField()
    # monthly_payment = StringField()
    # frequency = IntegerField()
    # total_payment = StringField()
    
    parent_name = StringField('Parent/guardian\'s name')