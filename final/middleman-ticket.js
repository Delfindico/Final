const coinDetails = {
    BTC: { name: "Bitcoin", network: "Bitcoin", icon: "₿", iconClass: "coin-icon--btc" },
    USDT: { name: "USDT", network: "BSC (BEP20)", icon: "₮", iconClass: "coin-icon--usdt" },
    SOLANA: { name: "Solana", network: "Solana", icon: "≋", iconClass: "coin-icon--sol" },
    ETH: { name: "Ethereum", network: "Ethereum", icon: "◆", iconClass: "coin-icon--eth" }
};

const query = new URLSearchParams(window.location.search);
const coinCode = (query.get("coin") || "").toUpperCase();
const ticketId = query.get("ticketId") || "";
const selectedCoin = Object.prototype.hasOwnProperty.call(coinDetails, coinCode)
    ? coinDetails[coinCode]
    : null;
const currentTicketStorageKey = "midlink.currentMiddlemanTicket.v1";
const coinIcon = document.getElementById("coin-icon");
const coinName = document.getElementById("selected-coin-name");
const networkName = document.getElementById("selected-network");
const ticketIdLabel = document.getElementById("ticket-id");
const memberForm = document.getElementById("member-form");
const memberChoice = document.getElementById("member-choice");
const memberName = document.getElementById("member-name");
const requestStatus = document.getElementById("request-status");
const submitButton = memberForm.querySelector('button[type="submit"]');
let activeTicket;
let ticketStorageError = false;

try {
    const storedTicket = window.localStorage.getItem(currentTicketStorageKey);
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

const isValidTicket = selectedCoin
    && query.get("network") === selectedCoin.network
    && /^(BTC|USDT|SOLANA|ETH)-#\d{5}$/.test(ticketId)
    && ticketId.startsWith(`${coinCode}-#`)
    && activeTicket
    && activeTicket.id === ticketId
    && activeTicket.coin === coinCode
    && activeTicket.network === selectedCoin.network
    && activeTicket.status === "open";

function showStatus(message, isError) {
    requestStatus.textContent = message;
    requestStatus.dataset.error = String(isError);
}

if (!isValidTicket) {
    coinName.textContent = "No cryptocurrency selected";
    networkName.textContent = "";
    submitButton.disabled = true;
    ticketIdLabel.textContent = "Unavailable";
    showStatus(ticketStorageError
        ? "The ticket could not be loaded from browser storage. Return to coin selection and try again."
        : "Please return to coin selection and choose a cryptocurrency first.", true);
} else {
    document.title = `${coinCode} Middleman Deal | MidLink`;
    coinName.textContent = `${coinCode} - ${selectedCoin.name}`;
    networkName.textContent = `Network: ${selectedCoin.network}`;
    coinIcon.textContent = selectedCoin.icon;
    coinIcon.classList.add(selectedCoin.iconClass);
    ticketIdLabel.textContent = ticketId;
}

memberChoice.addEventListener("change", () => {
    if (memberChoice.value === "manual") {
        memberName.focus();
    } else if (memberChoice.value) {
        memberName.value = memberChoice.value;
    }
});

document.getElementById("close-ticket").addEventListener("click", () => {
    try {
        window.localStorage.removeItem(currentTicketStorageKey);
    } catch (error) {
        showStatus("The ticket could not be closed because browser storage could not be updated.", true);
        return;
    }

    window.location.href = "midleman.html";
});

memberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isValidTicket) {
        showStatus("Please choose a valid cryptocurrency before submitting.", true);
        return;
    }

    const username = memberName.value.trim();
    if (!username) {
        showStatus("Enter the other member's username to continue.", true);
        memberName.focus();
        return;
    }

    const updatedTicket = {
        ...activeTicket,
        member: username,
        status: "in-progress",
        confirmations: {
            sender: false,
            receiver: false
        },
        demoStage: "confirm-amount"
    };

    try {
        window.localStorage.setItem(currentTicketStorageKey, JSON.stringify(updatedTicket));
    } catch (error) {
        showStatus("The deal room could not be opened because browser storage is unavailable.", true);
        return;
    }

    const dealUrl = new URLSearchParams({ ticketId });
    window.location.assign(`middleman-deal.html?${dealUrl.toString()}`);
});
