import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config(object):
    #######################################################################
    # SECRET KEY
    SECRET_KEY                     = '0cec68b177f0b3c088b975001a924075df83cba24c44a314'
    
    # SESSION EXPIRY
    PERMANENT_SESSION_LIFETIME     = timedelta(hours=5) # 5 hours
    
    # MAX FILE SIZE
    MAX_CONTENT_LENGTH             = 1024 * 1024 * 20  # 10 MiB
    
    # LOG IN VIEW
    LOGIN_VIEW                     = 'admin.login'
    
    # LOG IN MESSAGE
    LOGIN_MESSAGE                  = 'Please log in first to access the dashboard.'
    
    # LOG IN SESSION PROTECTION LEVEL
    SESSION_PROTECTION_LEVEL       = 'strong'
    
    # CSRF TIME LIMIT
    WTF_CSRF_TIME_LIMIT            = 60 * 60 * 5 # 5 hours

    # PAGINATION (MAX ITEMS PER PAGE)
    PATIENTS_PER_PAGE              = 10
    
    # LOGS FOLDER
    LOGS_FOLDER                    = 'logs'
    
    # ERROR LOG FILE
    LOG_ERROR_FILE                 = 'errors.log'
    
    # UPLOAD FOLDER
    CATALOG_FOLDER                  = 'catalog'
    
    # ARCHIVE FOLDER
    ARCHIVES_FOLDER                = 'archives'
    
    # TEMPORARY UPLOAD FOLDER
    TEMP_FOLDER                    = 'temp'
    
    # RESOURCES FOLDER
    RESOURCE_FOLDER                = 'resources'
    
    # ALLOWED IMAGE TYPES TO UPLOAD
    ALLOWED_IMAGES                 = ['png', 'jpg']
    
    # PRESCRIPTION FORM PAD
    PRESCRIPTION_FORM              = 'prescription_form.jpg'
    
    # FONT FOR WRITING PRESCRIPTIONS
    PRESCRIPTION_FONT              = 'NotCourierSans.otf'

    #######################################################################
    # DATABASE NAME
    DB_NAME                        = 'master_record.db'
    
    # DATABASE URI
    SQLALCHEMY_DATABASE_URI        = 'sqlite:///'
    
    # TRACK MODIFICATIONS
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    
    def __init__(self):
        self.LOGS_FOLDER              = os.path.join(basedir, self.LOGS_FOLDER)
        self.LOG_ERROR_FILE           = os.path.join(self.LOGS_FOLDER, self.LOG_ERROR_FILE)
        self.CATALOG_FOLDER            = os.path.join(basedir, self.CATALOG_FOLDER)
        self.ARCHIVES_FOLDER          = os.path.join(basedir, self.ARCHIVES_FOLDER)
        self.TEMP_FOLDER              = os.path.join(basedir, self.TEMP_FOLDER)
        self.RESOURCE_FOLDER          = os.path.join(basedir, self.RESOURCE_FOLDER)
        self.PRESCRIPTION_FORM        = os.path.join(basedir, self.RESOURCE_FOLDER, self.PRESCRIPTION_FORM)
        self.PRESCRIPTION_FONT        = os.path.join(basedir, self.RESOURCE_FOLDER, self.PRESCRIPTION_FONT)
        self.SQLALCHEMY_DATABASE_URI += os.path.join(basedir, self.DB_NAME)
        
        # Create directories
        if not os.path.exists(self.LOGS_FOLDER):
            os.makedirs(self.LOGS_FOLDER)

        if not os.path.exists(self.CATALOG_FOLDER):
            os.makedirs(self.CATALOG_FOLDER)
            
        if not os.path.exists(self.ARCHIVES_FOLDER):
            os.makedirs(self.ARCHIVES_FOLDER)
            
        if not os.path.exists(self.TEMP_FOLDER):
            os.makedirs(self.TEMP_FOLDER)
            
        if not os.path.exists(self.RESOURCE_FOLDER):
            os.makedirs(self.RESOURCE_FOLDER)