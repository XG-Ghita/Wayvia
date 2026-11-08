/* =========================================================
   WAYVIA — AI CAREER ASSISTANT
   Connected to the Flask + Groq backend
   ========================================================= */

const API_URL = "https://wayvia-two.vercel.app/api/assistant/chat";

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

/* SELECTED OPPORTUNITY */

let selectedOpportunity = null;

try {
    const savedOpportunity = sessionStorage.getItem(
        "wayvia_selected_opportunity"
    );

    if (savedOpportunity) {
        const parsed = JSON.parse(savedOpportunity);

        if (
            parsed &&
            typeof parsed === "object" &&
            typeof parsed.title === "string" &&
            typeof parsed.application_url === "string"
        ) {
            const url = new URL(parsed.application_url);

            if (["http:", "https:"].includes(url.protocol)) {
                selectedOpportunity = parsed;
            }
        }

        sessionStorage.removeItem("wayvia_selected_opportunity");
    }
} catch (error) {
    console.error("Could not load selected opportunity:", error);
    sessionStorage.removeItem("wayvia_selected_opportunity");
}

/* DISPLAY SELECTED OPPORTUNITY */

const selectedOpportunityPanel = document.getElementById(
    "selectedOpportunityPanel"
);

const selectedOpportunityTitle = document.getElementById(
    "selectedOpportunityTitle"
);

const selectedOpportunityCompany = document.getElementById(
    "selectedOpportunityCompany"
);

if (selectedOpportunity && selectedOpportunityPanel) {
    selectedOpportunityTitle.textContent =
        selectedOpportunity.title || "Selected opportunity";

    selectedOpportunityCompany.textContent =
        selectedOpportunity.company || selectedOpportunity.location || "";

    selectedOpportunityPanel.hidden = false;
}

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
            body: JSON.stringify({
                message,
                selected_opportunity_url: selectedOpportunity
                    ? selectedOpportunity.application_url
                    : null
            })
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


function appendInlineFormatting(container, text) {
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            container.appendChild(
                document.createTextNode(text.slice(lastIndex, match.index))
            );
        }

        const token = match[0];
        const element = document.createElement(
            token.startsWith("**") ? "strong" : "code"
        );

        element.textContent = token.startsWith("**")
            ? token.slice(2, -2)
            : token.slice(1, -1);

        container.appendChild(element);
        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        container.appendChild(
            document.createTextNode(text.slice(lastIndex))
        );
    }
}

function renderAssistantResponse(container, message) {
    const lines = String(message || "").replace(/\r\n/g, "\n").split("\n");
    let i = 0;

    function isTableSeparator(line) {
        const cells = line.trim().replace(/^\||\|$/g, "").split("|");

        return cells.length > 0 &&
            cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()));
    }

    function getTableCells(line) {
        return line.trim()
            .replace(/^\||\|$/g, "")
            .split("|")
            .map(cell => cell.trim());
    }

    function isListItem(line) {
        return /^\s*([-*•]|\d+\.)\s+/.test(line);
    }

    function isBlockStart(index) {
        const line = lines[index] || "";

        return (
            /^#{1,3}\s+/.test(line) ||
            isListItem(line) ||
            (
                index + 1 < lines.length &&
                line.includes("|") &&
                isTableSeparator(lines[index + 1])
            )
        );
    }

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) {
            i++;
            continue;
        }

        // Headings
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

        if (headingMatch) {
            const heading = document.createElement("div");
            heading.className = "response-heading";
            appendInlineFormatting(heading, headingMatch[2]);
            container.appendChild(heading);
            i++;
            continue;
        }

        // Markdown tables
        if (
            line.includes("|") &&
            i + 1 < lines.length &&
            isTableSeparator(lines[i + 1])
        ) {
            const wrapper = document.createElement("div");
            wrapper.className = "response-table-wrapper";

            const table = document.createElement("table");
            table.className = "response-table";

            const headerRow = document.createElement("tr");

            getTableCells(line).forEach(cell => {
                const th = document.createElement("th");
                appendInlineFormatting(th, cell);
                headerRow.appendChild(th);
            });

            const thead = document.createElement("thead");
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            i += 2;

            while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
                const row = document.createElement("tr");

                getTableCells(lines[i]).forEach(cell => {
                    const td = document.createElement("td");
                    appendInlineFormatting(td, cell);
                    row.appendChild(td);
                });

                tbody.appendChild(row);
                i++;
            }

            table.appendChild(tbody);
            wrapper.appendChild(table);
            container.appendChild(wrapper);
            continue;
        }

        // Bullet and numbered lists
        if (isListItem(line)) {
            const ordered = /^\d+\./.test(line);
            const list = document.createElement(ordered ? "ol" : "ul");

            while (i < lines.length && isListItem(lines[i].trim())) {
                const itemMatch = lines[i].trim().match(
                    ordered ? /^\d+\.\s+(.+)$/ : /^[-*•]\s+(.+)$/
                );

                if (!itemMatch) break;

                const li = document.createElement("li");
                appendInlineFormatting(li, itemMatch[1]);
                list.appendChild(li);
                i++;
            }

            container.appendChild(list);
            continue;
        }

        // Paragraphs
        const paragraph = document.createElement("p");
        const paragraphLines = [];

        while (
            i < lines.length &&
            lines[i].trim() &&
            !isBlockStart(i)
        ) {
            paragraphLines.push(lines[i].trim());
            i++;
        }

        if (paragraphLines.length) {
            appendInlineFormatting(paragraph, paragraphLines.join(" "));
            container.appendChild(paragraph);
        } else {
            // Prevent getting stuck on an unrecognized line.
            i++;
        }
    }
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

    bubble.style.whiteSpace = "normal";
    bubble.style.overflowWrap = "anywhere";

    renderAssistantResponse(bubble, message);

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

if (searchCompaniesButton) {
    searchCompaniesButton.addEventListener("click", () => {
        window.location.href = "search.html";
    });
}

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

/* AUTOMATIC SELECTED OPPORTUNITY ANALYSIS */

const assistantParams = new URLSearchParams(window.location.search);

if (
    selectedOpportunity &&
    assistantParams.get("analyze") === "opportunity"
) {
    sendMessage(
        "Please analyze my selected opportunity. Summarize the role, identify the skills and experience requirements explicitly stated, distinguish missing or unspecified information, and explain what I should check before applying. Tell me what information from my CV you would need to assess my personal fit. Do not invent requirements or assume qualifications I have not provided."
    );
}

/* SCROLL */

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}
