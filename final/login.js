const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const passwordToggle = document.querySelector(".password-toggle");
const disabledMessage = document.getElementById("account-disabled-message");
const reactivateButton = document.getElementById("reactivate-account");
const gmailPattern = /^[A-Za-z0-9]+(?:[._][A-Za-z0-9]+)*@gmail\.com$/i;

function refreshDisabledAccountState() {
    const isDisabled = localStorage.getItem("midlink.accountDisabled") === "true";
    if (disabledMessage) {
        disabledMessage.textContent = isDisabled ? "This account is disabled in this browser." : "";
        disabledMessage.hidden = !isDisabled;
    }
    if (reactivateButton) reactivateButton.hidden = !isDisabled;
}

refreshDisabledAccountState();

reactivateButton?.addEventListener("click", async () => {
    passwordError.hidden = true;
    passwordInput.setAttribute("aria-invalid", "false");

    try {
        const account = window.MidLinkAccount.getAccount();
        if (!account || !account.passwordHash) {
            passwordError.textContent = "No saved password is available to verify this account.";
            passwordError.hidden = false;
            passwordInput.setAttribute("aria-invalid", "true");
            return;
        }
        if (!passwordInput.value || !await window.MidLinkAccount.verifyPassword(passwordInput.value, account)) {
            passwordError.textContent = "Enter the correct password to re-enable this account.";
            passwordError.hidden = false;
            passwordInput.setAttribute("aria-invalid", "true");
            return;
        }

        localStorage.removeItem("midlink.accountDisabled");
        passwordInput.value = "";
        refreshDisabledAccountState();
    } catch (error) {
        passwordError.textContent = error.message || "Could not verify this account.";
        passwordError.hidden = false;
        passwordInput.setAttribute("aria-invalid", "true");
    }
});

if (passwordToggle) {
    passwordToggle.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        passwordToggle.classList.toggle("is-visible", isHidden);
        passwordToggle.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
        passwordToggle.setAttribute("aria-pressed", String(isHidden));
        passwordInput.focus();
    });
}

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (localStorage.getItem("midlink.accountDisabled") === "true") {
        refreshDisabledAccountState();
        return;
    }

    emailInput.value = emailInput.value.trim();
    emailInput.setAttribute("aria-invalid", "false");
    passwordInput.setAttribute("aria-invalid", "false");
    emailError.hidden = true;
    passwordError.hidden = true;

    if (!emailInput.value) {
        emailError.textContent = "Please enter your email address.";
        emailError.hidden = false;
        emailInput.setAttribute("aria-invalid", "true");
    } else if (!gmailPattern.test(emailInput.value)) {
        emailError.textContent = "Enter a valid Gmail address. Use letters, numbers, and periods before @gmail.com.";
        emailError.hidden = false;
        emailInput.setAttribute("aria-invalid", "true");
    }

    if (!passwordInput.value) {
        passwordError.textContent = "Please enter your password.";
        passwordError.hidden = false;
        passwordInput.setAttribute("aria-invalid", "true");
    } else if (passwordInput.value.length < 8 || passwordInput.value.length > 64) {
        passwordError.textContent = "Password must be between 8 and 64 characters.";
        passwordError.hidden = false;
        passwordInput.setAttribute("aria-invalid", "true");
    }

    if (!emailInput.value
        || !gmailPattern.test(emailInput.value)
        || passwordInput.value.length < 8
        || passwordInput.value.length > 64) {
        return;
    }

    if (emailInput.value
        && gmailPattern.test(emailInput.value)
        && passwordInput.value.length >= 8
        && passwordInput.value.length <= 64) {
        loginForm.submit();
    }
});