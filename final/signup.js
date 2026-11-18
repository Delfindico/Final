const signupForm = document.getElementById("signup-form");
const fullNameInput = document.getElementById("fullname");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");

const fullNameError = document.getElementById("fullname-error");
const phoneError = document.getElementById("phone-error");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");
const gmailPattern = /^[A-Za-z0-9]+(?:[._][A-Za-z0-9]+)*@gmail\.com$/i;

document.querySelectorAll(".password-toggle").forEach((toggleButton) => {
    toggleButton.addEventListener("click", () => {
        const passwordField = toggleButton.parentElement.querySelector("input");
        const isHidden = passwordField.type === "password";

        passwordField.type = isHidden ? "text" : "password";
        toggleButton.classList.toggle("is-visible", isHidden);
        toggleButton.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
        toggleButton.setAttribute("aria-pressed", String(isHidden));
        passwordField.focus();
    });
});

function setError(input, errorElement, message) {
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
    errorElement.hidden = false;
}

function clearError(input, errorElement) {
    input.setAttribute("aria-invalid", "false");
    errorElement.textContent = "";
    errorElement.hidden = true;
}

signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    clearError(fullNameInput, fullNameError);
    clearError(phoneInput, phoneError);
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);
    clearError(confirmPasswordInput, confirmPasswordError);

    let isValid = true;

    if (!fullName) {
        setError(fullNameInput, fullNameError, "Please enter your full name.");
        isValid = false;
    } else if (!/^(?=.{2,50}$)[A-Za-zÑñ\s]+$/u.test(fullName)) {
        setError(fullNameInput, fullNameError, "Full name must be 2-50 letters only.");
        isValid = false;
    }

    if (!phone) {
        setError(phoneInput, phoneError, "Please enter your phone number.");
        isValid = false;
    } else if (!/^\d{11}$/.test(phone)) {
        setError(phoneInput, phoneError, "Phone number must be exactly 11 numbers.");
        isValid = false;
    }

    if (!email) {
        setError(emailInput, emailError, "Please enter your email address.");
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError(emailInput, emailError, "Please enter a valid email address.");
        isValid = false;
    } else if (email.toLowerCase().endsWith("@gmail.com") && !gmailPattern.test(email)) {
        setError(emailInput, emailError, "Gmail usernames may use letters, numbers, periods, and underscores.");
        isValid = false;
    }

    if (!password) {
        setError(passwordInput, passwordError, "Please enter your password.");
        isValid = false;
    } else if (password.length < 8 || password.length > 64) {
        setError(passwordInput, passwordError, "Password must be between 8 and 64 characters.");
        isValid = false;
    }

    if (!confirmPassword) {
        setError(confirmPasswordInput, confirmPasswordError, "Please confirm your password.");
        isValid = false;
    } else if (password !== confirmPassword) {
        setError(confirmPasswordInput, confirmPasswordError, "Passwords do not match.");
        isValid = false;
    }

    if (isValid) {
        alert("Sign up successful!");
        window.location.href = "index.html";
    }
});
