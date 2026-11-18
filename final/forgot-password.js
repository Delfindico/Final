const codeInputs = Array.from(document.querySelectorAll(".code-input"));
const sendButton = document.getElementById("send-code");
const resendButton = document.getElementById("resend-code");
const forgotForm = document.getElementById("forgot-form");
const codeStatus = document.getElementById("code-status");

function sendCode() {
    codeInputs.forEach((input) => {
        input.value = "";
    });

    codeStatus.textContent = "Enter any 6 digits for this demo.";
    codeInputs[0].focus();
}

codeInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
        const digits = input.value.replace(/\D/g, "");
        if (digits.length > 1) {
            digits.slice(0, codeInputs.length - index).split("").forEach((digit, digitIndex) => {
                codeInputs[index + digitIndex].value = digit;
            });
            codeInputs[Math.min(index + digits.length, codeInputs.length - 1)].focus();
            return;
        }

        input.value = digits;
        if (digits && index < codeInputs.length - 1) {
            codeInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value && index > 0) {
            codeInputs[index - 1].focus();
        }
    });

    input.addEventListener("paste", (event) => {
        event.preventDefault();
        const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        digits.split("").forEach((digit, digitIndex) => {
            if (codeInputs[digitIndex]) codeInputs[digitIndex].value = digit;
        });
        codeInputs[Math.min(digits.length, 5)].focus();
    });
});

sendButton.addEventListener("click", sendCode);
resendButton.addEventListener("click", sendCode);

forgotForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const enteredCode = codeInputs.map((input) => input.value).join("");
    if (!/^\d{6}$/.test(enteredCode)) {
        codeStatus.textContent = "Enter the complete 6-digit code";
        codeInputs.find((input) => !input.value)?.focus();
        return;
    }

    codeStatus.textContent = "Code accepted";
    window.location.href = "reset-password.html";
});
