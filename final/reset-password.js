const resetForm = document.getElementById("reset-form");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const newPasswordError = document.getElementById("new-password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");

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

resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError(newPasswordInput, newPasswordError);
    clearError(confirmPasswordInput, confirmPasswordError);

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!newPassword) {
        setError(newPasswordInput, newPasswordError, "Please enter a new password.");
        return;
    }
    if (newPassword.length < 8 || newPassword.length > 64) {
        setError(newPasswordInput, newPasswordError, "Password must be between 8 and 64 characters.");
        return;
    }
    if (!confirmPassword) {
        setError(confirmPasswordInput, confirmPasswordError, "Please confirm your new password.");
        return;
    }
    if (newPassword !== confirmPassword) {
        setError(confirmPasswordInput, confirmPasswordError, "Passwords do not match.");
        return;
    }

    try {
        const account = window.MidLinkAccount.getAccount() || {
            name: localStorage.getItem("midlink.profileName") || "",
            email: "",
            phone: ""
        };
        const credential = await window.MidLinkAccount.createPasswordCredential(newPassword);
        Object.assign(account, credential);
        window.MidLinkAccount.saveAccount(account);
        localStorage.removeItem("midlink.accountDisabled");

        window.alert("Password reset successful!");
        window.location.href = "index.html";
    } catch (error) {
        setError(newPasswordInput, newPasswordError, error.message || "Could not reset password.");
    }
});
