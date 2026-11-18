const feedbackForm = document.getElementById("feedback-form");
const openFeedbackButton = document.getElementById("open-feedback");
const cancelFeedbackButton = document.getElementById("cancel-feedback");
const reviewList = document.getElementById("review-list");
const feedbackStatus = document.getElementById("feedback-status");
const feedbackNameInput = document.getElementById("feedback-name");
const profileName = document.querySelector(".profile-name").textContent.trim();

feedbackNameInput.value = profileName;

function setFormOpen(isOpen) {
    feedbackForm.hidden = !isOpen;
    openFeedbackButton.setAttribute("aria-expanded", String(isOpen));
    openFeedbackButton.textContent = isOpen ? "Close feedback form" : "Give feed back";

    if (isOpen) {
        document.getElementById("feedback-name").focus();
    } else {
        openFeedbackButton.focus();
    }
}

openFeedbackButton.addEventListener("click", () => {
    setFormOpen(feedbackForm.hidden);
});

cancelFeedbackButton.addEventListener("click", () => {
    feedbackForm.reset();
    feedbackNameInput.value = profileName;
    setFormOpen(false);
});

feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!feedbackForm.reportValidity()) return;

    const formData = new FormData(feedbackForm);
    const name = String(formData.get("name")).trim();
    const message = String(formData.get("message")).trim();
    const rating = Number(formData.get("rating"));
    if (!name || !message || rating < 1 || rating > 5) return;

    const review = document.createElement("article");
    review.className = "review";

    const avatar = document.createElement("span");
    avatar.className = "review-avatar review-avatar--fox";
    avatar.setAttribute("aria-hidden", "true");
    const avatarImage = document.createElement("img");
    avatarImage.src = "anya.webp";
    avatarImage.alt = "";
    avatar.append(avatarImage);

    const card = document.createElement("div");
    card.className = "review-card review-card--long";

    const ratingLabel = document.createElement("span");
    ratingLabel.className = "review-rating";
    ratingLabel.setAttribute("aria-label", `${rating} out of 5 stars`);
    ratingLabel.textContent = ["😞", "🙁", "😐", "😊", "😍"][rating - 1];

    const content = document.createElement("p");
    content.textContent = `${name}: ${message}`;
    card.append(ratingLabel, content);
    review.append(avatar, card);
    reviewList.append(review);

    feedbackForm.reset();
    feedbackNameInput.value = profileName;
    feedbackStatus.textContent = "Thanks for sharing your feedback!";
    setFormOpen(false);
});