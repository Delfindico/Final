const dealQuery = new URLSearchParams(window.location.search);
const dealTicketId = dealQuery.get("ticketId") || "";
const dealStorageKey = "midlink.currentMiddlemanTicket.v1";
const completedDealsStorageKey = "midlink.completedMiddlemanDeals.v1";
const dealTitle = document.getElementById("deal-room-title");
const participantLabel = document.getElementById("deal-room-participants");
const amountCoin = document.getElementById("amount-coin");
const amountForm = document.getElementById("amount-form");
const amountInput = document.getElementById("deal-amount");
const amountStatus = document.getElementById("amount-status");
const confirmOtherButton = document.getElementById("confirm-other");
const beginDemoButton = document.getElementById("begin-demo");
const paymentSteps = document.getElementById("demo-payment-steps");
const paymentStatus = document.getElementById("demo-payment-status");
const simulatePaymentButton = document.getElementById("simulate-payment");
const simulateReceiptButton = document.getElementById("simulate-receipt");
const doneDealButton = document.getElementById("done-deal");
const roomStatus = document.getElementById("deal-room-status");
const paymentInstruction = document.getElementById("payment-instruction");
const roleButtons = document.querySelectorAll("[data-role]");
let activeTicket;
let ticketStorageError = false;

try {
    const storedTicket = window.localStorage.getItem(dealStorageKey);
    if (storedTicket) {
        try {
            activeTicket = JSON.parse(storedTicket);
        } catch (error) {
            ticketStorageError = true;
        }
    }
} catch (error) {
    ticketStorageError = true;
}

const isValidDeal = activeTicket
    && activeTicket.id === dealTicketId
    && /^(BTC|USDT|SOLANA|ETH)-#\d{5}$/.test(dealTicketId)
    && activeTicket.status === "in-progress"
    && typeof activeTicket.member === "string"
    && activeTicket.member.length > 0;

function showRoomStatus(message, isError) {
    roomStatus.textContent = message;
    roomStatus.dataset.error = String(isError);
}

function saveTicket(updates) {
    const updatedTicket = { ...activeTicket, ...updates };
    try {
        window.localStorage.setItem(dealStorageKey, JSON.stringify(updatedTicket));
    } catch (error) {
        showRoomStatus("This deal step could not be saved in browser storage.", true);
        return false;
    }

    activeTicket = updatedTicket;
    return true;
}

function readConfirmations() {
    const saved = activeTicket.confirmations || {};
    return {
        sender: saved.sender === true,
        receiver: saved.receiver === true
    };
}

function renderDealState() {
    const stage = activeTicket.demoStage || "confirm-amount";
    const confirmations = readConfirmations();
    const amount = activeTicket.amount || "";
    const role = activeTicket.demoRole || "";
    const stageNeedsAmount = stage === "confirm-amount" || stage === "confirm-other";

    amountForm.hidden = !stageNeedsAmount;
    amountInput.disabled = stage !== "confirm-amount";
    amountInput.value = amount;
    roleButtons.forEach((button) => {
        button.disabled = stage !== "confirm-amount";
        button.setAttribute("aria-pressed", String(button.dataset.role === role));
    });
    document.getElementById("reset-role").disabled = stage !== "confirm-amount";
    confirmOtherButton.hidden = stage !== "confirm-other";
    beginDemoButton.hidden = stage !== "payment-ready";
    paymentSteps.hidden = !["sender-payment", "receiver-confirm", "complete"].includes(stage);
    simulatePaymentButton.hidden = stage !== "sender-payment";
    simulateReceiptButton.hidden = stage !== "receiver-confirm";
    doneDealButton.hidden = stage !== "complete";

    if (stage === "confirm-amount") {
        document.getElementById("confirm-amount").disabled = !role;
        amountStatus.textContent = role
            ? `You selected ${role}. Enter the agreed amount and confirm.`
            : "Select Sender or Receiver before confirming the amount.";
        paymentStatus.textContent = "";
        paymentInstruction.textContent = "After both confirmations, continue to the simulated payment steps.";
    } else if (stage === "confirm-other") {
        document.getElementById("confirm-amount").disabled = true;
        const otherRole = role === "sender" ? "receiver" : "sender";
        amountStatus.textContent = `${role} confirmed ${amount} ${activeTicket.coin}. Simulate ${otherRole}'s confirmation to continue.`;
        paymentStatus.textContent = "";
    } else if (stage === "payment-ready") {
        document.getElementById("confirm-amount").disabled = true;
        amountStatus.textContent = `Both roles confirmed ${amount} ${activeTicket.coin} in this local flow.`;
        paymentInstruction.textContent = `Agreed amount: ${amount} ${activeTicket.coin}. Continue only through a verified service in a real transaction.`;
        paymentStatus.textContent = "";
    } else if (stage === "sender-payment") {
        amountStatus.textContent = "Deal amount confirmed.";
        paymentInstruction.textContent = "Middleman instruction: this page has no wallet connection, payment address, or real transfer.";
        paymentStatus.textContent = "Flow ready. Mark the sender payment step as simulated.";
    } else if (stage === "receiver-confirm") {
        amountStatus.textContent = "Deal amount confirmed.";
        paymentStatus.textContent = "Sender payment step simulated. The receiver can now confirm receipt in this flow.";
    } else {
        amountStatus.textContent = "Deal amount confirmed.";
        paymentStatus.textContent = "Deal complete. No real cryptocurrency was sent or received.";
    }

    if (stage === "confirm-other" && confirmations[role === "sender" ? "sender" : "receiver"]) {
        const otherRole = role === "sender" ? "receiver" : "sender";
        confirmOtherButton.textContent = `Simulate ${otherRole} confirmation`;
    }
}

function closeDealTicket() {
    try {
        window.localStorage.removeItem(dealStorageKey);
    } catch (error) {
        showRoomStatus("The ticket could not be closed because browser storage is unavailable.", true);
        return;
    }
    window.location.assign("midleman.html");
}

function completeDeal() {
    doneDealButton.disabled = true;

    let completedDeals = [];
    let storedDeals;
    try {
        storedDeals = window.localStorage.getItem(completedDealsStorageKey);
    } catch (error) {
        showRoomStatus("The completed deal could not be saved because browser storage is unavailable.", true);
        doneDealButton.disabled = false;
        return;
    }

    if (storedDeals) {
        try {
            completedDeals = JSON.parse(storedDeals);
        } catch (error) {
            showRoomStatus("Completed deal history is invalid, so this deal was not added.", true);
            doneDealButton.disabled = false;
            return;
        }

        if (!Array.isArray(completedDeals)) {
            showRoomStatus("Completed deal history is invalid, so this deal was not added.", true);
            doneDealButton.disabled = false;
            return;
        }
    }

    if (!completedDeals.some((deal) => deal && deal.id === activeTicket.id)) {
        const sender = activeTicket.demoRole === "sender" ? "You" : activeTicket.member;
        const receiver = activeTicket.demoRole === "receiver" ? "You" : activeTicket.member;
        const completedDeal = {
            id: activeTicket.id,
            coin: activeTicket.coin,
            title: `${activeTicket.coin} Deal Complete`,
            completedAt: new Date().toISOString(),
            amount: `${activeTicket.amount} ${activeTicket.coin}`,
            sender,
            receiver
        };

        try {
            window.localStorage.setItem(
                completedDealsStorageKey,
                JSON.stringify([...completedDeals, completedDeal])
            );
        } catch (error) {
            showRoomStatus("The completed deal could not be saved in this browser. Please try again.", true);
            doneDealButton.disabled = false;
            return;
        }
    }

    try {
        window.localStorage.removeItem(dealStorageKey);
    } catch (error) {
        showRoomStatus("The deal was saved, but its active ticket could not be cleared.", true);
        doneDealButton.disabled = false;
        return;
    }

    window.location.assign("completed.html");
}

document.getElementById("close-deal").addEventListener("click", closeDealTicket);
doneDealButton.addEventListener("click", completeDeal);

if (!isValidDeal) {
    dealTitle.textContent = "Ticket unavailable";
    participantLabel.textContent = "";
    document.querySelectorAll(".deal-room-card button, .deal-room-card input").forEach((control) => {
        if (control.id !== "close-deal") control.disabled = true;
    });
    showRoomStatus(ticketStorageError
        ? "The deal ticket could not be loaded. Return to coin selection and open a new ticket."
        : "This deal ticket is missing or closed. Return to coin selection to start again.", true);
} else {
    const displayId = `#${activeTicket.id.replace("-#", "-")}`;
    dealTitle.textContent = displayId;
    document.title = `${displayId} | MidLink Deal Room`;
    participantLabel.textContent = `Three participants: you, ${activeTicket.member}, and the MidLink middleman`;
    amountCoin.textContent = activeTicket.coin;

    const savedRole = activeTicket.demoRole;
    if (savedRole === "sender" || savedRole === "receiver") {
        roleButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.role === savedRole));
        });
    }
    renderDealState();

    roleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (activeTicket.demoStage && activeTicket.demoStage !== "confirm-amount") return;
            if (saveTicket({ demoRole: button.dataset.role })) renderDealState();
        });
    });

    document.getElementById("reset-role").addEventListener("click", () => {
        if (saveTicket({ demoRole: "" })) renderDealState();
    });

    amountForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const role = activeTicket.demoRole;
        const amount = Number(amountInput.value);
        if (role !== "sender" && role !== "receiver") {
            amountStatus.textContent = "Select Sender or Receiver before confirming.";
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            amountStatus.textContent = "Enter an amount greater than zero.";
            amountInput.focus();
            return;
        }

        const confirmations = readConfirmations();
        confirmations[role] = true;
        const otherRole = role === "sender" ? "receiver" : "sender";
        const demoStage = confirmations[otherRole] ? "payment-ready" : "confirm-other";
        if (saveTicket({
            amount: String(amount),
            confirmations,
            demoStage
        })) {
            renderDealState();
        }
    });

    confirmOtherButton.addEventListener("click", () => {
        const otherRole = activeTicket.demoRole === "sender" ? "receiver" : "sender";
        const confirmations = readConfirmations();
        confirmations[otherRole] = true;
        if (saveTicket({ confirmations, demoStage: "payment-ready" })) renderDealState();
    });

    beginDemoButton.addEventListener("click", () => {
        if (saveTicket({ demoStage: "sender-payment" })) renderDealState();
    });

    simulatePaymentButton.addEventListener("click", () => {
        if (saveTicket({ demoStage: "receiver-confirm" })) renderDealState();
    });

    simulateReceiptButton.addEventListener("click", () => {
        if (saveTicket({ demoStage: "complete" })) renderDealState();
    });
}
