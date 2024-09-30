from flask_login import UserMixin
from werkzeug.security import (
    generate_password_hash, check_password_hash
)
from ..dashboard.models._base import CustomModel

from ... import db, login


@login.user_loader
def load_user(id):
    return Admin.query.get(int(id))


class Admin(UserMixin, db.Model, CustomModel):
    id       = db.Column(db.Integer,    primary_key=True)
    username = db.Column(db.String(64), unique=True)
    password = db.Column(db.String(128))

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def change_password(self, password):
        if self.check_password(password):
            return False
        
        self.set_password(password)
        
        return Admin._commit()