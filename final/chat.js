const chats = [
    { id: "angela", name: "Angela Cutie", avatar: "photo", preview: "Hi!", category: "friends", messages: [{ text: "hi!", outgoing: false }] },
    { id: "leo", name: "Leo", avatar: "lion", emoji: "🦁", preview: "deal or no deal?", category: "friends", messages: [{ text: "deal or no deal?", outgoing: false }] },
    { id: "yaqqian", name: "Yaqqian", avatar: "panda", emoji: "🐼", preview: "", category: "friends", messages: [] },
    { id: "gelay", name: "Gelay ash", avatar: "fox", emoji: "🦊", preview: "", category: "friends", messages: [] },
    { id: "sharky", name: "Sharky", avatar: "shark", emoji: "🦈", preview: "", category: "friends", messages: [] }
];

const chatList = document.getElementById("chat-list");
const searchInput = document.getElementById("chat-search");
const headerPerson = document.getElementById("header-person");
const messageArea = document.getElementById("message-area");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const notice = document.getElementById("chat-notice");
let selectedChatId = chats[0].id;
let activeFilter = "all";
let noticeTimeout;

function createAvatar(chat) {
    const avatar = document.createElement("span");
    avatar.className = `avatar avatar--${chat.avatar}`;
    avatar.setAttribute("aria-hidden", "true");

    if (chat.avatar === "photo" || chat.avatar === "own") {
        const image = document.createElement("img");
        image.src = chat.avatar === "own" ? "anya.webp" : "angela.jfif";
        image.alt = "";
        avatar.append(image);
    } else {
        avatar.textContent = chat.emoji || "🙂";
    }
    return avatar;
}

function renderChatList() {
    const query = searchInput.value.trim().toLowerCase();
    const visibleChats = chats.filter((chat) => {
        const matchesFilter = activeFilter === "all" || chat.category === activeFilter;
        return matchesFilter && chat.name.toLowerCase().includes(query);
    });

    chatList.replaceChildren();
    if (visibleChats.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "chat-empty";
        emptyItem.textContent = "No chats found.";
        chatList.append(emptyItem);
        return;
    }

    for (const chat of visibleChats) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = `chat-item${chat.id === selectedChatId ? " is-selected" : ""}`;
        button.setAttribute("aria-pressed", String(chat.id === selectedChatId));

        const details = document.createElement("span");
        details.className = "chat-details";
        const status = document.createElement("span");
        status.className = "online-status";
        status.textContent = "online";
        const name = document.createElement("span");
        name.className = "chat-name";
        name.textContent = chat.name;
        details.append(status, name);

        if (chat.preview) {
            const preview = document.createElement("span");
            preview.className = "chat-preview";
            preview.textContent = chat.preview;
            details.append(preview);
        }

        button.append(createAvatar(chat), details);
        button.addEventListener("click", () => selectChat(chat.id));
        item.append(button);
        chatList.append(item);
    }
}

function renderConversation() {
    const chat = chats.find((item) => item.id === selectedChatId);
    if (!chat) return;

    headerPerson.replaceChildren();
    headerPerson.append(createAvatar(chat));
    const details = document.createElement("div");
    const status = document.createElement("span");
    status.className = "online-status";
    status.textContent = "online";
    const name = document.createElement("span");
    name.className = "chat-name";
    name.textContent = chat.name;
    details.append(status, name);
    headerPerson.append(details);

    messageArea.replaceChildren();
    if (chat.messages.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "chat-empty";
        emptyMessage.textContent = `Start a conversation with ${chat.name}.`;
        messageArea.append(emptyMessage);
        return;
    }

    for (const message of chat.messages) {
        const row = document.createElement("div");
        row.className = `message-row${message.outgoing ? " message-row--outgoing" : ""}`;
        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = message.text;
        if (message.outgoing) {
            row.append(bubble, createAvatar({ avatar: "own" }));
        } else {
            row.append(createAvatar(chat), bubble);
        }
        messageArea.append(row);
    }
    messageArea.scrollTop = messageArea.scrollHeight;
}

function selectChat(chatId) {
    selectedChatId = chatId;
    renderChatList();
    renderConversation();
    messageInput.focus();
}

function showNotice(message) {
    window.clearTimeout(noticeTimeout);
    notice.textContent = message;
    noticeTimeout = window.setTimeout(() => { notice.textContent = ""; }, 3500);
}

document.querySelectorAll(".filter-button[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll(".filter-button[data-filter]").forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle("is-active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });
        renderChatList();
    });
});

searchInput.addEventListener("input", renderChatList);

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    const chat = chats.find((item) => item.id === selectedChatId);
    if (!text || !chat) return;

    chat.messages.push({ text, outgoing: true });
    chat.preview = text;
    messageInput.value = "";
    renderConversation();
    renderChatList();
    messageInput.focus();
});

document.getElementById("add-friend").addEventListener("click", () => {
    const name = window.prompt("Enter your friend's name:");
    if (name === null) return;

    const cleanName = name.trim();
    if (!cleanName) {
        showNotice("Please enter a name to add a friend.");
        return;
    }
    if (chats.some((chat) => chat.name.toLowerCase() === cleanName.toLowerCase())) {
        showNotice("That friend is already in your chat list.");
        return;
    }

    const newChat = {
        id: `friend-${Date.now()}`,
        name: cleanName,
        avatar: "user",
        emoji: "🙂",
        preview: "Friend request sent",
        category: "pending",
        messages: []
    };
    chats.push(newChat);
    activeFilter = "pending";
    document.querySelectorAll(".filter-button[data-filter]").forEach((button) => {
        const isActive = button.dataset.filter === activeFilter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
    selectChat(newChat.id);
    showNotice(`Friend request sent to ${cleanName}.`);
});

document.querySelectorAll("[data-call]").forEach((button) => {
    button.addEventListener("click", () => showNotice("Calling is not connected yet."));
});

document.getElementById("chat-info").addEventListener("click", () => {
    const chat = chats.find((item) => item.id === selectedChatId);
    if (chat) showNotice(`Chat with ${chat.name}.`);
});

renderChatList();
renderConversation();