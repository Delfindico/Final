(function () {
    const storageKey = "midlink.account.v1";
    const iterations = 150000;

    function getAccount() {
        const savedAccount = localStorage.getItem(storageKey);
        if (!savedAccount) return null;

        try {
            return JSON.parse(savedAccount);
        } catch {
            throw new Error("Saved account data is invalid. Clear this site's saved data and try again.");
        }
    }

    function saveAccount(account) {
        localStorage.setItem(storageKey, JSON.stringify(account));
    }

    function toHex(bytes) {
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    async function hashPassword(password, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Secure password storage is unavailable in this browser. Open the site through localhost or HTTPS.");
        }

        const key = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const result = await window.crypto.subtle.deriveBits({
            name: "PBKDF2",
            salt,
            iterations,
            hash: "SHA-256"
        }, key, 256);

        return new Uint8Array(result);
    }

    async function createPasswordCredential(password) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Secure password storage is unavailable in this browser. Open the site through localhost or HTTPS.");
        }
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const hash = await hashPassword(password, salt);
        return { passwordSalt: toHex(salt), passwordHash: toHex(hash) };
    }

    async function verifyPassword(password, account) {
        if (!account || !account.passwordSalt || !account.passwordHash) return false;
        if (!/^[\da-f]{32}$/i.test(account.passwordSalt)
            || !/^[\da-f]{64}$/i.test(account.passwordHash)) {
            throw new Error("Saved password data is invalid. Reset the site's saved account data.");
        }
        const salt = Uint8Array.from(account.passwordSalt.match(/.{2}/g) || [], (part) => parseInt(part, 16));
        const savedHash = account.passwordHash;
        const candidateHash = toHex(await hashPassword(password, salt));

        if (candidateHash.length !== savedHash.length) return false;
        let difference = 0;
        for (let index = 0; index < candidateHash.length; index += 1) {
            difference |= candidateHash.charCodeAt(index) ^ savedHash.charCodeAt(index);
        }
        return difference === 0;
    }

    window.MidLinkAccount = Object.freeze({
        getAccount,
        saveAccount,
        createPasswordCredential,
        verifyPassword
    });
})();
