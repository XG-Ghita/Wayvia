/* =========================================================
   WAYVIA — SEARCH PAGE
   ========================================================= *

   /* =========================================================
   STATE
   ========================================================= */

let filteredCompanies = [];
let selectedCompanyId = null;

let favorites =
    JSON.parse(
        localStorage.getItem("wayviaFavorites") || "[]"
    );

let currentZoom = 1;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await loadCompanies();

        filteredCompanies = [...companies];

        renderCompanies();
        renderMapMarkers();
        setupSearch();
        setupFilters();
        setupSorting();
    }
);


/* =========================================================
   RENDER COMPANIES
   ========================================================= */

function renderCompanies() {

    companyList.innerHTML = "";


    resultCount.textContent =
        `(${filteredCompanies.length} companies)`;


    if (filteredCompanies.length === 0) {

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    filteredCompanies.forEach(
        company => {

            const card =
                createCompanyCard(company);

            companyList.appendChild(card);

        }
    );
}


/* =========================================================
   CREATE COMPANY CARD
   ========================================================= */

function createCompanyCard(company) {

    const card =
        document.createElement("article");


    card.className =
        "company-card";


    card.dataset.id =
        company.id;


    if (
        selectedCompanyId === company.id
    ) {

        card.classList.add("selected");

    }


    const isFavorite =
        favorites.includes(company.id);


    card.innerHTML = `

        <div class="company-logo">
            ${company.initial}
        </div>


        <div class="company-info">

            <div class="company-name-row">

                <h3 class="company-name">
                    ${company.name}
                </h3>

            </div>


            <div class="company-tags">
                ${(company.domains || [])
                    .slice(0, 3)
                    .map(domain => `
                        <span class="company-tag">
                            ${domain}
                        </span>
                    `)
                    .join("")}
            </div>


            <div class="company-location">

                <span class="location-dot"></span>

                ${company.location}

                <span>
                    •
                </span>

                <span>
                    ${company.rating}
                    (${company.reviews} avis)
                </span>

            </div>

        </div>


        <div class="company-actions">

            <span class="match-badge">
                ♙ ${company.match}% match
            </span>


            <button
                class="favorite-button ${
                    isFavorite
                        ? "favorite-active"
                        : ""
                }"
                data-favorite="${company.id}"
                aria-label="Favorite ${
                    company.name
                }"
            >

                ${isFavorite ? "♥" : "♡"}

            </button>

        </div>

    `;


    /* Open company */

    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".favorite-button"
                )
            ) {

                return;
            }


            selectCompany(company.id);

        }
    );


    /* Favorite */

    const favoriteButton =
        card.querySelector(
            ".favorite-button"
        );


    favoriteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleFavorite(company.id);

        }
    );


    return card;
}


/* =========================================================
   SELECT COMPANY
   ========================================================= */

function selectCompany(id) {

    selectedCompanyId = id;


    const company =
        companies.find(
            item => item.id === id
        );


    if (!company) {

        return;
    }


    renderCompanies();

    selectMapMarker(id);

    showMapPopup(company);
}


/* =========================================================
   FAVORITES
   ========================================================= */

function toggleFavorite(id) {

    if (favorites.includes(id)) {

        favorites =
            favorites.filter(
                favoriteId =>
                    favoriteId !== id
            );

    } else {

        favorites.push(id);

    }


    localStorage.setItem(
        "wayviaFavorites",
        JSON.stringify(favorites)
    );


    renderCompanies();
}


/* =========================================================
   SEARCH
   ========================================================= */
let searchSuggestionData = [];

function setupSearch() {
    // Load the generated suggestions from the JSON file.
    async function loadSearchSuggestions() {
        try {
            const response = await fetch(
                "../data/wayvia_search_suggestions.json"
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load suggestions: ${response.status}`
                );
            }

            const suggestions = await response.json();

            if (!Array.isArray(suggestions)) {
                throw new Error("Suggestions must be a JSON array.");
            }

            searchSuggestions.innerHTML = "";

            suggestions.forEach(item => {
                const button = document.createElement("button");

                button.type = "button";
                button.dataset.query = item.query;
                button.dataset.city = item.city;
                button.dataset.group = item.group;
                button.textContent = item.label;

                button.setAttribute("role", "option");

                searchSuggestions.appendChild(button);
            });

            searchSuggestionData = suggestions;

            renderSearchSuggestions("");

        } catch (error) {
            console.error(
                "Could not load WayVia search suggestions:",
                error
            );

            searchSuggestions.innerHTML = `
                <p class="suggestions-loading">
                    Suggestions are temporarily unavailable.
                </p>
            `;
        }
    }

    // Filter and display relevant suggestions.
    function renderSearchSuggestions(value) {
        const term = value.trim().toLowerCase();
        const matches = searchSuggestionData
            .filter(item =>
                item.label.toLowerCase().includes(term) ||
                item.group.toLowerCase().includes(term)
            )
            .slice(0, 8);

        searchSuggestions.innerHTML = "";

        if (matches.length === 0) {
            searchSuggestions.innerHTML = `
                <p class="suggestions-loading">
                    No matching suggestions.
                </p>
            `;
            return;
        }

        matches.forEach(item => {
            const button = document.createElement("button");

            button.type = "button";
            button.dataset.query = item.query;
            button.dataset.city = item.city;
            button.dataset.group = item.group;
            button.textContent = item.label;
            button.setAttribute("role", "option");

            searchSuggestions.appendChild(button);
        });
    }

    searchButton.addEventListener("click", performSearch);

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            performSearch();
        }
    });

    searchInput.addEventListener("input", () => {
        renderSearchSuggestions(searchInput.value);
        searchSuggestions.classList.remove("hidden");
    });

    searchInput.addEventListener("focus", () => {
        renderSearchSuggestions(searchInput.value);
        searchSuggestions.classList.remove("hidden");
    });

    // Use event delegation because suggestion buttons are generated dynamically.
    searchSuggestions.addEventListener("click", event => {
        const button = event.target.closest("button[data-query]");

        if (!button) return;

        searchInput.value = button.dataset.query;
        searchSuggestions.classList.add("hidden");
        searchInput.focus();
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".search-section")) {
            searchSuggestions.classList.add("hidden");
        }
    });

    loadSearchSuggestions();
}



/* =========================================================
   PERFORM SEARCH
   ========================================================= */

function performSearch() {

    const query =
        searchInput.value
            .trim();

    if (!query) {
        return;
    }

    window.location.href =
        `results.html?query=${encodeURIComponent(query)}`;
}


/* =========================================================
   FILTERS
   ========================================================= */

function setupFilters() {

    const filterInputs =
        document.querySelectorAll(
            "[data-filter]"
        );


    filterInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                applyFilters
            );

        }
    );


    clearFilters.addEventListener(
        "click",
        () => {

            filterInputs.forEach(
                input => {

                    input.checked = false;

                }
            );


            filteredCompanies =
                [...companies];

            renderCompanies();

            renderMapMarkers();

        }
    );
}


/* =========================================================
   APPLY FILTERS
   ========================================================= */


function normalizeFilterValue(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function applyFilters() {
    const selectedDomains = getSelectedValues("domain")
        .map(normalizeFilterValue);

    const selectedLocations = getSelectedValues("location")
        .map(normalizeFilterValue);

    const selectedOpportunities = getSelectedValues("opportunity")
        .map(normalizeFilterValue);

    const selectedTechnologies = getSelectedValues("technology")
        .map(normalizeFilterValue);

    filteredCompanies = companies.filter(company => {
        const domains = (company.domains || [])
            .map(normalizeFilterValue);

        const technologies = (company.technologies || [])
            .map(normalizeFilterValue);

        const location = normalizeFilterValue(
            company.city || company.location || ""
        );

        const opportunities = (company.opportunities || [])
            .map(opportunity => {
                if (typeof opportunity === "string") {
                    return normalizeFilterValue(opportunity);
                }

                return normalizeFilterValue([
                    opportunity.type,
                    opportunity.title,
                    opportunity.opportunity_type
                ].filter(Boolean).join(" "));
            });

        const domainMatch =
            selectedDomains.length === 0 ||
            selectedDomains.some(value => domains.includes(value));

        const locationMatch =
            selectedLocations.length === 0 ||
            selectedLocations.includes(location);

        const opportunityMatch =
            selectedOpportunities.length === 0 ||
            selectedOpportunities.some(selected =>
                opportunities.some(opportunity =>
                    opportunity.split(/\s+/).includes(selected) ||
                    opportunity === selected
                )
            );

        const technologyMatch =
            selectedTechnologies.length === 0 ||
            selectedTechnologies.some(value =>
                technologies.includes(value)
            );

        return (
            domainMatch &&
            locationMatch &&
            opportunityMatch &&
            technologyMatch
        );
    });

    renderCompanies();
    renderMapMarkers();
}



/* =========================================================
   GET FILTER VALUES
   ========================================================= */

function getSelectedValues(type) {

    return [
        ...document.querySelectorAll(
            `[data-filter="${type}"]:checked`
        )
    ].map(
        input => input.value
    );
}


/* =========================================================
   SORTING
   ========================================================= */

function setupSorting() {

    sortSelect.addEventListener(
        "change",
        () => {

            const sortType =
                sortSelect.value;


            if (sortType === "match") {

                filteredCompanies.sort(
                    (a, b) =>
                        b.match - a.match
                );

            }


            if (sortType === "rating") {

                filteredCompanies.sort(
                    (a, b) =>
                        b.rating - a.rating
                );

            }


            if (sortType === "reviews") {

                filteredCompanies.sort(
                    (a, b) =>
                        b.reviews - a.reviews
                );

            }


            if (sortType === "name") {

                filteredCompanies.sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );

            }


            renderCompanies();

        }
    );
}


/* =========================================================
   MAP MARKERS
   ========================================================= */

function renderMapMarkers() {

    mapMarkers.innerHTML = "";


    filteredCompanies.forEach(
        company => {

            const marker =
                document.createElement("button");


            marker.className =
                "map-marker";


            marker.dataset.id =
                company.id;


            marker.style.left = "50%";
            marker.style.top = "50%";


            marker.setAttribute(
                "aria-label",
                company.name
            );


            marker.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    selectCompany(
                        company.id
                    );

                }
            );


            mapMarkers.appendChild(marker);

        }
    );
}


/* =========================================================
   SELECT MAP MARKER
   ========================================================= */

function selectMapMarker(id) {

    document
        .querySelectorAll(
            ".map-marker"
        )
        .forEach(marker => {

            marker.classList.toggle(
                "selected",
                marker.dataset.id === String(id)
            );

        });
}


/* =========================================================
   MAP POPUP
   ========================================================= */

function showMapPopup(company) {

    popupName.textContent =
        company.name;


    popupMatch.textContent =
        `${company.match}% match`;


    mapPopup.classList.remove(
        "hidden"
    );
}


closePopup.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        mapPopup.classList.add(
            "hidden"
        );

    }
);


/* =========================================================
   VIEW ON MAP
   ========================================================= */

viewOnMap.addEventListener(
    "click",
    () => {

        const company =
            companies.find(
                item =>
                    item.id === selectedCompanyId
            );


        if (!company) {

            return;
        }


        if (company.mapsUrl) {
            window.open(
                company.mapsUrl,
                "_blank"
            );
        }

    }
);


/* =========================================================
   MAP EXPAND
   ========================================================= */

mapExpand.addEventListener(
    "click",
    () => {

        const mapPanel =
            document.querySelector(
                ".map-panel"
            );


        mapPanel.classList.toggle(
            "map-expanded"
        );

    }
);


/* =========================================================
   MAP ZOOM
   ========================================================= */

zoomIn.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        currentZoom =
            Math.min(
                currentZoom + 0.1,
                1.5
            );


        applyMapZoom();

    }
);


zoomOut.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        currentZoom =
            Math.max(
                currentZoom - 0.1,
                0.8
            );


        applyMapZoom();

    }
);


function applyMapZoom() {

    const mapGrid =
        document.querySelector(
            ".map-grid"
        );


    const roads =
        document.querySelectorAll(
            ".road"
        );


    const labels =
        document.querySelectorAll(
            ".map-label"
        );


    const scale =
        currentZoom;


    mapGrid.style.transform =
        `scale(${scale})`;


    roads.forEach(
        road => {

            road.style.transform =
                `scale(${scale})`;

        }
    );


    labels.forEach(
        label => {

            label.style.transform =
                `scale(${scale})`;

        }
    );
}


/* =========================================================
   AUTH NAVIGATION
   ========================================================= */


   /* =========================================================
   PROFILE INITIAL
   ========================================================= */

const storedUser =
    JSON.parse(localStorage.getItem("wayviaUser")) || {};

const profileInitial =
    document.getElementById("profileInitial");

if (storedUser.username && profileInitial) {
    profileInitial.textContent =
        storedUser.username.charAt(0).toUpperCase();
}


const authNavButton =
    document.getElementById("authNavButton");

function updateAuthButton() {

    const isLoggedIn =
        localStorage.getItem("wayviaLoggedIn") === "true";

    if (isLoggedIn) {

        authNavButton.textContent = "Log out";

    } else {

        authNavButton.textContent = "Get Started";

    }
}


authNavButton.addEventListener(
    "click",
    () => {

        const isLoggedIn =
            localStorage.getItem("wayviaLoggedIn") === "true";

        if (isLoggedIn) {

            localStorage.removeItem("wayviaLoggedIn");

            updateAuthButton();

        } else {

            window.location.href = "auth.html";

        }

    }
);


updateAuthButton();


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

document
    .getElementById("profileButton")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "profile.html";

        }
    );