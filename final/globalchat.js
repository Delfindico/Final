const globalPosts = [
    { author: "Angela Cutie", avatar: "photo", title: "Selling MM2", text: "1x Chroma beachy knife 34$\n1x Chroma Icecream 47$\n1x Beachy set 5.6$\n1x Flowerwood Gun 6.5$\n1x Flora gun 10.5$" },
    { author: "Yaqqian", avatar: "panda", title: "", text: "BUYING MM2\nChroma Heart wand 80$\nRaygun 38$\nDark Set 77$\nBloom set 19$" },
    { author: "Anya forger", avatar: "own", title: "Selling MM2", text: "50x Snow dagger 5$\n50x Harvester\nHarv 6.2$\n50x Candy set 3.3$\n50x Hallow set 1.7$" }
];

const postsContainer = document.getElementById("global-posts");
const globalForm = document.getElementById("global-form");
const globalInput = document.getElementById("global-message");

function createGlobalAvatar(kind) {
    const avatar = document.createElement("span");
    avatar.className = `global-avatar global-avatar--${kind}`;
    avatar.setAttribute("aria-hidden", "true");

    if (kind === "photo" || kind === "own") {
        const image = document.createElement("img");
        image.src = kind === "own" ? "anya.webp" : "angela.jfif";
        image.alt = "";
        avatar.append(image);
    } else {
        avatar.textContent = "🐼";
    }
    return avatar;
}

function renderGlobalPosts() {
    postsContainer.replaceChildren();
    for (const post of globalPosts) {
        const row = document.createElement("article");
        row.className = `global-post${post.avatar === "own" ? " global-post--own" : ""}`;
        const content = document.createElement("div");
        content.className = "global-post-content";
        const author = document.createElement("span");
        author.className = "global-author";
        author.textContent = post.author;
        content.append(author);

        if (post.title) {
            const title = document.createElement("strong");
            title.className = "global-post-title";
            title.textContent = post.title;
            content.append(title);
        }

        const text = document.createElement("p");
        text.className = "global-post-text";
        text.textContent = post.text;
        content.append(text);

        if (post.avatar === "own") {
            row.append(content, createGlobalAvatar(post.avatar));
        } else {
            row.append(createGlobalAvatar(post.avatar), content);
        }
        postsContainer.append(row);
    }
    postsContainer.scrollTop = postsContainer.scrollHeight;
}

globalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = globalInput.value.trim();
    if (!text) return;
    globalPosts.push({ author: "Anya forger", avatar: "own", title: "", text });
    globalInput.value = "";
    renderGlobalPosts();
    globalInput.focus();
});

renderGlobalPosts();