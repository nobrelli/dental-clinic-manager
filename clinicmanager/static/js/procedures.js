const saveBtn = document.getElementById('saveBtn');
const form = document.getElementById('addItemForm');
const message = document.getElementById('modalMessage');
const title = document.getElementById('modalTitle');
const procedureID = document.getElementById('procedureID');
const mode = document.getElementById('mode');
const name = document.getElementById('name');
const details = document.getElementById('details');
const price = document.getElementById('price');
const deleteConfirm = document.getElementById('deleteConfirm');
const modalDeleteMessage = document.getElementById('modalDeleteMessage');
const deleteBtn = document.getElementById('deleteBtn');

document.getElementById('addItemButton').onclick = () =>
{
    deleteBtn.classList.remove('d-inline');
    hide(deleteBtn);
    setText(title, 'Add item');
    name.value = '';
    mode.value = 'add';
    price.value = '';
}

document.querySelectorAll('.procedure').forEach(product => product.addEventListener('click', event => {
    show(deleteBtn);
    deleteBtn.classList.add('d-inline');
    setText(title, 'Edit item');
    mode.value = 'edit';
    procedureID.value = product.querySelector('.prod-id').textContent;
    name.value = product.querySelector('.prod-name').textContent;
    details.value = product.querySelector('.prod-details').textContent;
    price.value = product.querySelector('.prod-price').textContent;
}));

deleteConfirm.onclick = () =>
{
    const deleteUrl = Flask.url_for('dashboard.delete_procedure');;

    postData(deleteConfirm,
             modalDeleteMessage,
                 deleteUrl, {
                    id: procedureID.value
                 });
}

form.onsubmit = event =>
{
    if (form.checkValidity())
    {
        let url = '';
        event.preventDefault();

        if (mode.value === 'add')
            url = Flask.url_for('dashboard.add_procedure');
        else
            url = Flask.url_for('dashboard.edit_procedure')

        data = {
            id: procedureID.value,
            name: name.value,
            details: details.value,
            price: price.value
        }

        postData(saveBtn, message, url, data);
    }
}

saveBtn.onclick = () => {
    form.dispatchEvent(new Event('submit'));
}