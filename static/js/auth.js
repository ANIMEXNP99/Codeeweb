// Authentication-related functionality for CoderX

document.addEventListener('DOMContentLoaded', function() {
    // Initialize form validation for login and registration forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            if (!validateLoginForm()) {
                e.preventDefault();
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            if (!validateRegistrationForm()) {
                e.preventDefault();
            }
        });
    }
    
    // Add scanner effect to forms
    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(form => {
        form.classList.add('scanner');
    });
    
    // Add cyberpunk effects to form fields
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.add('tech-border');
    });
});

// Validate login form
function validateLoginForm() {
    const usernameInput = document.getElementById('id_username');
    const passwordInput = document.getElementById('id_password');
    
    let isValid = true;
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Validate username
    if (!usernameInput.value.trim()) {
        displayError('id_username', 'Username is required');
        isValid = false;
    }
    
    // Validate password
    if (!passwordInput.value) {
        displayError('id_password', 'Password is required');
        isValid = false;
    }
    
    return isValid;
}

// Validate registration form
function validateRegistrationForm() {
    const usernameInput = document.getElementById('id_username');
    const emailInput = document.getElementById('id_email');
    const passwordInput = document.getElementById('id_password1');
    const confirmPasswordInput = document.getElementById('id_password2');
    
    let isValid = true;
    
    // Clear previous error messages
    clearErrorMessages();
    
    // Validate username
    if (!usernameInput.value.trim()) {
        displayError('id_username', 'Username is required');
        isValid = false;
    } else if (usernameInput.value.trim().length < 3) {
        displayError('id_username', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    // Validate email
    if (!emailInput.value.trim()) {
        displayError('id_email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
        displayError('id_email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password
    if (!passwordInput.value) {
        displayError('id_password1', 'Password is required');
        isValid = false;
    } else if (passwordInput.value.length < 8) {
        displayError('id_password1', 'Password must be at least 8 characters');
        isValid = false;
    }
    
    // Validate confirm password
    if (!confirmPasswordInput.value) {
        displayError('id_password2', 'Please confirm your password');
        isValid = false;
    } else if (passwordInput.value !== confirmPasswordInput.value) {
        displayError('id_password2', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

// Check if email is valid
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Display error message for a form field
function displayError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.createElement('div');
    errorElement.className = 'form-errors';
    errorElement.textContent = message;
    
    // Add error class to the input
    field.classList.add('is-invalid');
    
    // Insert error message after the input
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

// Clear all error messages
function clearErrorMessages() {
    // Remove error classes from inputs
    const invalidInputs = document.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    // Remove error messages
    const errorMessages = document.querySelectorAll('.form-errors');
    errorMessages.forEach(message => {
        message.remove();
    });
}