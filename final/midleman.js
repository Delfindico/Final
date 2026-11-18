const coinButtons = document.querySelectorAll(".coin-start");
const coinStatus = document.getElementById("coin-status");
const currentTicketStorageKey = "midlink.currentMiddlemanTicket.v1";

coinButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const { coin, network } = button.dataset;
        const ticketId = `${coin}-#${Math.floor(10000 + Math.random() * 90000)}`;
        const ticket = {
            id: ticketId,
            coin,
            network,
            createdAt: new Date().toISOString(),
            status: "open"
        };

        try {
            window.localStorage.setItem(currentTicketStorageKey, JSON.stringify(ticket));
        } catch (error) {
            coinStatus.textContent = "The ticket could not be created because browser storage is unavailable.";
            return;
        }

        const query = new URLSearchParams({ coin, network, ticketId });
        window.location.href = `middleman-ticket.html?${query.toString()}`;
    });
});