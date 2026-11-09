
/* =========================================================
   WAYVIA — OPPORTUNITIES
   Loads and filters the unified opportunities dataset.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const DATA_URL = "../data/wayvia_opportunities.json";

    const container = document.getElementById("opportunitiesContainer");
    const emptyState = document.getElementById("emptyState");

    const searchInput = document.getElementById("searchInput");
    const domainFilter = document.getElementById("domainFilter");
    const locationFilter = document.getElementById("locationFilter");
    const typeFilter = document.getElementById("typeFilter");
    const studentFilter = document.getElementById("studentFilter");
    const sortFilter = document.getElementById("sortFilter");
    const resetButton = document.getElementById("resetFilters");

    const totalElement = document.getElementById("totalOpportunities");
    const internshipElement = document.getElementById("internshipCount");
    const juniorElement = document.getElementById("juniorCount");
    const locationElement = document.getElementById("locationCount");
    const resultsCount = document.getElementById("resultsCount");

    let allOpportunities = [];

    /* -------------------------
       HELPERS
    ------------------------- */

    function normalize(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function getDomains(opportunity) {
        const domains = opportunity.domains;

        if (Array.isArray(domains)) return domains;
        if (typeof domains === "string") return [domains];

        return [];
    }

    function getDescription(opportunity) {
        return opportunity.description || opportunity.description_excerpt || "";
    }

    function getPriority(opportunity) {
        const value = Number(opportunity.student_priority);
        return Number.isFinite(value) ? value : 3;
    }

    /* -------------------------
    SMART SEARCH
    ------------------------- */

    function parseSearchQuery(value) {
        const query = normalize(value);

        const parsed = {
            domain: "",
            type: "",
            location: "",
            remote: false,
            keywords: []
        };

        let remaining = query;

        // Domain detection
        const domainRules = [
            {
                domain: "ai",
                patterns: [
                    /\bai\b/,
                    /\bartificial intelligence\b/,
                    /\bmachine learning\b/,
                    /\bml\b/,
                    /\bdeep learning\b/
                ]
            },
            {
                domain: "data",
                patterns: [
                    /\bdata\b/,
                    /\bdata science\b/,
                    /\bdata analyst\b/,
                    /\bdata analysis\b/,
                    /\bdata engineering\b/
                ]
            },
            {
                domain: "web",
                patterns: [
                    /\bweb\b/,
                    /\bweb development\b/,
                    /\bfrontend\b/,
                    /\bfront end\b/,
                    /\bbackend\b/,
                    /\bback end\b/
                ]
            },
            {
                domain: "networking",
                patterns: [
                    /\bnetwork\b/,
                    /\bnetworking\b/,
                    /\bsystems administration\b/,
                    /\bsystem administrator\b/
                ]
            }
        ];

        for (const rule of domainRules) {
            if (rule.patterns.some(pattern => pattern.test(remaining))) {
                parsed.domain = rule.domain;

                rule.patterns.forEach(pattern => {
                    remaining = remaining.replace(pattern, " ");
                });

                break;
            }
        }

        // Opportunity type
        if (/\b(internship|intern|internships|stage|stagiaire|stages|pfe|end of studies|fin d etudes|trainee)\b/.test(remaining)) {
            parsed.type = "internship_pfe";
            remaining = remaining.replace(
                /\b(internship|intern|internships|stage|stagiaire|stages|pfe|end of studies|fin d etudes|trainee)\b/g,
                " "
            );
        } else if (/\b(junior|entry level|entry-level|debutant|graduate|fresh graduate)\b/.test(remaining)) {
            parsed.type = "junior_entry_level";
            remaining = remaining.replace(
                /\b(junior|entry level|entry-level|debutant|graduate|fresh graduate)\b/g,
                " "
            );
        }

        // Location detection
        const cities = [
            "casablanca",
            "rabat",
            "marrakech",
            "agadir",
            "fes",
            "meknes",
            "oujda",
            "tangier",
            "tanger"
        ];

        for (const city of cities) {
            const pattern = new RegExp(`\\b${city}\\b`, "i");

            if (pattern.test(remaining)) {
                parsed.location = city === "tanger" ? "tangier" : city;
                remaining = remaining.replace(pattern, " ");
                break;
            }
        }

        // Remote opportunities
        if (/\b(remote|remotely|teletravail|work from home|work remotely)\b/.test(remaining)) {
            parsed.remote = true;
            remaining = remaining.replace(
                /\b(remote|remotely|teletravail|work from home|work remotely)\b/g,
                " "
            );
        }

        // Ignore generic words that don't describe a specific opportunity
        const ignoredWords = new Set([
            "in", "at", "for", "the", "and", "or", "with",
            "a", "an", "of", "on", "morocco", "moroccan",
            "job", "jobs", "opportunity", "opportunities",
            "company", "companies", "offer", "offers",
            "work", "position", "positions"
        ]);

        parsed.keywords = remaining
            .split(/\s+/)
            .filter(word => word && !ignoredWords.has(word));

        return parsed;
    }

    function getTypeLabel(type) {
        const labels = {
            internship_pfe: "Internship / PFE",
            junior_entry_level: "Junior / Entry-level",
            other_relevant: "Other opportunity"
        };

        return labels[type] || "Opportunity";
    }

    function getBadgeClass(type) {
        if (type === "junior_entry_level") return "junior";
        if (type === "other_relevant") return "other";
        return "";
    }

    function getDomainLabel(domain) {
        const labels = {
            ai: "AI & Machine Learning",
            data: "Data",
            web: "Web Development",
            networking: "Networking"
        };

        return labels[normalize(domain)] || domain;
    }

    /* -------------------------
       LOAD DATA
    ------------------------- */

    async function loadOpportunities() {
        try {
            const response = await fetch(DATA_URL);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data.opportunities)) {
                throw new Error("Invalid opportunities dataset format.");
            }

            allOpportunities = data.opportunities;

            populateLocations();
            updateStatistics();
            renderOpportunities();

        } catch (error) {
            console.error("WayVia opportunities error:", error);

            container.innerHTML = `
                <div class="loading-message">
                    Unable to load opportunities.
                    Please check that wayvia_opportunities.json exists
                    in the frontend/data folder.
                </div>
            `;

            resultsCount.textContent = "Data loading failed.";
        }
    }

    /* -------------------------
       LOCATIONS
    ------------------------- */

    function populateLocations() {
        const locations = [
            ...new Set(
                allOpportunities
                    .map(item => String(item.location || "").trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b));

        locations.forEach(location => {
            const option = document.createElement("option");
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }

    /* -------------------------
       STATISTICS
    ------------------------- */

    function updateStatistics() {
        totalElement.textContent = allOpportunities.length;

        internshipElement.textContent = allOpportunities.filter(
            item => item.opportunity_type === "internship_pfe"
        ).length;

        juniorElement.textContent = allOpportunities.filter(
            item => item.opportunity_type === "junior_entry_level"
        ).length;

        locationElement.textContent = new Set(
            allOpportunities
                .map(item => normalize(item.location))
                .filter(Boolean)
        ).size;
    }

    /* -------------------------
       FILTERING
    ------------------------- */

    function getFilteredOpportunities() {
        const parsed = parseSearchQuery(searchInput.value);

        // Combine smart search with manually selected filters.
        const selectedDomain = normalize(domainFilter.value) || parsed.domain;
        const selectedLocation = normalize(locationFilter.value) || parsed.location;
        const selectedType = typeFilter.value || parsed.type;

        const prioritizeStudents = studentFilter.checked;

        let filtered = allOpportunities.filter(opportunity => {

            const domains = getDomains(opportunity).map(normalize);

            const location = normalize(opportunity.location);

            const searchableText = normalize([
                opportunity.title,
                opportunity.company,
                opportunity.location,
                getDescription(opportunity),
                ...getDomains(opportunity),
                opportunity.employment_type,
                opportunity.search_query
            ].join(" "));

            // Domain filter
            if (selectedDomain && !domains.includes(selectedDomain)) {
                return false;
            }

            // Location filter
            if (selectedLocation) {
                const locationMatches =
                    location.includes(selectedLocation) ||
                    (selectedLocation === "tangier" && location.includes("tanger"));

                if (!locationMatches) return false;
            }

            // Remote filter
            if (parsed.remote && !/\b(remote|teletravail)\b/.test(location)) {
                return false;
            }

            // Opportunity type filter
            if (
                selectedType &&
                opportunity.opportunity_type !== selectedType
            ) {
                return false;
            }

            // Student-friendly filter
            if (prioritizeStudents && !opportunity.is_student_friendly) {
                return false;
            }

            // Every remaining keyword must match
            if (
                parsed.keywords.length &&
                !parsed.keywords.every(keyword =>
                    searchableText.includes(keyword)
                )
            ) {
                return false;
            }

            return true;
        });

        // Sorting
        const sort = sortFilter.value;

        if (sort === "priority") {
            filtered.sort((a, b) => getPriority(a) - getPriority(b));
        } else if (sort === "alphabetical") {
            filtered.sort((a, b) =>
                String(a.title || "").localeCompare(String(b.title || ""))
            );
        } else if (sort === "recent") {
            filtered.sort((a, b) =>
                new Date(b.published_at || 0) -
                new Date(a.published_at || 0)
            );
        }

        return filtered;
    }
    /* -------------------------
    RELATED OPPORTUNITIES
    ------------------------- */

    function getRelatedOpportunities() {
        const parsed = parseSearchQuery(searchInput.value);

        const selectedDomain = normalize(domainFilter.value);
        const selectedLocation = normalize(locationFilter.value);
        const selectedType = typeFilter.value;

        return allOpportunities.filter(opportunity => {
            const domains = getDomains(opportunity).map(normalize);
            const location = normalize(opportunity.location);

            const searchableText = normalize([
                opportunity.title,
                opportunity.company,
                opportunity.location,
                getDescription(opportunity),
                ...getDomains(opportunity)
            ].join(" "));

            // Never relax manually selected filters.
            if (selectedDomain && !domains.includes(selectedDomain)) return false;

            if (
                selectedLocation &&
                !location.includes(selectedLocation)
            ) return false;

            if (
                selectedType &&
                opportunity.opportunity_type !== selectedType
            ) return false;

            if (
                studentFilter.checked &&
                !opportunity.is_student_friendly
            ) return false;

            if (
                parsed.location &&
                !location.includes(parsed.location)
            ) return false;

            if (
                parsed.remote &&
                !/\b(remote|teletravail)\b/.test(location)
            ) return false;

            // Keep specific remaining keywords mandatory.
            if (
                parsed.keywords.length &&
                !parsed.keywords.every(keyword =>
                    searchableText.includes(keyword)
                )
            ) return false;

            // When there are no keywords, require at least
            // one of the requested domain/type conditions.
            if (
                !parsed.keywords.length &&
                parsed.domain &&
                parsed.type &&
                !domains.includes(parsed.domain) &&
                opportunity.opportunity_type !== parsed.type
            ) return false;

            if (
                !parsed.keywords.length &&
                parsed.domain &&
                !parsed.type &&
                !domains.includes(parsed.domain)
            ) return false;

            if (
                !parsed.keywords.length &&
                parsed.type &&
                !parsed.domain &&
                opportunity.opportunity_type !== parsed.type
            ) return false;

            return true;
        }).sort((a, b) => getPriority(a) - getPriority(b));
    }
    /* -------------------------
       RENDER CARDS
    ------------------------- */


    function createOpportunityCard(opportunity) {
        const title = escapeHTML(opportunity.title || "Untitled opportunity");
        const company = escapeHTML(opportunity.company || "Company not specified");
        const location = escapeHTML(opportunity.location || "Location not specified");
        const description = escapeHTML(getDescription(opportunity));

        const domains = getDomains(opportunity);
        const opportunityIndex = allOpportunities.indexOf(opportunity);
    const isSaved = window.WayViaApplicationsStorage.isSaved(opportunity);

    const saveButton = `
        <button
            type="button"
            class="save-opportunity-button"
            data-action="save"
            data-opportunity-index="${opportunityIndex}"
            ${isSaved ? "disabled" : ""}
        >
            ${isSaved ? "✓ Saved" : "+ Save"}
        </button>
    `;

        const badgeClass = getBadgeClass(opportunity.opportunity_type);
        const badgeLabel = getTypeLabel(opportunity.opportunity_type);

        const domainTags = domains.map(domain => `
            <span class="domain-tag">${escapeHTML(getDomainLabel(domain))}</span>
        `).join("");

        const applicationURL = String(opportunity.application_url || "").trim();

        const applyButton = `
            <button
                type="button"
                class="apply-button"
                data-action="view-details"
                data-opportunity-index="${opportunityIndex}"
            >
                View & Apply →
            </button>
        `;

        const studentLabel = opportunity.is_student_friendly
            ? `<span class="student-friendly-label">✓ Student-friendly</span>`
            : "";

        const publishedDate = opportunity.published_at
            ? new Date(opportunity.published_at).toLocaleDateString()
            : "";

        const source = escapeHTML(opportunity.source || "External source");

        return `
            <article class="opportunity-card">

                <div class="opportunity-card-top">
                    <div>
                        <h3>${title}</h3>
                        <div class="opportunity-company">${company}</div>
                    </div>

                    <span class="opportunity-badge ${badgeClass}">
                        ${escapeHTML(badgeLabel)}
                    </span>
                </div>

                <p class="opportunity-description">
                    ${description
                        ? description.slice(0, 240) + (description.length > 240 ? "..." : "")
                        : "No description available."}
                </p>

                <div class="opportunity-meta">
                    <span>📍 ${location}</span>
                    ${publishedDate ? `<span>📅 ${escapeHTML(publishedDate)}</span>` : ""}
                    <span>Source: ${source}</span>
                </div>

                <div class="opportunity-domains">
                    ${domainTags}
                </div>

                <div class="opportunity-card-bottom">
                    ${studentLabel}
                    <div class="opportunity-card-actions">
                        ${saveButton}
                        <button
                            type="button"
                            class="analyze-opportunity-button"
                            data-action="analyze"
                            data-opportunity-index="${opportunityIndex}"
                        >
                            ✨ Analyze with AI
                        </button>
                        ${applyButton}
                    </div>
                </div>

            </article>
        `;
    }


    function renderOpportunities() {
        const filtered = getFilteredOpportunities();

        resultsCount.textContent =
            `${filtered.length} opportunit${filtered.length === 1 ? "y" : "ies"} found`;

        container.innerHTML = "";

        if (filtered.length === 0) {
            const related = getRelatedOpportunities();

            emptyState.hidden = false;

            if (related.length > 0) {
                emptyState.innerHTML = `
                    <h3>No exact matches found</h3>
                    <p>Here are some related opportunities you might be interested in:</p>
                `;

                container.innerHTML = `
                    <div class="related-results">
                        <p class="related-label">Related opportunities</p>
                        ${related.map(createOpportunityCard).join("")}
                    </div>
                `;

                resultsCount.textContent =
                    `${related.length} related opportunit${related.length === 1 ? "y" : "ies"} found`;
            } else {
                emptyState.innerHTML = `
                    <h3>No opportunities found</h3>
                    <p>Try changing your keywords or filters.</p>
                `;
            }

            return;
        }

        emptyState.hidden = true;

        container.innerHTML = filtered
            .map(createOpportunityCard)
            .join("");
    }
    container.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const index = Number(button.dataset.opportunityIndex);
        const opportunity = allOpportunities[index];

        if (!opportunity) return;

        // Save opportunity
        if (button.dataset.action === "save") {
            if (button.disabled) return;

            const added = window.WayViaApplicationsStorage.add(opportunity);

            if (added) {
                renderOpportunities();
            }

            return;
        }
        // View opportunity details
        if (button.dataset.action === "view-details") {
            try {
                sessionStorage.setItem(
                    "wayvia_view_opportunity",
                    JSON.stringify(opportunity)
                );

                window.location.href = "opportunity-details.html";

            } catch (error) {
                console.error("Could not store selected opportunity:", error);
                alert("Could not open this opportunity.");
            }

            return;
        }
        // Analyze opportunity with Career Assistant
        if (button.dataset.action === "analyze") {
            try {
                sessionStorage.setItem(
                    "wayvia_selected_opportunity",
                    JSON.stringify(opportunity)
                );

                window.location.href = "assistant.html?analyze=opportunity";

            } catch (error) {
                console.error("Could not store selected opportunity:", error);
                alert("Could not open this opportunity in the AI assistant.");
            }
        }
    });
    /* -------------------------
       EVENTS
    ------------------------- */

    searchInput.addEventListener("input", renderOpportunities);

    domainFilter.addEventListener("change", renderOpportunities);
    locationFilter.addEventListener("change", renderOpportunities);
    typeFilter.addEventListener("change", renderOpportunities);
    studentFilter.addEventListener("change", renderOpportunities);
    sortFilter.addEventListener("change", renderOpportunities);

    resetButton.addEventListener("click", () => {
        searchInput.value = "";
        domainFilter.value = "";
        locationFilter.value = "";
        typeFilter.value = "";
        studentFilter.checked = false;
        sortFilter.value = "priority";

        renderOpportunities();
    });

    /* -------------------------
       START
    ------------------------- */

    loadOpportunities();

});
