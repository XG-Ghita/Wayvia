document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("opportunity-details");

    let opportunity;

    try {
        opportunity = JSON.parse(
            sessionStorage.getItem("wayvia_view_opportunity")
        );
    } catch (error) {
        console.error("Could not read selected opportunity:", error);
    }

    if (!opportunity) {
        container.innerHTML = `
            <div class="details-error">
                <h2>Opportunity not found</h2>
                <p>Please return to the opportunities page and select an offer.</p>
            </div>
        `;
        return;
    }

    const safeText = value =>
        String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);

    // Convert the source description into plain text.
    const description = String(opportunity.description || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();

    const title = safeText(opportunity.title || "Untitled opportunity");
    const company = safeText(opportunity.company || "Company not specified");
    const location = safeText(opportunity.location || "Not specified");
    const type = safeText(
        String(opportunity.opportunity_type || "Not specified")
            .replace(/_/g, " ")
    );
    const experience = safeText(
        String(opportunity.experience_level || "Not specified")
            .replace(/_/g, " ")
    );
    const salary = safeText(opportunity.salary || "Not specified");
    const source = safeText(opportunity.source || "External source");
    const publishedDate = opportunity.published_at
        ? safeText(new Date(opportunity.published_at).toLocaleDateString())
        : "Not specified";

    const isValidURL = value => {
        try {
            const url = new URL(value || "");
            return ["http:", "https:"].includes(url.protocol)
                ? url.href
                : "";
        } catch {
            return "";
        }
    };

    const applicationMethod = opportunity.application_method || "jooble";

    const employerEmail = String(
        opportunity.employer_email || ""
    ).trim();

    const verifiedEmail =
        applicationMethod === "email" &&
        opportunity.email_verified === true &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employerEmail);

    const employerURL = isValidURL(
        opportunity.direct_application_url
    );

    const joobleURL = isValidURL(
        opportunity.application_url
    );

    let applicationAction = "";

    if (verifiedEmail) {
        const subject = encodeURIComponent(
            `Application for ${opportunity.title || "Opportunity"}`
        );

        const body = encodeURIComponent(
            `Dear Recruitment Team,\n\nI would like to apply for ${opportunity.title || "this opportunity"} at ${opportunity.company || "your company"}.\n\nPlease find my CV attached.\n\nBest regards,`
        );

        applicationAction = `
            <a
                href="mailto:${safeText(employerEmail)}?subject=${subject}&body=${body}"
                class="external-apply-button"
            >
                Prepare Email Application
            </a>
        `;
    } else if (
        applicationMethod === "external_portal" &&
        employerURL
    ) {
        applicationAction = `
            <a
                href="${safeText(employerURL)}"
                class="external-apply-button"
                target="_blank"
                rel="noopener noreferrer"
            >
                Apply on Employer Website
            </a>
        `;
    } else if (joobleURL) {
        applicationAction = `
            <a
                href="${safeText(joobleURL)}"
                class="external-apply-button"
                target="_blank"
                rel="noopener noreferrer"
            >
                View on Jooble
            </a>
        `;
    }

    container.innerHTML = `
        <article class="details-card">

            <header class="details-header">
                <h1>${title}</h1>
                <div class="details-company">${company}</div>

                <div class="details-badges">
                    <span class="details-badge">${type}</span>
                    ${opportunity.is_student_friendly
                        ? '<span class="details-badge">Student-friendly</span>'
                        : ""}
                </div>
            </header>

            <section class="details-meta">
                <div class="details-meta-item">
                    <span>Location</span>
                    <strong>${location}</strong>
                </div>

                <div class="details-meta-item">
                    <span>Salary</span>
                    <strong>${salary}</strong>
                </div>

                <div class="details-meta-item">
                    <span>Experience</span>
                    <strong>${experience}</strong>
                </div>

                <div class="details-meta-item">
                    <span>Published</span>
                    <strong>${publishedDate}</strong>
                </div>

                <div class="details-meta-item">
                    <span>Source</span>
                    <strong>${source}</strong>
                </div>
            </section>

            <section class="details-description">
                <h2>About this opportunity</h2>
                <p>${safeText(description || "No description is available for this opportunity.")}</p>
            </section>

            <div class="details-actions">
                <button type="button" class="track-button" id="track-opportunity">
                    Track this opportunity
                </button>

                ${applicationAction}
            </div>

            <p class="details-notice">
                You can save this opportunity to My Applications and update
                its status after applying. Applications are completed through
                the original application destination.
            </p>

        </article>
    `;

    const trackButton = document.getElementById("track-opportunity");

    if (window.WayViaApplicationsStorage.isSaved(opportunity)) {
        trackButton.textContent = "Already in My Applications";
        trackButton.disabled = true;
    }

    trackButton.addEventListener("click", () => {
        const added = window.WayViaApplicationsStorage.add(opportunity);

        if (added) {
            trackButton.textContent = "Added to My Applications ✓";
            trackButton.disabled = true;
        } else {
            trackButton.textContent = "Already in My Applications";
            trackButton.disabled = true;
        }
    });
});