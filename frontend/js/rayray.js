/* =========================================================
   WAYVIA — RAYRAY AI CV ASSISTANT
   Chat interface, Groq connection and suggestion controls.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const API_URL = "https://wayvia-two.vercel.app/api/cv/assist";

    const widget = document.getElementById("rayrayWidget");
    const trigger = document.getElementById("rayrayTrigger");
    const bubble = document.getElementById("rayrayBubble");
    const chat = document.getElementById("rayrayChat");
    const closeButton = document.getElementById("rayrayClose");

    const messages = document.getElementById("rayrayMessages");
    const quickActions = document.getElementById("rayrayQuickActions");
    const form = document.getElementById("rayrayForm");
    const input = document.getElementById("rayrayInput");

    if (
        !widget || !trigger || !chat || !messages ||
        !form || !input || !quickActions
    ) {
        console.error("RayRay: Required HTML elements were not found.");
        return;
    }

    let isLoading = false;
    let rayrayAdditionalContext = "";

    const taskLabels = {
        generate_summary: "Improve my summary",
        improve_experience: "Improve my experience",
        improve_project: "Improve a project",
        suggest_skills: "Suggest relevant skills",
        review_cv: "Review my CV"
    };

    /* =====================================================
       OPEN / CLOSE CHAT
    ===================================================== */

    function openChat() {
        chat.classList.add("open");
        chat.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");

        if (bubble) {
            bubble.style.display = "none";
        }

        input.focus();
    }

    function closeChat() {
        chat.classList.remove("open");
        chat.setAttribute("aria-hidden", "true");
        trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", () => {
        if (chat.classList.contains("open")) {
            closeChat();
        } else {
            openChat();
        }
    });

    if (closeButton) {
        closeButton.addEventListener("click", closeChat);
    }

    /* =====================================================
       CHAT MESSAGE DISPLAY
    ===================================================== */


    function appendFormattedText(container, text) {
        // Safely render **bold** text without using innerHTML.
        const parts = text.split(/(\*\*.*?\*\*)/g);

        parts.forEach(part => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const strong = document.createElement("strong");
                strong.textContent = part.slice(2, -2);
                container.appendChild(strong);
            } else {
                container.appendChild(document.createTextNode(part));
            }
        });
    }

    function renderRayRayResponse(container, content) {
        const lines = content
            .replace(/\r\n/g, "\n")
            .split("\n");

        let currentList = null;
        let currentListType = null;

        function closeList() {
            currentList = null;
            currentListType = null;
        }

        lines.forEach(rawLine => {
            const line = rawLine.trim();

            if (!line) {
                closeList();
                return;
            }

            // Headings: #, ## or ###
            const headingMatch = line.match(/^#{1,3}\s+(.+)$/);

            if (headingMatch) {
                closeList();

                const heading = document.createElement("h4");
                appendFormattedText(heading, headingMatch[1]);
                container.appendChild(heading);
                return;
            }

            // Bullet points
            const bulletMatch = line.match(/^[-*•]\s+(.+)$/);

            if (bulletMatch) {
                if (currentListType !== "ul") {
                    closeList();
                    currentList = document.createElement("ul");
                    currentListType = "ul";
                    container.appendChild(currentList);
                }

                const item = document.createElement("li");
                appendFormattedText(item, bulletMatch[1]);
                currentList.appendChild(item);
                return;
            }

            // Numbered points
            const numberMatch = line.match(/^\d+[.)]\s+(.+)$/);

            if (numberMatch) {
                if (currentListType !== "ol") {
                    closeList();
                    currentList = document.createElement("ol");
                    currentListType = "ol";
                    container.appendChild(currentList);
                }

                const item = document.createElement("li");
                appendFormattedText(item, numberMatch[1]);
                currentList.appendChild(item);
                return;
            }

            // Normal paragraph
            closeList();

            const paragraph = document.createElement("p");
            appendFormattedText(paragraph, line);
            container.appendChild(paragraph);
        });
    }

    function addMessage(content, sender = "bot") {
        const message = document.createElement("div");
        message.className = `rayray-message ${sender}`;

        const messageContent = document.createElement("div");
        messageContent.className = "rayray-message-content";

        renderRayRayResponse(messageContent, content);

        message.appendChild(messageContent);
        messages.appendChild(message);

        messages.scrollTop = messages.scrollHeight;
        return message;
    }


    function addLoadingMessage() {
        const message = document.createElement("div");

        message.className = "rayray-message bot rayray-loading";
        message.textContent = "RayRay is thinking... ✨";

        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;

        return message;
    }

    function setQuickActionsDisabled(disabled) {
        quickActions.querySelectorAll("button").forEach(button => {
            button.disabled = disabled;
        });
    }

    /* =====================================================
       PREPARE CV DATA FOR AI
    ===================================================== */

    function getSafeCVData() {
        if (typeof window.getWayViaCVData !== "function") {
            throw new Error("CV editor connection is missing.");
        }

        const cv = window.getWayViaCVData();

        return {
            professionalTitle: cv.professionalTitle || "",
            targetRole: cv.targetRole || "",
            summary: cv.summary || "",
            education: cv.education || "",
            experience: cv.experience || "",
            projects: cv.projects || "",
            skills: cv.skills || "",
            languages: cv.languages || "",
            certifications: cv.certifications || ""
        };
    }

    /* =====================================================
       SUGGESTION ACTIONS
    ===================================================== */

    function addSuggestionActions(message, task, result) {
        const canApply = [
            "generate_summary",
            "improve_experience",
            "improve_project"
        ].includes(task);

        if (!canApply) {
            return;
        }

        const actions = document.createElement("div");
        actions.className = "rayray-suggestion-actions";

        const applyButton = document.createElement("button");
        applyButton.type = "button";
        applyButton.className = "rayray-apply";
        applyButton.textContent = "Apply to my CV ✓";

        const dismissButton = document.createElement("button");
        dismissButton.type = "button";
        dismissButton.className = "rayray-dismiss";
        dismissButton.textContent = "Dismiss";

        applyButton.addEventListener("click", () => {
            const fieldIds = {
                generate_summary: "summary",
                improve_experience: "experience",
                improve_project: "projects"
            };

            const field = document.getElementById(fieldIds[task]);

            if (!field) {
                addMessage(
                    "I couldn't find the matching CV field. Please check your editor.",
                    "bot"
                );
                return;
            }

            field.value = result;

            // Trigger the CV editor's existing live-update system.
            field.dispatchEvent(
                new Event("input", { bubbles: true })
            );

            actions.remove();

            addMessage(
                "Done! I've added the suggestion to your CV editor. You can still edit it anytime. 💜",
                "bot"
            );
        });

        dismissButton.addEventListener("click", () => {
            actions.remove();

            addMessage(
                "No problem! Your CV remains unchanged. 😊",
                "bot"
            );
        });

        actions.appendChild(applyButton);
        actions.appendChild(dismissButton);

        message.appendChild(actions);
    }

    /* =====================================================
       SEND TASK TO GROQ BACKEND
    ===================================================== */

    async function runTask(task) {
        if (isLoading) return;

        if (!taskLabels[task]) {
            addMessage(
                "I'm not sure what you mean yet. Try one of my quick actions below! 💜",
                "bot"
            );
            return;
        }

        isLoading = true;

        setQuickActionsDisabled(true);

        addMessage(taskLabels[task], "user");

        const loadingMessage = addLoadingMessage();

        try {
            const cvContent = getSafeCVData();


            cvContent.additionalContext = rayrayAdditionalContext;

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    task: task,
                    cv_content: cvContent
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "The AI assistant is unavailable."
                );
            }

            if (!data.success || !data.result) {
                throw new Error("RayRay didn't receive a valid response.");
            }


        loadingMessage.remove();

        console.log("RAYRAY RAW AI RESPONSE:", data.result);

        const result = data.result.trim();

        const isCVContent = /^CV_CONTENT\s*:/i.test(result);
        const isGuidance = /^GUIDANCE\s*:/i.test(result);

        if (isCVContent) {
            const cvContent = result
                .replace(/^CV_CONTENT\s*:\s*/i, "")
                .trim();

            const resultMessage = addMessage(cvContent, "bot");
            addSuggestionActions(resultMessage, task, cvContent);

        } else if (
            isGuidance ||
            task === "generate_summary" ||
            task === "improve_experience" ||
            task === "improve_project"
        ) {
            const guidance = result
                .replace(/^GUIDANCE\s*:\s*/i, "")
                .trim();

            addMessage(guidance, "bot");

        } else {
            addMessage(result, "bot");
        }


        } catch (error) {
            console.error("RayRay error:", error);

            loadingMessage.remove();

            addMessage(
                error.message === "Failed to fetch"
                    ? "I can't reach the WayVia server. Please make sure your Flask backend is running. 💜"
                    : error.message || "Something went wrong. Please try again.",
                "bot"
            );

        } finally {
            isLoading = false;
            setQuickActionsDisabled(false);
        }
    }

    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    quickActions.addEventListener("click", event => {
        const button = event.target.closest("[data-task]");

        if (!button || button.disabled) return;

        runTask(button.dataset.task);
    });

    /* =====================================================
       FREE-TEXT INPUT
       Maps common requests to supported backend tasks.
    ===================================================== */

    function detectTask(message) {
        const text = message.toLowerCase().trim();

        const commands = {
            generate_summary: [
                "improve my summary",
                "generate my summary",
                "write my summary"
            ],
            improve_experience: [
                "improve my experience",
                "improve my work experience"
            ],
            improve_project: [
                "improve my project",
                "improve a project",
                "write my project description"
            ],
            suggest_skills: [
                "suggest relevant skills",
                "suggest skills",
                "recommend skills"
            ],
            review_cv: [
                "review my cv",
                "review my resume",
                "check my cv"
            ]
        };

        for (const [task, phrases] of Object.entries(commands)) {
            if (phrases.includes(text)) {
                return task;
            }
        }

        return null;
}

    form.addEventListener("submit", event => {
        event.preventDefault();

        const message = input.value.trim();

        if (!message || isLoading) return;

        input.value = "";

        const task = detectTask(message);

        if (task) {
            runTask(task);
            return;
        }

        // Treat other messages as additional CV information.
        rayrayAdditionalContext +=
            (rayrayAdditionalContext ? "\n\n" : "") + message;

        addMessage(message, "user");

        addMessage(
            "Got it! 💜 I'll keep this information in mind when helping you with your CV. You can now choose a quick action.",
            "bot"
        );
    });

});
