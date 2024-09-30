from flask import (
    render_template,
    flash, redirect,
    url_for, request
)
from flask_login import (
    current_user,
    login_user,
    logout_user,
    login_required
)

from ..admin import bp
from ..admin.forms import (
    LoginForm, ChangePassword, LogoutForm
)
from ..admin.models import Admin
from ..dashboard.helpers import sendJSONMessage


@bp.get('/login')
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.view_patients'))
    
    data = dict(
        title='Sign in',
        form=LoginForm()
    )

    return render_template('login.html', **data)
    
    
@bp.post('/check_login')
def check_login():
    form = LoginForm(data=request.json)
    
    if not form.validate_on_submit():
        messages = [message[0] for message in form.errors.values()]
        return sendJSONMessage(messages, False)
        
    user = Admin.query.filter_by(username=form.username.data).first()
    
    if user is None or not user.check_password(form.password.data):
        return sendJSONMessage('Wrong username or password.', False)
        
    login_user(user, remember=form.remember_me.data)
        
    return sendJSONMessage(
        'Sign in successful. Redirecting...', 
        redirect=url_for('dashboard.index')
    )


@bp.post('/logout')
def logout():
    logout_user()
    flash('Successfully logged out.')
    return redirect(url_for('admin.login'))


@bp.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    data = dict(
        title='Change password',
        form=ChangePassword(),
        logout=LogoutForm()
    )
    
    if request.method == 'POST':
        data = request.json
        form = ChangePassword(data=data)
        
        if form.validate_on_submit():
            user = Admin.query.get(current_user.id)
            
            if user.check_password(data.get('current_password')):
                if user.change_password(data.get('new_password')):
                    return sendJSONMessage('Password changed.')
                
                return sendJSONMessage('The new password is the same as the old one.', False)
            
            return sendJSONMessage('The current password is wrong.', False)
        
        return sendJSONMessage(form.errors, False)
    
    return render_template('change_password.html', **data)