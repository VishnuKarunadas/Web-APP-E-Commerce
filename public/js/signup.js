const nameid = document.getElementById("name");
const emailid = document.getElementById("email");
const phoneid = document.getElementById("phone");
const password = document.getElementById("password");
const cPassword = document.getElementById("confirm-password");

const error1 = document.getElementById('error1');
const error2 = document.getElementById('error2');
const error3 = document.getElementById('error3');
const error4 = document.getElementById('error4');
const error5 = document.getElementById('error5');

const signform = document.getElementById("signform");

function nameValidateChecking(event) {
    const nameval = nameid.value;
    const namepattern = /^[A-Za-z\s]+$/;

    if (nameval.trim() === "") {
        error1.style.display = "block";
        error1.innerHTML = "Please enter a valid name";
    } else if (!namepattern.test(nameval)) {
        error1.style.display = "block";
        error1.innerHTML = "Name can only contain alphabets and spaces";
    } else {
        error1.style.display = "none";
        error1.innerHTML = "";
    }
}

function emailValidateChecking(event) {
    const emailval = emailid.value;
    const emailpattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})$/;

    if (!emailpattern.test(emailval)) {
        error2.style.display = "block";
        error2.innerHTML = "Invalid Format";
    } else {
        error2.style.display = "none";
        error2.innerHTML = "";
    }
}

function phoneValidateChecking(event) {
    const phoneval = phoneid.value.trim();

    
    if (phoneval === "") {
        error3.style.display = "block";
        error3.innerHTML = "Enter valid phone number";
    }
    
    else if (phoneval.length !== 10) {
        error3.style.display = "block";
        error3.innerHTML = "Enter 10 digits";
    }
    
    else if (!/^\d+$/.test(phoneval)) {
        error3.style.display = "block";
        error3.innerHTML = "Phone number must contain only digits";
    }
    
    else if (/^0+$/.test(phoneval)) {
        error3.style.display = "block";
        error3.innerHTML = "Phone number cannot be all zeros";
    }
    
    else {
        error3.style.display = "none";
        error3.innerHTML = "";
    }
}

function passValidateChecking(event) {
    const passval = password.value;
    const cpassval = cPassword.value;
    const alpha = /[a-zA-Z]/;
    const digit = /\d/;

    if (passval.length < 8) {
        error4.style.display = "block";
        error4.innerHTML = "Should contain at least 8 characters";
    } else if (!alpha.test(passval) || !digit.test(passval)) {
        error4.style.display = "block";
        error4.innerHTML = "Should contain both numbers and letters";
    } else {
        error4.style.display = "none";
        error4.innerHTML = "";
    }
    if (passval !== cpassval) {
        error5.style.display = "block";
        error5.innerHTML = "Password does not match";
    } else {
        error5.style.display = "none";
        error5.innerHTML = "";
    }
}

document.addEventListener("DOMContentLoaded", function() {
    signform.addEventListener("submit", function(event) {
        nameValidateChecking();
        emailValidateChecking();
        phoneValidateChecking();
        passValidateChecking();

        if (
            error1.innerHTML ||
            error2.innerHTML ||
            error3.innerHTML ||
            error4.innerHTML ||
            error5.innerHTML
        ) {
            event.preventDefault();
        }
    });

    // Adding individual validation on input change
    nameid.addEventListener("input", nameValidateChecking);
    emailid.addEventListener("input", emailValidateChecking);
    phoneid.addEventListener("input", phoneValidateChecking);
    password.addEventListener("input", passValidateChecking);
    cPassword.addEventListener("input", passValidateChecking);
});
