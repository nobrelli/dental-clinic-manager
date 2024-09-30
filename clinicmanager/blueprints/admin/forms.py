from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    PasswordField,
    BooleanField,
    SubmitField
)
from wtforms.validators import (
    DataRequired,
    EqualTo
)


class LogoutForm(FlaskForm):
    pass


class LoginForm(FlaskForm):
    username    = StringField('Username', validators=[DataRequired()])
    password    = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Keep me signed in')
    submit      = SubmitField('Sign in')


class ChangePassword(FlaskForm):
    current_password = PasswordField('Current password', validators=[DataRequired()])
    new_password     = PasswordField('New password', validators=[DataRequired(),
                        EqualTo('confirm_password', message='Passwords must match')])
    confirm_password = PasswordField('Confirm password', validators=[DataRequired()])
    submit           = SubmitField('Change password')
    