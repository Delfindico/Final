(function () {
    const storageKey = "midlink.supportTickets.v3";
    const previousStorageKey = "midlink.supportTickets.v2";

    function isTicket(ticket) {
        return Boolean(
            ticket
            && typeof ticket.id === "string"
            && /^Support-\d{4,5}$/.test(ticket.id)
            && typeof ticket.createdAt === "string"
            && ["Open", "Closed"].includes(ticket.status)
            && (
                ticket.details === undefined
                || ticket.details === null
                || (
                    typeof ticket.details.name === "string"
                    && typeof ticket.details.email === "string"
                    && typeof ticket.details.topic === "string"
                    && typeof ticket.details.description === "string"
                )
            )
            && Array.isArray(ticket.messages)
            && ticket.messages.every((message) => (
                message
                && typeof message.author === "string"
                && typeof message.text === "string"
                && typeof message.createdAt === "string"
            ))
        );
    }

    function parseTickets(savedTickets) {
        let tickets;
        try {
            tickets = JSON.parse(savedTickets);
        } catch {
            throw new Error("Saved support tickets are invalid. Clear this site's saved data and try again.");
        }

        if (!Array.isArray(tickets) || !tickets.every(isTicket)) {
            throw new Error("Saved support ticket data has an unexpected format.");
        }
        return tickets;
    }

    function getAll() {
        const savedTickets = localStorage.getItem(storageKey);
        if (savedTickets) return parseTickets(savedTickets);

        const previousTickets = localStorage.getItem(previousStorageKey);
        if (!previousTickets) return [];

        const migratedTickets = parseTickets(previousTickets)
            .filter((ticket) => ticket.id !== "Support-74300");
        save(migratedTickets);
        return migratedTickets;
    }

    function save(tickets) {
        if (!Array.isArray(tickets) || !tickets.every(isTicket)) {
            throw new Error("The support ticket data is invalid.");
        }
        localStorage.setItem(storageKey, JSON.stringify(tickets));
    }

    function createId(tickets) {
        let number = Math.floor(Math.random() * 90000) + 10000;
        let attempts = 0;
        while (tickets.some((ticket) => ticket.id === `Support-${number}`)) {
            number = number === 99999 ? 10000 : number + 1;
            attempts += 1;
            if (attempts >= 90000) throw new Error("No ticket IDs are available.");
        }
        return `Support-${number}`;
    }

    function create() {
        const tickets = getAll();
        const ticket = {
            id: createId(tickets),
            createdAt: new Date().toISOString(),
            status: "Open",
            details: null,
            messages: []
        };
        save([ticket, ...tickets]);
        return ticket;
    }

    function get(ticketId) {
        return getAll().find((ticket) => ticket.id === ticketId) || null;
    }

    function addMessage(ticketId, text, author) {
        const tickets = getAll();
        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) throw new Error("That ticket could not be found.");
        if (ticket.status !== "Open") throw new Error("This ticket is closed.");

        const message = {
            author: String(author).trim() || "You",
            text: String(text).trim(),
            createdAt: new Date().toISOString()
        };
        if (!message.text || message.text.length > 2000) {
            throw new Error("Messages must contain 1 to 2000 characters.");
        }

        ticket.messages.push(message);
        save(tickets);
        return ticket;
    }

    function submitDetails(ticketId, details) {
        const tickets = getAll();
        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) throw new Error("That ticket could not be found.");
        if (ticket.status !== "Open") throw new Error("This ticket is closed.");
        if (ticket.details) throw new Error("Ticket details have already been submitted.");

        const submittedDetails = {
            name: String(details.name || "").trim(),
            email: String(details.email || "").trim(),
            topic: String(details.topic || "").trim(),
            description: String(details.description || "").trim()
        };
        if (!submittedDetails.name || submittedDetails.name.length > 50) {
            throw new Error("Enter a name between 1 and 50 characters.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedDetails.email)) {
            throw new Error("Enter a valid email address.");
        }
        if (!submittedDetails.topic || submittedDetails.topic.length > 100) {
            throw new Error("Choose an issue type.");
        }
        if (!submittedDetails.description || submittedDetails.description.length > 2000) {
            throw new Error("Describe your issue in 1 to 2000 characters.");
        }

        ticket.details = submittedDetails;
        save(tickets);
        return ticket;
    }

    function close(ticketId) {
        const tickets = getAll();
        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) throw new Error("That ticket could not be found.");
        if (ticket.status === "Closed") return ticket;

        ticket.status = "Closed";
        save(tickets);
        return ticket;
    }

    window.MidLinkSupportTickets = Object.freeze({
        getAll,
        create,
        get,
        addMessage,
        submitDetails,
        close
    });
})();
