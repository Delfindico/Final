const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.getElementById("sidebar");
const dashboard = document.getElementById("dashboard");

function ensureSettingsOverlay() {
    if (document.getElementById("settings-overlay")) return;

    const overlay = document.createElement("dialog");
    overlay.className = "settings-overlay";
    overlay.id = "settings-overlay";
    overlay.setAttribute("aria-label", "Settings menu");
    overlay.innerHTML = `
        <main class="settings-menu">
            <button class="settings-menu-close" type="button" data-close-settings aria-label="Back to dashboard">×</button>
            <div class="profile">
                <img class="profile-picture" src="anya.webp" alt="Anya Forger profile picture">
                <span class="profile-name">Anya Forger</span>
            </div>
            <section class="settings-navigation" aria-labelledby="dashboard-settings-title">
                <div class="settings-heading">
                    <svg class="settings-icon" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M20 3h8l1.5 6.1c1.3.4 2.5 1.1 3.6 2.1l6-1.6 4 7-4.5 4.4c.2 1.4.2 2.8 0 4.2l4.5 4.4-4 7-6-1.6a15 15 0 0 1-3.6 2.1L28 43h-8l-1.5-6.1a15 15 0 0 1-3.6-2.1l-6 1.6-4-7 4.5-4.4a15 15 0 0 1 0-4.2L4.9 16.4l4-7 6 1.6a15 15 0 0 1 3.6-2.1L20 3Z"/>
                        <circle cx="24" cy="23" r="7"/>
                    </svg>
                    <h1 id="dashboard-settings-title">Setting</h1>
                </div>
                <nav class="settings-links" aria-label="Settings">
                    <button class="settings-link" type="button" data-setting="account"><span class="settings-arrow" aria-hidden="true">↪</span><span>Account info</span></button>
                    <button class="settings-link" type="button" data-setting="profilePhoto"><span class="settings-arrow" aria-hidden="true">↪</span><span>Profile photo</span></button>
                    <button class="settings-link" type="button" data-setting="security"><span class="settings-arrow" aria-hidden="true">↪</span><span>Password and Security</span></button>
                    <button class="settings-link" type="button" data-setting="family"><span class="settings-arrow" aria-hidden="true">↪</span><span>Family Center</span></button>
                    <button class="settings-link" type="button" data-setting="notifications"><span class="settings-arrow" aria-hidden="true">↪</span><span>Notifications</span></button>
                    <button class="settings-link" type="button" data-setting="appearance"><span class="settings-arrow" aria-hidden="true">↪</span><span>Appearance</span></button>
                    <button class="settings-link" type="button" data-setting="language"><span class="settings-arrow" aria-hidden="true">↪</span><span>Language</span></button>
                    <button class="settings-link" type="button" data-setting="help"><span class="settings-arrow" aria-hidden="true">↪</span><span>Help and Support</span></button>
                </nav>
            </section>
            <a class="logout-button" href="index.html">Log Out</a>
        </main>`;
    document.body.append(overlay);

    const detailsDialog = document.createElement("dialog");
    detailsDialog.className = "settings-dialog";
    detailsDialog.id = "settings-dialog";
    detailsDialog.setAttribute("aria-labelledby", "dialog-title");
    detailsDialog.innerHTML = `
        <form method="dialog">
            <button class="dialog-close" type="submit" aria-label="Close settings">×</button>
        </form>
        <h2 id="dialog-title"></h2>
        <p id="dialog-description"></p>
        <div class="settings-details" id="settings-details" aria-live="polite"></div>`;
    document.body.append(detailsDialog);
}

if (menuToggle && !document.getElementById("settings-overlay")) {
    ensureSettingsOverlay();
}

const settingsOverlay = document.getElementById("settings-overlay");

menuToggle?.addEventListener("click", () => {
    if (settingsOverlay) {
        settingsOverlay.showModal();
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "Close settings menu");
        return;
    }

    if (!sidebar || !dashboard) return;
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    sidebar.classList.toggle("is-hidden", isExpanded);
    dashboard.classList.toggle("sidebar-hidden", isExpanded);
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Show sidebar" : "Hide sidebar");
});

if (settingsOverlay) {
    const settingsMenu = settingsOverlay.querySelector(".settings-menu");
    const closeButton = settingsOverlay.querySelector("[data-close-settings]");

    const closeSettingsMenu = () => {
        if (settingsOverlay.open) settingsOverlay.close();
    };

    closeButton?.addEventListener("click", closeSettingsMenu);
    settingsOverlay.addEventListener("click", (event) => {
        if (event.target === settingsOverlay) closeSettingsMenu();
    });

    settingsOverlay.addEventListener("pointerdown", (event) => {
        const bounds = settingsMenu.getBoundingClientRect();
        const clickedOutsideMenu = event.clientX < bounds.left
            || event.clientX > bounds.right
            || event.clientY < bounds.top
            || event.clientY > bounds.bottom;

        if (clickedOutsideMenu) closeSettingsMenu();
    });

    settingsOverlay.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeSettingsMenu();
    });

    settingsOverlay.addEventListener("close", () => {
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Open settings menu");
    });
}

const currentMiddlemanTicketStorageKey = "midlink.currentMiddlemanTicket.v1";
const middlemanRequestLink = document.querySelector('a.nav-link[href="midleman.html"]');
const middlemanCoinNetworks = {
    BTC: "Bitcoin",
    USDT: "BSC (BEP20)",
    SOLANA: "Solana",
    ETH: "Ethereum"
};

if (middlemanRequestLink) {
    let storedTicket;
    try {
        storedTicket = window.localStorage.getItem(currentMiddlemanTicketStorageKey);
    } catch (error) {
        console.error("Could not read the active Middleman ticket.", error);
    }

    if (storedTicket) {
        let ticket;
        try {
            ticket = JSON.parse(storedTicket);
        } catch (error) {
            console.error("The active Middleman ticket data is invalid.", error);
        }

        const validCoin = ticket
            && Object.prototype.hasOwnProperty.call(middlemanCoinNetworks, ticket.coin)
            && ticket.network === middlemanCoinNetworks[ticket.coin];
        const validTicket = validCoin
            && (ticket.status === "open" || ticket.status === "in-progress")
            && typeof ticket.id === "string"
            && ticket.id.startsWith(`${ticket.coin}-#`)
            && /^(BTC|USDT|SOLANA|ETH)-#\d{5}$/.test(ticket.id);

        if (validTicket && middlemanRequestLink.parentElement) {
            const ticketItem = document.createElement("li");
            ticketItem.className = "middleman-ticket-nav-item";

            const ticketLink = document.createElement("a");
            ticketLink.className = "nav-link middleman-ticket-nav-link";
            ticketLink.setAttribute("aria-label", `Middleman request ticket ${ticket.id}`);
            const ticketUrl = new URLSearchParams({
                coin: ticket.coin,
                network: ticket.network,
                ticketId: ticket.id
            });
            const ticketPage = ticket.status === "in-progress"
                ? "middleman-deal.html"
                : "middleman-ticket.html";
            ticketLink.href = `${ticketPage}?${ticketUrl.toString()}`;

            const ticketIcon = document.createElement("span");
            ticketIcon.className = "nav-icon";
            ticketIcon.setAttribute("aria-hidden", "true");
            ticketIcon.textContent = "#";

            const ticketLabel = document.createElement("span");
            ticketLabel.textContent = ticket.id;
            ticketLink.append(ticketIcon, ticketLabel);
            ticketItem.append(ticketLink);
            middlemanRequestLink.parentElement.insertAdjacentElement("afterend", ticketItem);

            if (window.location.pathname.toLowerCase().endsWith("middleman-ticket.html")
                || window.location.pathname.toLowerCase().endsWith("middleman-deal.html")) {
                middlemanRequestLink.classList.remove("nav-link--current");
                middlemanRequestLink.removeAttribute("aria-current");
                ticketLink.classList.add("nav-link--current");
                ticketLink.setAttribute("aria-current", "page");
            }
        }
    }
}