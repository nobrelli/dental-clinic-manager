import os
import pathlib
import re
import subprocess
import locale
import base64
from datetime import date, datetime

from PIL import Image, ImageDraw, ImageFont
from flask import current_app

from . import bp
from ..admin.forms import LogoutForm


@bp.context_processor
def add_logout():
    logout_form = LogoutForm()
    return dict(logout=logout_form)


@bp.app_template_filter()
def pluralize(count, singular, plural):
    return singular if count == 1 else plural


@bp.app_template_filter()
def clean_svg(markup: bytes):
    if not markup:
        return 'No signature'
        
    markup = markup.decode()\
        .replace('<?xml version="1.0" standalone="no"?>\s+'
                 '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"\s+'
                 '"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">', '')
    return re.sub(r'width="[0-9]*\.[0-9]+[a-zA-Z]+"\s+'
                  r'height="[0-9]*\.[0-9]+[a-zA-Z]+"',
                  'width="60%"', markup)
                  
                  
@bp.app_template_filter()
def to_yesno(input):
    return 'Yes' if input else 'No'


@bp.app_template_filter()
def dotize(text):
    return text if '.' in text else text + '.'


@bp.app_template_filter()
def format_date(date):
    return date.strftime('%b %d, %Y')


@bp.app_template_filter()
def format_datetime(date):
    return moment(date).format('MMM D YYYY, h:mm A')


@bp.app_template_filter()
def currency(input):
    locale.setlocale(locale.LC_ALL, 'en_US')
    return locale.currency(input, symbol=False, grouping=True)


@bp.app_template_filter()
def calculate_age(born, leap_day_anniversary_Feb28=True):
    # https://stackoverflow.com/a/2218654
    today = date.today()
    age = today.year - born.year

    try:
        anniversary = born.replace(year=today.year)
    except ValueError:
        assert born.day == 29 and born.month == 2

        if leap_day_anniversary_Feb28:
            anniversary = date(today.year, 2, 28)
        else:
            anniversary = date(today.year, 3, 1)

    if today < anniversary:
        age -= 1

    return age
    
    
@bp.app_template_filter()
def old_calculate_age(born):
    today = date.today()
    
    try:
        birthday = born.replace(year=today.year)   
    except:
        birthday = born.replace(year=today.year,
                                month=born.month + 1,
                                day=1)
        
    if birthday > today:
        return today.year - born.year - 1
    else:
        return today.year - born.year
    
    
def validate_file(filename):
    return get_ext(filename) in current_app.config['ALLOWED_IMAGES']
    

def get_ext(filename):
    return pathlib.Path(filename).suffix
    
    
def process_signature(data, filename, patient_id):
    if not data and not filename:
        return False
    
    # Set a custom unique image name.
    upload_folder = os.path.join(current_app.config.get('CATALOG_FOLDER'), patient_id)
    svg_file = filename + '.svg'
    ext = ''
    
    # Save the image to the uploads directory
    ext = data.split('/')[1]
    uploaded_file = os.path.join(upload_folder, filename + '.' + ext)

    with open(uploaded_file, 'wb') as to_write:
        to_write.write(base64.b64decode(data.split(',')[1].encode()))

    trim_image(uploaded_file, os.path.join(upload_folder, svg_file))
    os.remove(uploaded_file)


def trim_image(source, destination):
    try:
        # Trim the image
        tobmp = subprocess.Popen(['convert', '-quiet', source, '-trim', 'bmp:-'],
                                 stdout=subprocess.PIPE)
        tosvg = subprocess.Popen(['potrace', '-s', '-o', destination],
                                 stdin=tobmp.stdout,
                                 stdout=subprocess.PIPE)
        tosvg.wait()
        tobmp.stdout.close()
        tosvg.stdout.close()
        
        return True
    except Exception as e:
        current_app.logger.exception(e)
        
    return False
   
    
def strtobool(text: str):
    return bool(text.lower() == 'true')
    
    
def sendJSONMessage(message=None, success=True, data={}, redirect=None):
    return {
        'message': message,
        'success': success,
        'data': data,
        'redirect': redirect
    }
    
    
def make_prescription(data, rx, meds, filename):
    # Data to write
    middle_ini = f' {data.middle_initial}' if data.middle_initial else ''
    info = {
        'name': f'{data.first_name.upper()}{middle_ini} {data.last_name.upper()}',
        'address': data.address.upper(),
        'age': str(calculate_age(data.birthdate)),
        'sex': data.sex.upper(),
        'date': datetime.now().strftime('%b %d, %Y').upper()
    }
    color = (0, 0, 0)
    
    # Write prescription
    img = Image.open(current_app.config['PRESCRIPTION_FORM'])
    ctx = ImageDraw.Draw(img)
    font = ImageFont.truetype(current_app.config['PRESCRIPTION_FONT'], 35)
    
    # Patient info
    ctx.text((445, 710), info['name'], font=font, fill=color)
    ctx.text((340, 770), info['address'], font=font, fill=color)
    ctx.text((260, 840), info['age'], font=font, fill=color)
    ctx.text((680, 840), info['sex'], font=font, fill=color)
    ctx.text((1180, 840), info['date'], font=font, fill=color)
    
    font = ImageFont.truetype(current_app.config['PRESCRIPTION_FONT'], 45)
    
    # Rx
    count = len(rx['medications'])
    for i in range(count):
        med = meds.get(rx['medications'][i])
        fact = 300 * i

        # Adjust spacing..
        if i > 0:
            if not rx['prn'][i - 1]:
                fact -= 50

        # Medication name
        drug = med.drug + ' ('
        drug += str(med.dose) + ' mg'

        if med.type == 'bot':
            drug += '/' + str(med.unit) + ' mL'

        drug += ')'
        
        # Dispense number
        disp = '#' + str(rx['disp'][i])
        
        match med.type:
            case 'tab':
                disp += ' tablet' + pluralize(rx['disp'][i], '', 's') + ' '
            case 'cap':
                disp += ' capsule' + pluralize(rx['disp'][i], '', 's') + ' '
            case 'bot':
                disp += ' bottle' + pluralize(rx['disp'][i], '', 's') + ' '
                disp += str(med.volume) + ' mL'

        # Signatura
        sig = 'Sig. Take '
        sig += str(rx['dosage'][i]) + ' '
        
        match med.type:
            case 'tab':
                sig += 'tab' + pluralize(rx['dosage'][i], '', 's') + ' '
            case 'cap':
                sig += 'cap' + pluralize(rx['dosage'][i], '', 's') + ' '
            case 'bot':
                sig += 'tsp. '
                sig += '(' + str(rx['amount'][i]) + ' mL) '

        sig += 'q' + str(rx['hours'][i]) + ' '

        prn = ''
        if rx['prn'][i]:
            prn += 'P.R.N. (if needed)'
        else:
            sig += 'for ' + str(rx['days'][i]) +\
                   ' day' + pluralize(rx['days'][i], '', 's')
               
        ctx.text((400, 1020 + fact), drug, font=font, fill=color)
        ctx.text((400, 1080 + fact), disp, font=font, fill=color)
        ctx.text((400, 1140 + fact), sig, font=font, fill=color)
        ctx.text((400, 1200 + fact), prn, font=font, fill=color)
    
    # Save image
    upload_folder = os.path.join(current_app.config.get('CATALOG_FOLDER'), data.unique_id, 'prescriptions')
    
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    img.save(os.path.join(upload_folder, filename + '.jpg'))

    # with open(os.path.join(upload_folder, filename), 'rb') as converted:
    #     result = converted.read()

    # os.remove(os.path.join(upload_folder, filename))
