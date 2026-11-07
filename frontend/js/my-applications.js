
/* =========================================================
   WAYVIA — APPLICATION TRACKER
   Uses the shared applications storage system.
   ========================================================= */

(() => {
    "use strict";

    const storage = window.WayViaApplicationsStorage;

    if (!storage) {
        console.error("WayVia shared storage is not loaded.");
        return;
    }

    const container = document.getElementById("applicationsContainer");
    const emptyState = document.getElementById("applicationsEmpty");
    const statusFilter = document.getElementById("statusFilter");

    const totalApplications = document.getElementById("totalApplications");
    const appliedCount = document.getElementById("appliedCount");
    const interviewCount = document.getElementById("interviewCount");
    const acceptedCount = document.getElementById("acceptedCount");

    const STATUS_LABELS = {
        saved: "Saved",
        applied: "Applied",
        interview: "Interview",
        accepted: "Accepted",
        rejected: "Rejected"
    };

    let applications = storage.getAll();

    /* HELPERS */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function safeURL(value) {
        try {
            const url = new URL(String(value || ""));

            return ["http:", "https:"].includes(url.protocol)
                ? url.href
                : "";
        } catch {
            return "";
        }
    }

    function formatStatus(status) {
        return STATUS_LABELS[status] || "Saved";
    }

    function refreshApplications() {
        applications = storage.getAll();
    }

    /* ADD AN OPPORTUNITY */

    function addOpportunity(opportunity) {
        if (!opportunity || typeof opportunity !== "object") {
            return false;
        }

        const added = storage.add(opportunity);

        refreshApplications();
        renderApplications();

        return added;
    }

    /* STATISTICS */

    function renderStatistics() {
        totalApplications.textContent = applications.length;

        appliedCount.textContent = applications.filter(
            item => item.status === "applied"
        ).length;

        interviewCount.textContent = applications.filter(
            item => item.status === "interview"
        ).length;

        acceptedCount.textContent = applications.filter(
            item => item.status === "accepted"
        ).length;
    }

    /* APPLICATION CARD */

    function createApplicationCard(application) {
        const title = escapeHTML(application.title);
        const company = escapeHTML(application.company);
        const location = escapeHTML(application.location);

        const status = STATUS_LABELS[application.status]
            ? application.status
            : "saved";

        const date = escapeHTML(application.application_date || "");
        const notes = escapeHTML(application.notes || "");
        const url = safeURL(application.application_url);

        const viewLink = url
            ? `<a class="application-view-link"
                  href="${escapeHTML(url)}"
                  target="_blank"
                  rel="noopener noreferrer">
                    View original opportunity ↗
               </a>`
            : "";

        return `
            <article class="application-card"
                     data-id="${escapeHTML(application.id)}">

                <div class="application-card-header">
                    <div>
                        <h3>${title}</h3>
                        <div class="application-company">${company}</div>
                        <div class="application-location">📍 ${location}</div>
                    </div>

                    <span class="application-status ${status}">
                        ${formatStatus(status)}
                    </span>
                </div>

                <div class="application-controls">

                    <div class="application-field">
                        <label>Application status</label>
                        <select data-field="status">
                            ${Object.entries(STATUS_LABELS).map(([value, label]) => `
                                <option value="${value}"
                                    ${status === value ? "selected" : ""}>
                                    ${label}
                                </option>
                            `).join("")}
                        </select>
                    </div>

                    <div class="application-field">
                        <label>Application date</label>
                        <input
                            type="date"
                            data-field="application_date"
                            value="${date}"
                        >
                    </div>

                    <div class="application-field">
                        <label>Personal notes</label>
                        <textarea
                            data-field="notes"
                            placeholder="Add interview details, reminders or other notes..."
                        >${notes}</textarea>
                    </div>

                    <div class="application-card-actions">
                        ${viewLink}

                        <button
                            type="button"
                            class="remove-application"
                            data-action="remove"
                        >
                            Remove
                        </button>
                    </div>

                </div>
            </article>
        `;
    }

    /* RENDER APPLICATIONS */

    function renderApplications() {
        refreshApplications();
        renderStatistics();

        const selectedStatus = statusFilter.value;

        const filtered = applications.filter(application => {
            return selectedStatus === "all" ||
                application.status === selectedStatus;
        });

        container.innerHTML = filtered
            .map(createApplicationCard)
            .join("");

        emptyState.hidden = filtered.length > 0;
        container.hidden = filtered.length === 0;
    }

    /* UPDATE APPLICATION */

    function updateApplication(id, field, value) {
        const allowedFields = [
            "status",
            "application_date",
            "notes"
        ];

        if (!allowedFields.includes(field)) return;

        if (field === "status" && !STATUS_LABELS[value]) return;

        const updated = storage.update(id, {
            [field]: value
        });

        if (updated) {
            renderApplications();
        }
    }

    /* REMOVE APPLICATION */


    function removeApplication(id) {
        const overlay = document.createElement("div");
        overlay.className = "delete-modal-overlay";

        overlay.innerHTML = `
            <div class="delete-modal" role="dialog"
                aria-modal="true" aria-labelledby="deleteModalTitle">

                <div class="delete-modal-icon">!</div>

                <h3 id="deleteModalTitle">Remove application?</h3>

                <p>
                    Are you sure you want to remove this opportunity
                    from your application tracker?
                </p>

                <div class="delete-modal-actions">
                    <button type="button" class="cancel-delete">
                        Cancel
                    </button>

                    <button type="button" class="confirm-delete">
                        Remove
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const closeModal = () => {
            document.removeEventListener("keydown", handleEscape);
            overlay.remove();
        };

        const handleEscape = event => {
            if (event.key === "Escape") closeModal();
        };

        document.addEventListener("keydown", handleEscape);

        overlay.querySelector(".cancel-delete").addEventListener("click", closeModal);

        overlay.querySelector(".confirm-delete").addEventListener("click", () => {
            storage.remove(id);
            closeModal();
            renderApplications();
        });

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeModal();
        });

        overlay.querySelector(".cancel-delete").focus();
    }


    /* EVENTS */

    statusFilter.addEventListener("change", renderApplications);

    container.addEventListener("change", event => {
        const field = event.target.dataset.field;
        const card = event.target.closest(".application-card");

        if (!field || !card) return;

        updateApplication(card.dataset.id, field, event.target.value);
    });

    container.addEventListener("click", event => {
        const button = event.target.closest('[data-action="remove"]');

        if (!button) return;

        const card = button.closest(".application-card");

        if (card) {
            removeApplication(card.dataset.id);
        }
    });

    /* PUBLIC API */

    window.WayViaApplications = {
        add: addOpportunity,
        getAll: () => storage.getAll(),
        isSaved: opportunity => storage.isSaved(opportunity)
    };

    /* INITIALIZE */

    renderApplications();

})();
