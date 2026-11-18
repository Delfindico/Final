const accountStore = window.MidLinkAccount;
const settingsDialog = document.getElementById("settings-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogDescription = document.getElementById("dialog-description");
const settingsDetails = document.getElementById("settings-details");
const appRoot = new URL("./", document.currentScript.src);
const profilePhotoStorageKey = "midlink.profilePhoto";
const maximumProfilePhotoSize = 1024 * 1024;
const allowedProfilePhotoTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const settingLabels = {
    account: ["Account info", "Update the name shown on your MidLink profile."],
    profilePhoto: ["Profile photo", "Choose a profile photo shown across MidLink on this browser."],
    security: ["Password and Security", "Set or change the password saved on this browser. Server account updates can be connected when the database is ready."],
    family: ["Family Center", "Manage the status of your account."],
    notifications: ["Notifications", "Choose which updates you want to receive."],
    appearance: ["Appearance", "Choose how the settings menu looks."],
    language: ["Language", "Save your preferred language."],
    help: ["Help and Support", "Find help with your account, a deal, or a technical issue."]
};

function displayName() {
    return localStorage.getItem("midlink.profileName") || "Anya Forger";
}

function applyDisplayName(name) {
    document.querySelectorAll(".profile-name").forEach((element) => {
        element.textContent = name;
    });
    document.querySelectorAll(".profile img, img.profile-picture").forEach((image) => {
        image.alt = `${name} profile picture`;
    });
}

function defaultProfilePhoto(image) {
    if (!image.dataset.defaultSrc) {
        image.dataset.defaultSrc = image.getAttribute("src") || new URL("anya.webp", appRoot).href;
    }
    return image.dataset.defaultSrc;
}

function applyDisplayPhoto(photoData) {
    let savedPhoto = photoData;
    if (photoData === undefined) {
        try {
            savedPhoto = localStorage.getItem(profilePhotoStorageKey);
        } catch (error) {
            console.error("Could not load the saved profile photo.", error);
            savedPhoto = "";
        }
    }

    document.querySelectorAll(".profile img, img.profile-picture").forEach((image) => {
        const defaultPhoto = defaultProfilePhoto(image);
        image.src = savedPhoto || defaultPhoto;
        image.alt = `${displayName()} profile picture`;
    });
}

function setFeedback(element, message, isError) {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
}

function createField(form, labelText, name, type, value, options) {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");

    wrapper.className = "settings-field";
    label.htmlFor = `settings-${name}`;
    label.textContent = labelText;
    input.id = `settings-${name}`;
    input.name = name;
    input.type = type;
    input.value = value || "";
    input.required = Boolean(options.required);

    if (options.autocomplete) input.autocomplete = options.autocomplete;
    if (options.minLength) input.minLength = options.minLength;
    if (options.maxLength) input.maxLength = options.maxLength;

    wrapper.append(label);
    if (type === "password") {
        const passwordWrap = document.createElement("div");
        const toggle = document.createElement("button");

        passwordWrap.className = "settings-password-wrap";
        toggle.className = "settings-password-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-label", `Show ${labelText.toLowerCase()}`);
        toggle.setAttribute("aria-pressed", "false");
        toggle.addEventListener("click", () => {
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            toggle.classList.toggle("is-visible", isHidden);
            toggle.setAttribute("aria-label", `${isHidden ? "Hide" : "Show"} ${labelText.toLowerCase()}`);
            toggle.setAttribute("aria-pressed", String(isHidden));
            input.focus();
        });
        passwordWrap.append(input, toggle);
        wrapper.append(passwordWrap);
    } else {
        wrapper.append(input);
    }
    form.insertBefore(wrapper, form.querySelector(".settings-feedback"));
    return input;
}

function createForm(onSubmit) {
    const form = document.createElement("form");
    const feedback = document.createElement("p");
    const submit = document.createElement("button");

    form.className = "settings-form";
    feedback.className = "settings-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    submit.className = "settings-save";
    submit.type = "submit";
    submit.textContent = "Save changes";
    form.append(feedback, submit);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        onSubmit(form, feedback);
    });

    return { form, feedback, submit };
}

function createInformationCard(title, description) {
    const card = document.createElement("section");
    const heading = document.createElement("h3");
    const text = document.createElement("p");

    card.className = "settings-detail";
    heading.textContent = title;
    text.textContent = description;
    card.append(heading, text);
    return card;
}

function renderAccountSettings() {
    const { form } = createForm(async (currentForm, feedback) => {
        const name = currentForm.elements.displayName.value.trim();
        if (!/^(?=.{2,50}$)[A-Za-zÑñ\s]+$/u.test(name)) {
            setFeedback(feedback, "Enter a name between 2 and 50 letters.", true);
            return;
        }

        try {
            localStorage.setItem("midlink.profileName", name);
            const account = accountStore.getAccount();
            if (account) {
                account.name = name;
                accountStore.saveAccount(account);
            }
            applyDisplayName(name);
            setFeedback(feedback, "Your profile name was saved on this browser.", false);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not save your profile name.", true);
        }
    });
    createField(form, "Display name", "displayName", "text", displayName(), {
        required: true,
        minLength: 2,
        maxLength: 50
    });
    settingsDetails.replaceChildren(form);
}

function renderProfilePhotoSettings() {
    let selectedPhoto = "";
    const { form, feedback, submit } = createForm((currentForm, status) => {
        if (!selectedPhoto) {
            setFeedback(status, "Choose an image before saving.", true);
            return;
        }

        try {
            localStorage.setItem(profilePhotoStorageKey, selectedPhoto);
            applyDisplayPhoto(selectedPhoto);
            selectedPhoto = "";
            currentForm.elements.profilePhoto.value = "";
            setFeedback(status, "Your profile photo was saved on this browser.", false);
        } catch (error) {
            setFeedback(status, error.message || "Could not save your profile photo.", true);
        }
    });

    const preview = document.createElement("img");
    const previewWrapper = document.createElement("div");
    const fileWrapper = document.createElement("div");
    const fileLabel = document.createElement("label");
    const fileInput = document.createElement("input");
    const note = document.createElement("p");
    const removeButton = document.createElement("button");
    const existingImage = document.querySelector(".profile img, img.profile-picture");
    let savedPhoto = "";

    try {
        savedPhoto = localStorage.getItem(profilePhotoStorageKey) || "";
    } catch (error) {
        setFeedback(feedback, "Could not load the saved profile photo.", true);
    }

    preview.className = "profile-photo-preview";
    preview.alt = "Profile photo preview";
    preview.src = savedPhoto || (existingImage
        ? defaultProfilePhoto(existingImage)
        : new URL("anya.webp", appRoot).href);
    previewWrapper.className = "profile-photo-preview-wrapper";
    previewWrapper.append(preview);

    fileWrapper.className = "settings-field";
    fileLabel.htmlFor = "settings-profile-photo";
    fileLabel.textContent = "Choose a photo";
    fileInput.id = "settings-profile-photo";
    fileInput.name = "profilePhoto";
    fileInput.type = "file";
    fileInput.accept = allowedProfilePhotoTypes.join(",");
    fileWrapper.append(fileLabel, fileInput);

    note.className = "settings-note";
    note.textContent = "Use a PNG, JPEG, WebP, or GIF image up to 1 MB. The photo is saved only in this browser.";

    removeButton.className = "settings-save settings-secondary";
    removeButton.type = "button";
    removeButton.textContent = "Remove photo";
    removeButton.addEventListener("click", () => {
        try {
            localStorage.removeItem(profilePhotoStorageKey);
            selectedPhoto = "";
            fileInput.value = "";
            preview.src = existingImage
                ? defaultProfilePhoto(existingImage)
                : new URL("anya.webp", appRoot).href;
            applyDisplayPhoto(null);
            setFeedback(feedback, "The default profile photo was restored.", false);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not remove your profile photo.", true);
        }
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        if (!allowedProfilePhotoTypes.includes(file.type)) {
            fileInput.value = "";
            setFeedback(feedback, "Choose a PNG, JPEG, WebP, or GIF image.", true);
            return;
        }
        if (file.size > maximumProfilePhotoSize) {
            fileInput.value = "";
            setFeedback(feedback, "Choose an image smaller than 1 MB.", true);
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            if (typeof reader.result !== "string") {
                setFeedback(feedback, "Could not read the selected image.", true);
                return;
            }
            selectedPhoto = reader.result;
            preview.src = selectedPhoto;
            setFeedback(feedback, "Photo preview ready. Save changes to use it on your profile.", false);
        });
        reader.addEventListener("error", () => {
            setFeedback(feedback, "Could not read the selected image.", true);
        });
        try {
            reader.readAsDataURL(file);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not read the selected image.", true);
        }
    });

    form.insertBefore(previewWrapper, form.querySelector(".settings-feedback"));
    form.insertBefore(fileWrapper, form.querySelector(".settings-feedback"));
    form.insertBefore(note, form.querySelector(".settings-feedback"));
    form.insertBefore(removeButton, form.querySelector(".settings-feedback"));
    submit.textContent = "Save photo";
    settingsDetails.replaceChildren(form);
}

function renderSecuritySettings() {
    let account;
    try {
        account = accountStore.getAccount();
    } catch (error) {
        settingsDetails.replaceChildren(createInformationCard("Saved account error", error.message));
        return;
    }

    const hasPassword = Boolean(account && account.passwordSalt && account.passwordHash);
    const { form } = createForm(async (currentForm, feedback) => {
        const currentPassword = currentForm.elements.currentPassword
            ? currentForm.elements.currentPassword.value
            : "";
        const newPassword = currentForm.elements.newPassword.value;
        const confirmPassword = currentForm.elements.confirmPassword.value;

        if (newPassword.length < 8 || newPassword.length > 64) {
            setFeedback(feedback, "The new password must be between 8 and 64 characters.", true);
            return;
        }
        if (newPassword !== confirmPassword) {
            setFeedback(feedback, "The new passwords do not match.", true);
            return;
        }

        try {
            const savedAccount = accountStore.getAccount() || {
                name: displayName(),
                email: "",
                phone: "",
                passwordSalt: "",
                passwordHash: ""
            };
            if (savedAccount.passwordHash
                && !await accountStore.verifyPassword(currentPassword, savedAccount)) {
                setFeedback(feedback, "Your current password is incorrect.", true);
                return;
            }

            const credential = await accountStore.createPasswordCredential(newPassword);
            Object.assign(savedAccount, credential);
            accountStore.saveAccount(savedAccount);
            currentForm.reset();
            setFeedback(feedback, "Your demo password was saved on this browser. It is not connected to server login yet.", false);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not update your password.", true);
        }
    });

    createField(form, "Current password", "currentPassword", "password", "", {
        required: hasPassword,
        autocomplete: "current-password"
    });
    createField(form, "New password", "newPassword", "password", "", {
        required: true,
        minLength: 8,
        maxLength: 64,
        autocomplete: "new-password"
    });
    createField(form, "Confirm new password", "confirmPassword", "password", "", {
        required: true,
        minLength: 8,
        maxLength: 64,
        autocomplete: "new-password"
    });

    if (!hasPassword) {
        form.insertBefore(
            createInformationCard("First setup", "You can set a password here; future changes will require the current password."),
            form.firstChild
        );
    }
    settingsDetails.replaceChildren(form);
}

function renderNotifications() {
    const choices = [
        ["deals", "Deal updates"],
        ["messages", "New messages"],
        ["account", "Account and security alerts"]
    ];
    const { form } = createForm((currentForm, feedback) => {
        try {
            choices.forEach(([key]) => {
                localStorage.setItem(`midlink.notifications.${key}`, String(currentForm.elements[key].checked));
            });
            setFeedback(feedback, "Notification preferences were saved on this browser.", false);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not save notification preferences.", true);
        }
    });

    choices.forEach(([key, labelText]) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = key;
        input.checked = localStorage.getItem(`midlink.notifications.${key}`) !== "false";
        label.className = "settings-check";
        label.append(input, document.createTextNode(labelText));
        form.insertBefore(label, form.querySelector(".settings-feedback"));
    });
    settingsDetails.replaceChildren(form);
}

function renderAppearance() {
    const { form } = createForm((currentForm, feedback) => {
        const theme = currentForm.elements.theme.value;
        try {
            localStorage.setItem("midlink.theme", theme);
            document.body.classList.toggle("theme-dark", theme === "dark");
            setFeedback(feedback, "Appearance was saved on this browser.", false);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not save appearance.", true);
        }
    });
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    const select = document.createElement("select");
    const selectedTheme = localStorage.getItem("midlink.theme") || "pink";

    wrapper.className = "settings-field";
    label.htmlFor = "settings-theme";
    label.textContent = "Color theme";
    select.id = "settings-theme";
    select.name = "theme";
    [["pink", "MidLink pink"], ["dark", "Dark"]].forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        option.selected = selectedTheme === value;
        select.append(option);
    });
    wrapper.append(label, select);
    form.insertBefore(wrapper, form.querySelector(".settings-feedback"));
    settingsDetails.replaceChildren(form);
}

function renderLanguage() {
    const { form } = createForm((currentForm, feedback) => {
        const language = currentForm.elements.language.value;
        try {
            localStorage.setItem("midlink.language", language);
            document.documentElement.lang = language;
            setFeedback(feedback, "Language preference was saved on this browser.", false);
        } catch (error) {
            setFeedback(feedback, error.message || "Could not save language preference.", true);
        }
    });
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    const select = document.createElement("select");
    const selectedLanguage = localStorage.getItem("midlink.language") || "en";

    wrapper.className = "settings-field";
    label.htmlFor = "settings-language";
    label.textContent = "Preferred language";
    select.id = "settings-language";
    select.name = "language";
    [["en", "English"], ["fil", "Filipino"]].forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        option.selected = selectedLanguage === value;
        select.append(option);
    });
    wrapper.append(label, select);
    form.insertBefore(wrapper, form.querySelector(".settings-feedback"));
    settingsDetails.replaceChildren(form);
}

function renderFamilyCenter() {
    const panel = document.createElement("div");
    const note = document.createElement("p");
    const status = document.createElement("p");
    const actions = document.createElement("div");
    const passwordForm = document.createElement("form");
    const passwordWrapper = document.createElement("div");
    const passwordLabel = document.createElement("label");
    const passwordInput = document.createElement("input");
    const disableButton = document.createElement("button");
    const deleteButton = document.createElement("button");
    const passwordSubmit = document.createElement("button");
    const cancelButton = document.createElement("button");
    const feedback = document.createElement("p");
    let pendingAction = "";

    panel.className = "settings-family-actions";
    note.className = "settings-note";
    note.textContent = "This removes the account information and preferences saved in this browser. Server-side account deletion needs a database connection.";
    status.className = "settings-detail";
    actions.className = "settings-family-actions";
    passwordForm.className = "settings-form";
    passwordForm.hidden = true;
    passwordWrapper.className = "settings-field";
    passwordLabel.htmlFor = "settings-family-password";
    passwordLabel.textContent = "Current password";
    passwordInput.id = "settings-family-password";
    passwordInput.type = "password";
    passwordInput.autocomplete = "current-password";
    passwordInput.required = true;
    passwordWrapper.append(passwordLabel, passwordInput);
    disableButton.className = "settings-save";
    disableButton.type = "button";
    deleteButton.className = "settings-save settings-danger";
    deleteButton.type = "button";
    passwordSubmit.className = "settings-save";
    passwordSubmit.type = "submit";
    cancelButton.className = "settings-save";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    feedback.className = "settings-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    passwordForm.append(passwordWrapper, feedback, passwordSubmit, cancelButton);

    const verifyPassword = async () => {
        try {
            const account = accountStore.getAccount();
            if (!account || !account.passwordSalt || !account.passwordHash) {
                setFeedback(feedback, "Set a password in Password and Security before continuing.", true);
                return false;
            }
            if (!passwordInput.value
                || !await accountStore.verifyPassword(passwordInput.value, account)) {
                setFeedback(feedback, "Enter the correct current password.", true);
                return false;
            }
            setFeedback(feedback, "", false);
            return true;
        } catch (error) {
            setFeedback(feedback, error.message || "Could not verify your password.", true);
            return false;
        }
    };

    const updateStatus = () => {
        const isDisabled = localStorage.getItem("midlink.accountDisabled") === "true";
        status.textContent = isDisabled ? "Account status: Disabled" : "Account status: Active";
        disableButton.textContent = isDisabled ? "Re-enable account" : "Disable account";
    };

    const requestPassword = (action) => {
        pendingAction = action;
        passwordInput.value = "";
        passwordSubmit.textContent = action === "delete" ? "Confirm account deletion" : "Confirm account action";
        setFeedback(feedback, "", false);
        passwordForm.hidden = false;
        disableButton.disabled = true;
        deleteButton.disabled = true;
        passwordInput.focus();
    };

    disableButton.addEventListener("click", () => requestPassword("disable"));
    deleteButton.addEventListener("click", () => requestPassword("delete"));

    cancelButton.addEventListener("click", () => {
        pendingAction = "";
        passwordInput.value = "";
        passwordForm.hidden = true;
        disableButton.disabled = false;
        deleteButton.disabled = false;
    });

    passwordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!await verifyPassword()) return;

        if (pendingAction === "disable") {
            const isDisabled = localStorage.getItem("midlink.accountDisabled") === "true";
            if (isDisabled) {
                localStorage.removeItem("midlink.accountDisabled");
                passwordInput.value = "";
                passwordForm.hidden = true;
                disableButton.disabled = false;
                deleteButton.disabled = false;
                updateStatus();
                return;
            }
            if (!window.confirm("Disable this account in this browser? You can re-enable it from the login page.")) return;

            try {
                localStorage.setItem("midlink.accountDisabled", "true");
                window.location.assign(new URL("index.html", appRoot).href);
            } catch (error) {
                setFeedback(feedback, error.message || "Could not disable the account.", true);
            }
            return;
        }

        if (pendingAction !== "delete") return;
        const confirmed = window.confirm("Permanently delete the account information saved in this browser? This cannot be undone.");
        if (!confirmed) return;

        try {
            [
                "midlink.profileName",
                profilePhotoStorageKey,
                "midlink.account.v1",
                "midlink.accountDisabled",
                "midlink.theme",
                "midlink.language",
                "midlink.notifications.deals",
                "midlink.notifications.messages",
                "midlink.notifications.account"
            ].forEach((key) => localStorage.removeItem(key));
            applyDisplayName("Anya Forger");
            applyDisplayPhoto(null);
            document.body.classList.remove("theme-dark");
            document.documentElement.lang = "en";
            setFeedback(feedback, "Account information and preferences saved in this browser have been deleted.", false);
            passwordInput.value = "";
            passwordForm.hidden = true;
            disableButton.disabled = true;
            deleteButton.disabled = true;
        } catch (error) {
            setFeedback(feedback, error.message || "Could not delete the saved account information.", true);
        }
    });

    deleteButton.textContent = "Delete Account";
    actions.append(disableButton, deleteButton);
    panel.append(status, note, actions, passwordForm);
    updateStatus();
    settingsDetails.replaceChildren(panel);
}

function renderHelp() {
    const panel = document.createElement("div");
    const faq = document.createElement("div");
    const faqItems = [
        ["How do I keep a deal safe?", "Keep deal details and messages on MidLink, verify the other party, and follow the platform rules."],
        ["What if a payment or deal is delayed?", "Gather the deal details and use the contact form below to prepare a support request."],
        ["How do I change my profile name?", "Open Account info in this settings menu, edit your display name, and save it."]
    ];

    panel.className = "settings-help";
    faq.className = "settings-help-faq";
    faqItems.forEach(([question, answer]) => {
        const item = document.createElement("details");
        const summary = document.createElement("summary");
        const text = document.createElement("p");

        summary.textContent = question;
        text.textContent = answer;
        item.append(summary, text);
        faq.append(item);
    });

    const { form, feedback, submit } = createForm((currentForm, status) => {
        if (!currentForm.reportValidity()) return;

        const formData = new FormData(currentForm);
        const subject = `[MidLink Help] ${formData.get("topic")}`;
        const body = [
            `Name: ${formData.get("name")}`,
            `Email: ${formData.get("email")}`,
            "",
            String(formData.get("message"))
        ].join("\n");
        const query = new URLSearchParams({ subject, body });

        setFeedback(status, "Email draft opened. Add the official MidLink support email address before sending.", false);
        window.location.href = `mailto:?${query.toString()}`;
    });
    form.classList.add("settings-help-form");
    submit.textContent = "Prepare support email";
    createField(form, "Your name", "name", "text", displayName(), {
        required: true,
        maxLength: 50
    });
    createField(form, "Your email", "email", "email", "", {
        required: true,
        autocomplete: "email"
    });
    createField(form, "Issue", "topic", "text", "", {
        required: true,
        maxLength: 100
    });

    const messageWrapper = document.createElement("div");
    const messageLabel = document.createElement("label");
    const messageInput = document.createElement("textarea");
    messageWrapper.className = "settings-field";
    messageLabel.htmlFor = "settings-help-message";
    messageLabel.textContent = "How can we help?";
    messageInput.id = "settings-help-message";
    messageInput.name = "message";
    messageInput.rows = 4;
    messageInput.maxLength = 1500;
    messageInput.required = true;
    messageWrapper.append(messageLabel, messageInput);
    form.insertBefore(messageWrapper, feedback);

    const note = document.createElement("p");
    note.className = "settings-note";
    note.textContent = "This menu prepares an email draft; it does not connect to the dashboard Support page or send data to a server.";
    panel.append(faq, form, note);
    settingsDetails.replaceChildren(panel);
}

function renderSetting(setting) {
    const [title, description] = settingLabels[setting];
    dialogTitle.textContent = title;
    dialogDescription.textContent = description;

    const renderers = {
        account: renderAccountSettings,
        profilePhoto: renderProfilePhotoSettings,
        security: renderSecuritySettings,
        notifications: renderNotifications,
        appearance: renderAppearance,
        language: renderLanguage,
        family: renderFamilyCenter,
        help: renderHelp
    };

    renderers[setting]();
}

applyDisplayPhoto();

if (accountStore) {
    applyDisplayName(displayName());

    const savedTheme = localStorage.getItem("midlink.theme");
    document.body.classList.toggle("theme-dark", savedTheme === "dark");
    const savedLanguage = localStorage.getItem("midlink.language");
    if (savedLanguage) document.documentElement.lang = savedLanguage;
}

document.querySelectorAll("[data-setting]").forEach((button) => {
    button.addEventListener("click", () => {
        const setting = button.dataset.setting;
        if (!settingLabels[setting] || !settingsDialog || !dialogTitle || !dialogDescription || !settingsDetails) return;

        renderSetting(setting);
        settingsDialog.showModal();
    });
});
