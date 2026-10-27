/* =========================================================
   WAYVIA — SEARCH RESULTS
   ========================================================= */


/* =========================================================
   DOM
   ========================================================= */

const companyList =
    document.getElementById("companyList");

const resultsCount =
    document.getElementById("resultsCount");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const sortSelect =
    document.getElementById("sortSelect");

const clearFilters =
    document.getElementById("clearFilters");

const modifySearch =
    document.getElementById("modifySearch");

const profileButton =
    document.getElementById("profileButton");

const mapPopup =
    document.getElementById("mapPopup");

const mapCompanyName =
    document.getElementById("mapCompanyName");

const mapCompanyButton =
    document.getElementById("mapCompanyButton");


/* =========================================================
   STATE
   ========================================================= */

let filteredCompanies = [];

let selectedMapCompany = null;

let companyMap = null;
let companyMapMarkers = null;



function initializeCompanyMap() {
    const mapElement = document.getElementById("companyMap");

    if (!mapElement || typeof L === "undefined") {
        console.error("Map container or Leaflet library is missing.");
        return;
    }

    if (companyMap) return;

    companyMap = L.map(mapElement).setView([31.633213, -8.0042049], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(companyMap);

    companyMapMarkers = L.layerGroup().addTo(companyMap);
}



function updateCompanyMap(companyList) {
    if (!companyMap || !companyMapMarkers) return;

    companyMapMarkers.clearLayers();

    const mapTitle = document.getElementById("mapTitle");
    const mapCount = document.getElementById("mapCompanyCount");
    const query = searchInput?.value.trim();

    if (mapTitle) {
        mapTitle.textContent = query || "All companies in Morocco";
    }

    if (mapCount) {
        mapCount.textContent =
            `${companyList.length} ${companyList.length === 1 ? "company" : "companies"}`;
    }

    const bounds = [];

    companyList.forEach(company => {
        const latitude = Number(company.locationCoordinates?.latitude);
        const longitude = Number(company.locationCoordinates?.longitude);

        // Skip companies without valid coordinates.
        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180 ||
            (latitude === 0 && longitude === 0)
        ) {
            return;
        }

        const marker = L.circleMarker([latitude, longitude], {
            radius: 4,
            color: "#ffffff",
            weight: 1,
            fillColor: "#7B2CBF",
            fillOpacity: 0.9
        });

        marker.bindPopup(
            `<strong>${escapeHTML(company.name || "Company")}</strong>`
        );

        marker.addTo(companyMapMarkers);
        bounds.push([latitude, longitude]);
    });

    if (bounds.length > 0) {
        companyMap.fitBounds(bounds, {
            padding: [25, 25],
            maxZoom: 12
        });
    } else {
        companyMap.setView([31.633213, -8.0042049], 6);
    }

    // Ensure the map displays correctly after its container renders.
    setTimeout(() => companyMap.invalidateSize(), 100);
}



/* =========================================================
   RENDER COMPANIES
   ========================================================= */

function renderCompanies(data) {

    companyList.innerHTML = "";


    resultsCount.textContent =
        `Results (${data.length} companies)`;


    if (data.length === 0) {

        companyList.innerHTML = `

            <div class="no-results">

                <h3>
                    No companies found
                </h3>

                <p>
                    Try changing your search or filters.
                </p>

            </div>

        `;

        return;
    }


    data.forEach(company => {

        const card =
            document.createElement("article");


        card.className =
            "company-card";


        card.dataset.companyId =
            company.id;


        card.innerHTML = `

            <div class="company-logo ${company.logoStyle}">

                ${escapeHTML(company.initial)}

            </div>


            <div class="company-info">

                <div class="company-name-row">

                    <span class="company-name">

                        ${escapeHTML(company.name)}

                    </span>

                    ${
                        company.verified
                            ? `<span class="verified">✓</span>`
                            : ""
                    }

                </div>


                <div class="company-tags">

                    ${(company.domains || [])
                        .slice(0, 3)
                        .map(
                            tag =>
                                `<span class="company-tag">
                                    ${escapeHTML(tag)}
                                </span>`
                        )
                        .join("")
                    }

                </div>


                <div class="company-meta">

                    <span>
                        📍 ${escapeHTML(company.location)}
                    </span>

                    <span class="rating">
                        ★ ${company.rating ?? "N/A"}
                    </span>

                    <span>
                        (${company.reviews} reviews)
                    </span>

                </div>

            </div>


            <span class="match-badge">

                ${company.match}% match

            </span>


            <button
                class="card-heart"
                aria-label="Save ${escapeHTML(company.name)}"
                data-save-id="${company.id}"
            >
                ♡
            </button>

        `;


        /* ================================================
           COMPANY CARD → COMPANY PROFILE
        ================================================= */

        card.addEventListener(
            "click",
            event => {

                /*
                 * Don't navigate when clicking
                 * the heart button.
                 */

                if (
                    event.target.closest(
                        ".card-heart"
                    )
                ) {
                    return;
                }


                openCompanyProfile(
                    company.id
                );

            }
        );


        /* ================================================
           SAVE BUTTON
        ================================================= */

        const heart =
            card.querySelector(
                ".card-heart"
            );


        heart.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleFavorite(
                    company.id,
                    heart
                );

            }
        );


        companyList.appendChild(card);

    });

}


/* =========================================================
   OPEN COMPANY PROFILE
   ========================================================= */

function openCompanyProfile(companyId) {

    /*
     * For now we send the company ID
     * through the URL.

     * Later company.js will use this ID
     * to request the real company from
     * the backend/database.
     */

    window.location.href =
        `company.html?id=${encodeURIComponent(companyId)}`;

}


/* =========================================================
   FILTERS
   ========================================================= */

function syncFiltersWithQuery() {
    const normalize = value =>
        String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

    const query = normalize(searchInput.value);

    // Reset city and domain filters before applying the new query.
    document.querySelectorAll(".domain-filter, .location-filter")
        .forEach(checkbox => {
            checkbox.checked = false;
        });

    const cities = [
        "Marrakech", "Agadir", "Casablanca", "Rabat",
        "Fes", "Oujda", "Meknes", "Tangier"
    ];

    const cityCheckboxes = [...document.querySelectorAll(".location-filter")];

    const matchedCity = cities.find(city =>
        new RegExp(`\\bin\\s+${city}\\b`, "i").test(query)
    );

    if (matchedCity) {
        cityCheckboxes.forEach(checkbox => {
            if (normalize(checkbox.value || checkbox.parentElement.textContent) === normalize(matchedCity)) {
                checkbox.checked = true;
            }
        });
    }

    const domainRules = [
        {
            filter: "AI",
            pattern: /\b(ai|artificial intelligence|machine learning)\b/i
        },
        {
            filter: "Development",
            pattern: /\b(software development|web development|software developer|web developer)\b/i
        },
        {
            filter: "Data Science",
            pattern: /\b(data science|data analytics|data analysis)\b/i
        },
        {
            filter: "Digital",
            pattern: /\b(digital agencies|digital agency|digital marketing)\b/i
        },
        {
            filter: "Cybersecurity",
            pattern: /\b(cybersecurity|cyber security)\b/i
        }
    ];

    const domainCheckboxes = [...document.querySelectorAll(".domain-filter")];

    domainRules.forEach(rule => {
        if (rule.pattern.test(query)) {
            domainCheckboxes.forEach(checkbox => {
                const label = normalize(
                    checkbox.value || checkbox.parentElement.textContent
                );

                if (label === normalize(rule.filter)) {
                    checkbox.checked = true;
                }
            });
        }
    });
}


function applyFilters() {
    const normalize = value =>
        String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

    const search = normalize(searchInput.value);

    const domains = getCheckedValues(".domain-filter").map(normalize);
    const locations = getCheckedValues(".location-filter").map(normalize);
    const technologies = getCheckedValues(".technology-filter").map(normalize);

    const cities = [
        "Marrakech", "Agadir", "Casablanca", "Rabat",
        "Fes", "Oujda", "Meknes", "Tangier"
    ];

    // Recognize collection-style searches, such as:
    // "AI companies in Marrakech"
    const selectedCity = cities.find(city =>
        new RegExp(
            `\\bin\\s+${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i"
        ).test(search)
    );

    const isCollectionSearch =
        /\bcompanies\s+in\b/i.test(search) ||
        /\bstartups\s+in\b/i.test(search);

    const categoryTerms = [
        {
            group: "AI",
            pattern: /^(artificial intelligence|ai|machine learning|ai consulting)\b/i,
            terms: ["artificial intelligence", "machine learning", "ai"]
        },
        {
            group: "Development",
            pattern: /^(software development|web development)\b/i,
            terms: ["software development", "web development", "software developer"]
        },
        {
            group: "Data",
            pattern: /^(data analytics|data science)\b/i,
            terms: ["data analytics", "data science", "data analysis"]
        },
        {
            group: "Digital",
            pattern: /^digital agencies\b/i,
            terms: ["digital agency", "digital marketing", "digital services"]
        },
        {
            group: "Startup",
            pattern: /^technology startups\b/i,
            terms: ["technology startup", "tech startup"]
        }
    ];

    const selectedCategory = isCollectionSearch
        ? categoryTerms.find(category => category.pattern.test(search))
        : null;

    // Remove generic search words and city/country names from ordinary text search.
    const ignoredWords = new Set([
        "companies", "company", "in", "morocco", "startups", "startup"
    ]);

    const queryTokens = search
        .split(/\s+/)
        .filter(Boolean)
        .filter(token => !ignoredWords.has(token))
        .filter(token => !cities.some(city => normalize(city) === token));

    filteredCompanies = companies.filter(company => {
        const companyDomains = (company.domains || []).map(normalize);
        const companyTechnologies = [
            ...(company.technologies || []),
            ...(company.enrichment?.technologyEvidence || [])
        ].map(normalize);

        const opportunityList = (company.opportunities || []);

        const searchableText = normalize([
            company.name,
            company.city,
            company.location,
            company.address,
            company.website,
            company.description,
            company.primaryType,
            ...companyDomains,
            ...companyTechnologies,
            ...(company.enrichment?.sectorEvidence || []),
            ...opportunityList.flatMap(op => [
                op.title, op.type, op.description, op.opportunity_type
            ])
        ].filter(Boolean).join(" "));

        // For collection-style searches, interpret city/category separately.
        if (isCollectionSearch && selectedCity) {
            if (normalize(company.city) !== normalize(selectedCity)) {
                return false;
            }
        }

        if (selectedCategory) {
            const categoryMatch = selectedCategory.terms.some(term =>
                searchableText.includes(normalize(term))
            );

            if (!categoryMatch) return false;
        } else if (queryTokens.length) {
            if (!queryTokens.every(token => searchableText.includes(token))) {
                return false;
            }
        }

        // Respect any manually selected filters as well.

        const domainKeywords = {
            "ai": [
                "artificial intelligence",
                "machine learning",
                "deep learning",
                "ai"
            ],
            "data science": [
                "data science",
                "data analytics",
                "data analysis"
            ],
            "development": [
                "software development",
                "web development",
                "software developer",
                "web developer"
            ],
            "digital": [
                "digital agency",
                "digital agencies",
                "digital marketing"
            ],
            "cybersecurity": [
                "cybersecurity",
                "cyber security"
            ]
        };


        if (domains.length) {
            // When the query already identifies a collection, it is the main
            // source of matching results. Don't narrow those results again
            // using incomplete company-domain metadata.
            const queryDefinesCategory =
                /\b(artificial intelligence|ai|machine learning|software development|web development|data science|data analytics|data analysis|digital agencies|digital agency|digital marketing|cybersecurity|cyber security)\b/i.test(search);

            if (!queryDefinesCategory) {
                const matchesSelectedDomain = domains.some(domain => {
                    const keywords = domainKeywords[domain] || [domain];

                    return keywords.some(keyword => {
                        if (keyword === "ai") {
                            return /\b(ai|artificial intelligence|machine learning|deep learning)\b/i.test(searchableText);
                        }

                        return searchableText.includes(keyword);
                    });
                });

                if (!matchesSelectedDomain) {
                    return false;
                }
            }
        }



        if (
            locations.length &&
            !locations.includes(normalize(company.city))
        ) {
            return false;
        }

        if (
            technologies.length &&
            !technologies.some(technology =>
                companyTechnologies.some(value => value.includes(technology)) ||
                normalize(company.description).includes(technology)
            )
        ) {
            return false;
        }

        return true;
    });

    sortCompanies();
}



/* =========================================================
   SORT
   ========================================================= */

function sortCompanies() {

    const sort =
        sortSelect.value;


    if (sort === "match") {

        filteredCompanies.sort(
            (a, b) =>
                b.match - a.match
        );

    }


    else if (sort === "rating") {

        filteredCompanies.sort(
            (a, b) =>
                b.rating - a.rating
        );

    }


    else if (sort === "reviews") {

        filteredCompanies.sort(
            (a, b) =>
                b.reviews - a.reviews
        );

    }


    else if (sort === "name") {

        filteredCompanies.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );

    }


    renderCompanies(
        filteredCompanies
    );

    updateCompanyMap(filteredCompanies);

}


/* =========================================================
   GET CHECKED VALUES
   ========================================================= */

function getCheckedValues(selector) {

    return [
        ...document.querySelectorAll(
            `${selector}:checked`
        )
    ].map(
        checkbox =>
            checkbox.value
    );

}


/* =========================================================
   SEARCH
   ========================================================= */


function performResultsSearch() {
    const query = searchInput.value.trim();

    const params = new URLSearchParams(window.location.search);

    if (query) {
        params.set("query", query);
    } else {
        params.delete("query");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    window.history.replaceState({}, "", newUrl);
    syncFiltersWithQuery();

    applyFilters();
}

searchButton.addEventListener("click", performResultsSearch);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        performResultsSearch();
    }
});



/* =========================================================
   FILTER CHANGE
   ========================================================= */

document
    .querySelectorAll(
        ".domain-filter, .location-filter, .opportunity-filter, .technology-filter"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                applyFilters
            );

        }
    );


/* =========================================================
   SORT CHANGE
   ========================================================= */

sortSelect.addEventListener(
    "change",
    sortCompanies
);


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

clearFilters.addEventListener(
    "click",
    () => {

        document
            .querySelectorAll(
                ".filter-group input"
            )
            .forEach(
                checkbox => {
                    checkbox.checked = false;
                }
            );


        searchInput.value = "";


        filteredCompanies =
            [...companies];


        sortCompanies();

    }
);


/* =========================================================
   MODIFY SEARCH
   ========================================================= */

modifySearch.addEventListener(
    "click",
    () => {

        window.location.href =
            "search.html";

    }
);


/* =========================================================
   PROFILE
   ========================================================= */

profileButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "profile.html";

    }
);


/* =========================================================
   FAVORITES
   ========================================================= */

function toggleFavorite(
    companyId,
    button
) {

    const key =
        `wayvia_saved_${companyId}`;


    const saved =
        localStorage.getItem(key)
        === "true";


    if (saved) {

        localStorage.removeItem(key);

        button.textContent = "♡";

    } else {

        localStorage.setItem(
            key,
            "true"
        );

        button.textContent = "♥";

    }

}


/* =========================================================
   MAP MARKERS
   ========================================================= */

document
    .querySelectorAll(".map-marker")
    .forEach(marker => {

        marker.addEventListener(
            "click",
            () => {

                const companyName =
                    marker.dataset.company;


                const company =
                    companies.find(
                        item =>
                            item.name ===
                            companyName
                    );


                if (!company) {
                    return;
                }


                selectedMapCompany =
                    company;


                mapCompanyName.textContent =
                    company.name;


                mapPopup.style.display =
                    "flex";

            }
        );

    });


/* =========================================================
   MAP COMPANY BUTTON
   ========================================================= */

if (mapCompanyButton) {
    mapCompanyButton.addEventListener("click", () => {
        // Keep the existing callback body here.
    });
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value;

    return element.innerHTML;

}


/* =========================================================
   INITIALIZE — wait for the real JSON before rendering
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadCompanies();
        filteredCompanies = [...companies];
        initializeCompanyMap();

        const params = new URLSearchParams(window.location.search);
        const query = (params.get('query') || '').trim();

        if (query && searchInput) searchInput.value = query;

        // Clear old selections first, then apply the filters from this query.
        document.querySelectorAll('.domain-filter, .location-filter, .technology-filter')
            .forEach(input => { input.checked = false; });

        if (query) {
            syncFiltersWithQuery();
        }


        if (query) {
            applyFilters();
        } else {
            renderCompanies(filteredCompanies);
            updateCompanyMap(filteredCompanies);
        }
    } catch (error) {
        resultsCount.textContent = 'Company data could not be loaded';
        companyList.innerHTML = '<div class="no-results"><h3>Unable to load companies</h3><p>Please run the site through a local web server and refresh the page.</p></div>';
    }
});