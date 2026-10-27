/* =========================================================
   WAYVIA — AI CAREER ASSISTANT
   Connected to the Flask + Groq backend
   ========================================================= */

const API_URL = "http://127.0.0.1:5000/api/assistant/chat";

/* DOM ELEMENTS */

const chatArea = document.getElementById("chatArea");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");
const searchCompaniesButton = document.getElementById("searchCompaniesButton");
const clearChat = document.getElementById("clearChat");
const profileButton = document.getElementById("profileButton");
const quickButtons = document.querySelectorAll(".quick-button");

let isWaitingForResponse = false;
let latestCompanies = [];

/* SEND MESSAGE TO THE REAL AI */

async function sendMessage(text = messageInput.value.trim()) {
    const message = text.trim();

    if (!message || isWaitingForResponse) return;

    addUserMessage(message);
    messageInput.value = "";
    setWaiting(true);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `Request failed (${response.status})`
            );
        }

        latestCompanies = Array.isArray(data.companies)
            ? data.companies
            : [];

        addAssistantMessage(
            data.reply || "I couldn't generate a response. Please try again."
        );

    } catch (error) {
        console.error("WayVia assistant error:", error);

        addAssistantMessage(
            "I couldn't connect to the AI assistant. Please make sure the WayVia backend is running, then try again."
        );
    } finally {
        setWaiting(false);
        messageInput.focus();
    }
}

/* ADD USER MESSAGE */

function addUserMessage(message) {
    const row = document.createElement("div");
    row.className = "message-row user-row";

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble user-bubble";
    bubble.textContent = message;

    content.appendChild(bubble);
    row.appendChild(content);
    chatArea.appendChild(row);

    scrollToBottom();
}

/* ADD ASSISTANT MESSAGE SAFELY */

function addAssistantMessage(message) {
    const row = document.createElement("div");
    row.className = "message-row assistant-row";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.8"
             aria-hidden="true">
            <circle cx="12" cy="8" r="3"></circle>
            <path d="M5 21C5.8 16.8 8.2 15 12 15C15.8 15 18.2 16.8 19 21"></path>
        </svg>
    `;

    const content = document.createElement("div");
    content.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble assistant-bubble";

    // textContent prevents AI-generated text from being interpreted as HTML.
    bubble.textContent = message;

    // Preserve line breaks in the AI response.
    bubble.style.whiteSpace = "pre-wrap";
    bubble.style.overflowWrap = "anywhere";

    content.appendChild(bubble);
    row.appendChild(avatar);
    row.appendChild(content);
    chatArea.appendChild(row);

    scrollToBottom();
}

/* WAITING STATE */

function setWaiting(waiting) {
    isWaitingForResponse = waiting;
    sendButton.disabled = waiting;
    messageInput.disabled = waiting;

    if (waiting) {
        typingIndicator.classList.remove("hidden");
        typingIndicator.setAttribute("aria-live", "polite");
    } else {
        typingIndicator.classList.add("hidden");
    }

    scrollToBottom();
}

/* QUICK ACTIONS — USE THE REAL AI */

quickButtons.forEach(button => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        const prompts = {
            data: "Analyze the company data available in WayVia and explain what information is available.",
            cities: "Which Moroccan cities have the most companies relevant to students exploring technology careers? Explain any limitations in the available data.",
            profile: "Help me identify the profile information and skills you need to suggest relevant companies.",
            questions: "What information can I share with you to get better company and career recommendations?"
        };

        if (prompts[action]) {
            sendMessage(prompts[action]);
        }
    });
});

/* SEARCH COMPANIES */

searchCompaniesButton.addEventListener("click", () => {
    window.location.href = "search.html";
});

/* CLEAR CHAT */

clearChat.addEventListener("click", () => {
    if (isWaitingForResponse) return;

    chatArea.querySelectorAll(".message-row").forEach(message => {
        if (!message.classList.contains("typing-row")) {
            message.remove();
        }
    });

    latestCompanies = [];

    addAssistantMessage(
        "Hi! I'm your AI career assistant. Tell me about your skills, interests or preferred location, and I'll help you explore relevant companies and opportunities."
    );
});

/* INPUT — ENTER TO SEND */

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener("click", () => sendMessage());

/* PROFILE NAVIGATION */

profileButton.addEventListener("click", () => {
    window.location.href = "profile.html";
});

/* SCROLL */

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}