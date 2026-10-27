/* =========================================================
   WAYVIA — MARKET INSIGHTS
   MOCK DATA
   ========================================================= */


/* =========================================================
   MOCK MARKET DATA
   ========================================================= */

const insightsData = {

    totalCompanies: 347,

    cities: [
        {
            name: "Marrakech",
            value: 68
        },
        {
            name: "Casablanca",
            value: 52
        },
        {
            name: "Rabat",
            value: 34
        },
        {
            name: "Agadir",
            value: 12
        }
    ],

    technologies: [
        {
            name: "Python",
            percentage: 38
        },
        {
            name: "JavaScript",
            percentage: 22
        },
        {
            name: "SQL",
            percentage: 18
        },
        {
            name: "React",
            percentage: 12
        },
        {
            name: "Others",
            percentage: 10
        }
    ],

    sectors: [
        {
            name: "AI / Machine Learning",
            percentage: 28
        },
        {
            name: "Software Development",
            percentage: 24
        },
        {
            name: "Digital Agency",
            percentage: 18
        },
        {
            name: "Data / BI",
            percentage: 12
        },
        {
            name: "Cybersecurity",
            percentage: 8
        },
        {
            name: "Others",
            percentage: 10
        }
    ],

    digitalPresence: [
        {
            name: "Website",
            percentage: 92,
            icon: "◉"
        },
        {
            name: "LinkedIn",
            percentage: 78,
            icon: "in"
        },
        {
            name: "Social Media",
            percentage: 65,
            icon: "◎"
        },
        {
            name: "Google Profile",
            percentage: 46,
            icon: "⌖"
        }
    ],

    hiring: [
        {
            name: "Software",
            percentage: 82
        },
        {
            name: "Data / AI",
            percentage: 67
        },
        {
            name: "Digital",
            percentage: 54
        },
        {
            name: "Cybersecurity",
            percentage: 31
        }
    ],

    didYouKnow:
        "Marrakech has one of the highest concentrations of AI companies in Morocco, with 68 companies listed in our current dataset."
};


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const cityChart =
    document.getElementById("cityChart");

const technologyLegend =
    document.getElementById("technologyLegend");

const sectorList =
    document.getElementById("sectorList");

const digitalList =
    document.getElementById("digitalList");

const hiringList =
    document.getElementById("hiringList");

const companyTotal =
    document.getElementById("companyTotal");

const didYouKnow =
    document.getElementById("didYouKnow");

const profileButton =
    document.getElementById("profileButton");

const reportButton =
    document.getElementById("reportButton");


/* =========================================================
   CITY CHART
   ========================================================= */

function renderCities() {

    cityChart.innerHTML = "";

    const maxValue =
        Math.max(
            ...insightsData.cities.map(
                city => city.value
            )
        );

    insightsData.cities.forEach(
        city => {

            const row =
                document.createElement("div");

            row.className =
                "city-row";

            const percentage =
                (city.value / maxValue) * 100;

            row.innerHTML = `
                <span class="city-name">
                    ${city.name}
                </span>

                <div class="city-track">
                    <div
                        class="city-bar"
                        style="width: ${percentage}%"
                    ></div>
                </div>

                <span class="city-value">
                    ${city.value}
                </span>
            `;

            cityChart.appendChild(row);
        }
    );
}


/* =========================================================
   TECHNOLOGY LEGEND
   ========================================================= */

function renderTechnologies() {

    technologyLegend.innerHTML = "";

    const dotClasses = [
        "purple",
        "blue",
        "cyan",
        "violet",
        "gray"
    ];

    insightsData.technologies.forEach(
        (technology, index) => {

            const item =
                document.createElement("div");

            item.className =
                "legend-item";

            item.innerHTML = `
                <span
                    class="legend-dot"
                    style="
                        background:
                        ${getTechnologyColor(index)}
                    "
                ></span>

                <span class="legend-name">
                    ${technology.name}
                </span>

                <span class="legend-value">
                    ${technology.percentage}%
                </span>
            `;

            technologyLegend.appendChild(item);
        }
    );
}


/* =========================================================
   TECHNOLOGY COLORS
   ========================================================= */

function getTechnologyColor(index) {

    const colors = [
        "#713BFF",
        "#4D82FF",
        "#31C7D5",
        "#8A69FF",
        "#DDE2EF"
    ];

    return colors[index] || colors[0];
}


/* =========================================================
   SECTORS
   ========================================================= */

function renderSectors() {

    sectorList.innerHTML = "";

    insightsData.sectors.forEach(
        (sector, index) => {

            const item =
                document.createElement("div");

            item.className =
                "sector-item";

            item.innerHTML = `
                <span
                    class="sector-dot"
                    style="
                        background:
                        ${getSectorColor(index)}
                    "
                ></span>

                <span class="sector-name">
                    ${sector.name}
                </span>

                <span class="sector-value">
                    ${sector.percentage}%
                </span>
            `;

            sectorList.appendChild(item);
        }
    );
}


/* =========================================================
   SECTOR COLORS
   ========================================================= */

function getSectorColor(index) {

    const colors = [
        "#743CFF",
        "#6C7CFF",
        "#35C5D4",
        "#9A6CFF",
        "#B4B9D4",
        "#E0E4EF"
    ];

    return colors[index] || colors[0];
}


/* =========================================================
   DIGITAL PRESENCE
   ========================================================= */

function renderDigitalPresence() {

    digitalList.innerHTML = "";

    insightsData.digitalPresence.forEach(
        item => {

            const row =
                document.createElement("div");

            row.className =
                "digital-item";

            row.innerHTML = `
                <span class="digital-icon">
                    ${item.icon}
                </span>

                <span class="digital-name">
                    ${item.name}
                </span>

                <div class="digital-track">

                    <div
                        class="digital-bar"
                        style="
                            width:
                            ${item.percentage}%
                        "
                    ></div>

                </div>

                <span class="digital-value">
                    ${item.percentage}%
                </span>
            `;

            digitalList.appendChild(row);
        }
    );
}


/* =========================================================
   HIRING SECTORS
   ========================================================= */

function renderHiring() {

    hiringList.innerHTML = "";

    insightsData.hiring.forEach(
        item => {

            const row =
                document.createElement("div");

            row.className =
                "hiring-item";

            row.innerHTML = `
                <span class="hiring-name">
                    ${item.name}
                </span>

                <div class="hiring-track">

                    <div
                        class="hiring-bar"
                        style="
                            width:
                            ${item.percentage}%
                        "
                    ></div>

                </div>

                <span class="hiring-value">
                    ${item.percentage}%
                </span>
            `;

            hiringList.appendChild(row);
        }
    );
}


/* =========================================================
   INSIGHT TABS
   ========================================================= */

const insightTabs =
    document.querySelectorAll(
        ".insight-tab"
    );

const insightCards =
    document.querySelectorAll(
        ".insight-card"
    );


insightTabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                const category =
                    tab.dataset.section;


                /* -----------------------------
                   Active tab
                   ----------------------------- */

                insightTabs.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                tab.classList.add(
                    "active"
                );


                /* -----------------------------
                   Highlight relevant cards
                   ----------------------------- */

                insightCards.forEach(
                    card => {

                        const cardCategory =
                            card.dataset.category;

                        card.classList.remove(
                            "dimmed",
                            "highlighted"
                        );

                        if (
                            cardCategory ===
                            category
                        ) {

                            card.classList.add(
                                "highlighted"
                            );

                        }

                    }
                );


                /* Remove highlight after a moment */

                setTimeout(
                    () => {

                        insightCards.forEach(
                            card => {

                                card.classList.remove(
                                    "highlighted"
                                );

                            }
                        );

                    },
                    900
                );

            }
        );

    }
);


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

profileButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "profile.html";

    }
);


/* =========================================================
   REPORT BUTTON
   ========================================================= */

reportButton.addEventListener(
    "click",
    () => {

        alert(
            "The detailed market report will be connected to real WayVia market data later."
        );

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeInsights() {

    companyTotal.textContent =
        insightsData.totalCompanies;

    didYouKnow.textContent =
        insightsData.didYouKnow;

    renderCities();

    renderTechnologies();

    renderSectors();

    renderDigitalPresence();

    renderHiring();
}


initializeInsights();