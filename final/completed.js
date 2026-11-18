const dealList = document.getElementById("deal-list");
const completedStatus = document.getElementById("completed-status");
const completedDealsStorageKey = "midlink.completedMiddlemanDeals.v1";
const supportedCoins = ["BTC", "USDT", "SOLANA", "ETH"];

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function getSavedDeals() {
    let serializedDeals;
    try {
        serializedDeals = window.localStorage.getItem(completedDealsStorageKey);
    } catch (error) {
        throw new Error("Saved deal history is unavailable in this browser.");
    }

    if (!serializedDeals) return [];

    let savedDeals;
    try {
        savedDeals = JSON.parse(serializedDeals);
    } catch (error) {
        throw new Error("Saved deal history is invalid and could not be displayed.");
    }

    if (!Array.isArray(savedDeals)) {
        throw new Error("Saved deal history is invalid and could not be displayed.");
    }

    const hasInvalidDeal = savedDeals.some((deal) => !deal
        || typeof deal.id !== "string"
        || !/^(BTC|USDT|SOLANA|ETH)-#\d{5}$/.test(deal.id)
        || !supportedCoins.includes(deal.coin)
        || typeof deal.title !== "string"
        || typeof deal.completedAt !== "string"
        || !Number.isFinite(Date.parse(deal.completedAt))
        || typeof deal.amount !== "string"
        || typeof deal.sender !== "string"
        || typeof deal.receiver !== "string");

    if (hasInvalidDeal) {
        throw new Error("Saved deal history contains invalid entries and could not be displayed.");
    }

    return savedDeals;
}

function getDealTimestamp(deal) {
    const timestamp = Date.parse(deal.completedAt || deal.date);
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function removeLegacyDemoLabels(deals) {
    let hasChanges = false;
    const updatedDeals = deals.map((deal) => {
        const title = deal.title.replace(/\s+Demo\s+Deal\s+Complete$/i, " Deal Complete");
        const amount = deal.amount.replace(/\s+\(demo only;\s*no funds transferred\)$/i, "");
        if (title !== deal.title || amount !== deal.amount) hasChanges = true;
        return { ...deal, title, amount };
    });

    if (hasChanges) {
        try {
            window.localStorage.setItem(completedDealsStorageKey, JSON.stringify(updatedDeals));
        } catch (error) {
            completedStatus.textContent = "Updated deal labels are shown, but could not be saved to browser history.";
        }
    }

    return updatedDeals;
}

function renderDeals() {
    let savedDeals = [];
    try {
        savedDeals = removeLegacyDemoLabels(getSavedDeals());
    } catch (error) {
        if (!completedStatus.textContent) {
            completedStatus.textContent = error.message || "Could not load saved deal history.";
        }
    }

    const orderedDeals = [...savedDeals]
        .sort((first, second) => getDealTimestamp(first) - getDealTimestamp(second));

    for (const deal of orderedDeals) {
        const article = document.createElement("article");
        article.className = `deal deal--${deal.coin.toLowerCase()}`;

        const brand = document.createElement("span");
        brand.className = "deal-brand";
        brand.setAttribute("aria-hidden", "true");

        const logo = document.createElement("img");
        logo.src = "logo2.png";
        logo.alt = "";
        brand.append(logo);

        const content = document.createElement("div");
        content.className = "deal-content";
        content.append(createTextElement("span", "deal-sender", "MidLink"));

        const details = document.createElement("div");
        details.className = "deal-details";
        details.append(createTextElement("h2", "deal-title", deal.title));

        const date = document.createElement("p");
        date.append(document.createTextNode("Date & Time: "), document.createElement("br"));
        const dateValue = new Date(deal.completedAt).toLocaleString();
        date.append(document.createTextNode(dateValue));

        const amount = document.createElement("p");
        amount.append(document.createTextNode("Amount: "), document.createElement("br"));
        amount.append(document.createTextNode(deal.amount));

        details.append(
            date,
            amount,
            ...(deal.id ? [createTextElement("p", "deal-ticket-id", `Ticket ID: ${deal.id}`)] : []),
            createTextElement("span", "deal-label", "Sender"),
            createTextElement("span", "deal-person", deal.sender),
            createTextElement("span", "deal-label deal-label--receiver", "Receiver"),
            createTextElement("span", "deal-person", deal.receiver)
        );

        content.append(details);
        article.append(brand, content);
        dealList.append(article);
    }
}

renderDeals();