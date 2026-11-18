const supportStore = window.MidLinkSupportTickets;
const openTicketButton = document.getElementById("open-ticket-button");
const supportStatus = document.getElementById("support-page-status");
const latestTicketLink = document.getElementById("latest-ticket-link");

function getTicketUrl(ticketId) {
    return `ticket.html?ticket=${encodeURIComponent(ticketId)}`;
}

try {
    const latestTicket = supportStore.getAll()[0];
    if (latestTicket) {
        latestTicketLink.href = getTicketUrl(latestTicket.id);
        latestTicketLink.textContent = latestTicket.id;
    }
} catch (error) {
    supportStatus.textContent = error.message || "Could not load the latest support ticket.";
}

openTicketButton.addEventListener("click", () => {
    try {
        const ticket = supportStore.create();
        window.location.assign(getTicketUrl(ticket.id));
    } catch (error) {
        supportStatus.textContent = error.message || "Could not open a support ticket.";
    }
});
