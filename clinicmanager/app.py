import logging, shutil, os

from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mobility import Mobility
from flask_sqlalchemy import SQLAlchemy
from flask_jsglue import JSGlue
from flask_moment import Moment
from datetime import datetime
# from freezegun import freeze_time

from .config import Config

db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
mobility = Mobility()
jsglue = JSGlue()
moment = Moment()
    
    
def build_app():
    config = Config()

    # Log in required
    login.login_view = config.LOGIN_VIEW
    login.login_message = config.LOGIN_MESSAGE
    login.session_protection = config.SESSION_PROTECTION_LEVEL

    app = Flask(__name__)
    app.config.from_object(config)
    
    # Logger
    if not app.debug:
        logging.basicConfig(filename=config.LOG_ERROR_FILE, level=logging.ERROR)
        app.logger.setLevel(logging.ERROR)
    
    # Initialize systems
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    mobility.init_app(app)
    jsglue.init_app(app)
    moment.init_app(app)
    
    # with app.app_context():
    #     now = datetime.now()
    #     print('Creating monthly backup...')
    #     # Archive patients' catalogs every month
    #     year_dir = now.strftime('%Y')
    #     archive_name = now.strftime('%B')
    #     archive = shutil.make_archive(archive_name, 'zip', config.CATALOG_FOLDER)
    #     dest = os.path.join(config.ARCHIVES_FOLDER, year_dir)
    #     os.makedirs(dest, exist_ok=True)
    #     shutil.move(archive, os.path.join(dest, archive_name + '.zip'))
    #     print('Backup done.')

    # Register blueprints
    from .blueprints.admin import bp as admin_bp
    app.register_blueprint(admin_bp, url_prefix='/admin')

    from .blueprints.dashboard import bp as main_bp
    app.register_blueprint(main_bp)

    return app
