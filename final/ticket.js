const supportStore = window.MidLinkSupportTickets;
const ticketId = new URLSearchParams(window.location.search).get("ticket");
const ticketTitle = document.getElementById("ticket-title");
const ticketOpenStatus = document.getElementById("ticket-open-status");
const ticketDetailsForm = document.getElementById("ticket-details-form");
const ticketNameInput = document.getElementById("ticket-name");
const ticketDetailsSummary = document.getElementById("ticket-details-summary");
const ticketSummaryName = document.getElementById("ticket-summary-name");
const ticketSummaryEmail = document.getElementById("ticket-summary-email");
const ticketSummaryTopic = document.getElementById("ticket-summary-topic");
const ticketSummaryDescription = document.getElementById("ticket-summary-description");
const ticketMessages = document.getElementById("ticket-messages");
const ticketComposer = document.getElementById("ticket-composer");
const ticketMessageInput = document.getElementById("ticket-message");
const sendTicketMessage = document.getElementById("send-ticket-message");
const closeTicketButton = document.getElementById("close-ticket");
const ticketStatus = document.getElementById("ticket-status");
const storedName = localStorage.getItem("midlink.profileName");

if (storedName) ticketNameInput.value = storedName;

function renderMessages(ticket) {
    ticketMessages.replaceChildren();

    if (!ticket.messages.length) {
        const empty = document.createElement("p");
        empty.className = "ticket-empty-message";
        empty.textContent = "Your ticket is open. Add a message if you need to provide more information.";
        ticketMessages.append(empty);
        return;
    }

    ticket.messages.forEach((message) => {
        const item = document.createElement("article");
        const header = document.createElement("header");
        const author = document.createElement("strong");
        const timestamp = document.createElement("time");
        const text = document.createElement("p");

        item.className = "ticket-message";
        author.textContent = message.author;
        timestamp.dateTime = message.createdAt;
        timestamp.textContent = new Date(message.createdAt).toLocaleString();
        text.textContent = message.text;
        header.append(author, timestamp);
        item.append(header, text);
        ticketMessages.append(item);
    });
    ticketMessages.scrollTop = ticketMessages.scrollHeight;
}

function renderTicket(ticket) {
    ticketTitle.textContent = ticket.id;
    ticketOpenStatus.textContent = ticket.status;
    ticketOpenStatus.classList.toggle("is-closed", ticket.status === "Closed");
    closeTicketButton.disabled = ticket.status === "Closed";
    closeTicketButton.textContent = ticket.status === "Closed" ? "Ticket closed" : "Close ticket";

    const hasDetails = Boolean(ticket.details);
    ticketDetailsForm.hidden = hasDetails || ticket.status === "Closed";
    ticketDetailsSummary.hidden = !hasDetails;
    ticketMessages.hidden = !hasDetails;
    ticketComposer.hidden = !hasDetails || ticket.status === "Closed";
    ticketMessageInput.disabled = ticket.status === "Closed";
    sendTicketMessage.disabled = ticket.status === "Closed";

    if (hasDetails) {
        ticketSummaryName.textContent = `Name: ${ticket.details.name}`;
        ticketSummaryEmail.textContent = `Email: ${ticket.details.email}`;
        ticketSummaryTopic.textContent = `Issue: ${ticket.details.topic}`;
        ticketSummaryDescription.textContent = `Details: ${ticket.details.description}`;
        renderMessages(ticket);
    }
}

function sendMessage() {
    const text = ticketMessageInput.value.trim();
    if (!text) {
        ticketStatus.textContent = "Write a message before sending.";
        ticketMessageInput.focus();
        return;
    }

    try {
        const ticket = supportStore.addMessage(ticketId, text, storedName || "You");
        renderTicket(ticket);
        ticketMessageInput.value = "";
        ticketStatus.textContent = "Message saved. The message box has been cleared.";
        ticketMessageInput.focus();
    } catch (error) {
        ticketStatus.textContent = error.message || "Could not send this message.";
    }
}

ticketDetailsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!ticketDetailsForm.reportValidity()) return;

    const formData = new FormData(ticketDetailsForm);
    try {
        const ticket = supportStore.submitDetails(ticketId, {
            name: formData.get("name"),
            email: formData.get("email"),
            topic: formData.get("topic"),
            description: formData.get("description")
        });
        ticketDetailsForm.reset();
        renderTicket(ticket);
        ticketStatus.textContent = "Ticket details submitted. The form has been cleared.";
    } catch (error) {
        ticketStatus.textContent = error.message || "Could not submit ticket details.";
    }
});

closeTicketButton.addEventListener("click", () => {
    if (!window.confirm("Close this ticket? You won’t be able to send more messages.")) return;

    try {
        const ticket = supportStore.close(ticketId);
        renderTicket(ticket);
        ticketStatus.textContent = "Ticket closed.";
    } catch (error) {
        ticketStatus.textContent = error.message || "Could not close this ticket.";
    }
});

try {
    const ticket = ticketId && supportStore.get(ticketId);
    if (!ticket) {
        ticketTitle.textContent = "Ticket not found";
        ticketOpenStatus.textContent = "Unavailable";
        ticketDetailsForm.hidden = true;
        ticketMessageInput.disabled = true;
        sendTicketMessage.disabled = true;
        closeTicketButton.disabled = true;
        ticketStatus.textContent = "This support ticket does not exist in this browser.";
    } else {
        renderTicket(ticket);
    }
} catch (error) {
    ticketTitle.textContent = "Ticket unavailable";
    ticketDetailsForm.hidden = true;
    ticketMessageInput.disabled = true;
    sendTicketMessage.disabled = true;
    closeTicketButton.disabled = true;
    ticketStatus.textContent = error.message || "Could not load this support ticket.";
}

sendTicketMessage.addEventListener("click", sendMessage);
ticketMessageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        sendMessage();
    }
});
