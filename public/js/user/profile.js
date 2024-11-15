// script.js
document.getElementById('editAccountBtn').addEventListener('click', function() {
    // Toggle the read-only state of the form fields
    document.getElementById('name').readOnly = !document.getElementById('name').readOnly;
    document.getElementById('location').readOnly = !document.getElementById('location').readOnly;
    document.getElementById('email').readOnly = !document.getElementById('email').readOnly;
    document.getElementById('phone').readOnly = !document.getElementById('phone').readOnly;

    // Change the button text
    if (document.getElementById('editAccountBtn').textContent === 'Edit Account') {
        document.getElementById('editAccountBtn').textContent = 'Save Changes';
    } else {
        document.getElementById('editAccountBtn').textContent = 'Edit Account';
    }
});

document.getElementById('editAddressBtn').addEventListener('click', function() {
    // Toggle the read-only state of the form fields
    document.getElementById('name').readOnly = !document.getElementById('name').readOnly;
    document.getElementById('address').readOnly = !document.getElementById('address').readOnly;
    document.getElementById('pin').readOnly = !document.getElementById('pin').readOnly;
    document.getElementById('phone').readOnly = !document.getElementById('phone').readOnly;
    document.getElementById('email').readOnly = !document.getElementById('email').readOnly;

    // Change the button text
    if (document.getElementById('editAddressBtn').textContent === 'Edit Address') {
        document.getElementById('editAddressBtn').textContent = 'Save Changes';
    } else {
        document.getElementById('editAddressBtn').textContent = 'Edit Address';
    }
});