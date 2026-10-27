/* =========================================================
   WAYVIA — COMPANY PROFILE
   ========================================================= */


/* =========================================================
   COMPANY SELECTION — populated after the shared JSON loads
   ========================================================= */
const companyId = new URLSearchParams(window.location.search).get('id');
let company = null;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const backButton =
    document.getElementById("backButton");

const saveButton =
    document.getElementById("saveButton");

const saveText =
    document.getElementById("saveText");

const profileButton =
    document.getElementById("profileButton");

const visitWebsite =
    document.getElementById("visitWebsite");

const openMaps =
    document.getElementById("openMaps");

const whyMatch =
    document.getElementById("whyMatch");

const companyName =
    document.getElementById("companyName");

const companyInitial =
    document.getElementById("companyInitial");  
    
const companyTags =
    document.getElementById("companyTags");    

const companyRating =
    document.getElementById("companyRating");

const companyReviews =
    document.getElementById("companyReviews");    

const companyLocation =
    document.getElementById("companyLocation");

const companyPhone =
    document.getElementById("companyPhone");

const companyWebsite =
    document.getElementById("companyWebsite");

const companyEmail =
    document.getElementById("companyEmail");

const companyDescription =
    document.getElementById("companyDescription");

const matchPercentage =
    document.getElementById("matchPercentage");

const technologyList =
    document.getElementById("technologyList");

const opportunityList =
    document.getElementById("opportunityList");


/* =========================================================
   RENDER COMPANY
   ========================================================= */

function renderCompany() {

    companyName.textContent =
        company.name;

    companyInitial.textContent =
        company.name.charAt(0);    

    renderCompanyTags();    

    companyRating.textContent =
        company.rating;

    companyReviews.textContent =
        `(${company.reviews} reviews)`;    

    companyLocation.textContent =
        company.location;

    companyPhone.textContent =
        company.phone;

    companyWebsite.textContent = (company.website || '').replace(/^https?:\/\//, '') || 'Website unavailable';

    companyEmail.textContent =
        company.email;

    companyDescription.textContent =
        company.description;

    matchPercentage.textContent =
        `${company.match}%`;


    renderTechnologies();

    renderOpportunities();

}


/* =========================================================
   TECHNOLOGIES
   ========================================================= */

function renderTechnologies() {

    technologyList.innerHTML = "";


    (company.technologies || []).forEach(
        technology => {

            const tag =
                document.createElement("span");

            tag.textContent =
                technology;

            technologyList.appendChild(tag);

        }
    );

}

function renderCompanyTags() {
    companyTags.innerHTML = "";

    (company.domains || []).forEach(domain => {
        const tag = document.createElement("span");
        tag.textContent = domain;
        companyTags.appendChild(tag);
    });
}


/* =========================================================
   OPPORTUNITIES
   ========================================================= */

function renderOpportunities() {

    opportunityList.innerHTML = "";


    (company.opportunities || []).forEach(
        (opportunity, index) => {

            const article =
                document.createElement("article");

            article.className =
                "opportunity";


            const colors = [
                "purple",
                "blue",
                "red"
            ];


            article.innerHTML = `

                <div class="opportunity-icon ${colors[index % colors.length]}">

                    ${index === 0 ? "◉" : index === 1 ? "◇" : "●"}

                </div>


                <div class="opportunity-info">

                    <strong>
                        ${escapeHTML(opportunity.title)}
                    </strong>

                    <span>
                        ${escapeHTML(opportunity.type)}
                    </span>

                </div>


                <div class="opportunity-location">

                    ${escapeHTML(opportunity.location)}

                </div>


                <span class="opportunity-arrow">
                    ›
                </span>

            `;


            article.addEventListener(
                "click",
                () => {

                    console.log(
                        "Selected opportunity:",
                        opportunity
                    );

                }
            );


            opportunityList.appendChild(article);

        }
    );

}


/* =========================================================
   TABS
   ========================================================= */

const tabs =
    document.querySelectorAll(".tab");

const tabContents =
    document.querySelectorAll(".tab-content");


tabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            const target =
                tab.dataset.tab;


            tabs.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            tabContents.forEach(content => {

                content.classList.remove(
                    "active"
                );

            });


            tab.classList.add(
                "active"
            );


            const targetContent =
                document.getElementById(
                    target
                );


            if (targetContent) {

                targetContent.classList.add(
                    "active"
                );

            }

        }
    );

});


/* =========================================================
   BACK TO RESULTS
   ========================================================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "search.html";

    }
);


/* =========================================================
   SAVE COMPANY
   ========================================================= */

let favorites =
    JSON.parse(
        localStorage.getItem("wayviaFavorites")
    ) || [];

let saved = false;


function updateSaveButton() {

    if (saved) {

        saveText.textContent =
            "Saved";

        saveButton.querySelector(
            ".heart-icon"
        ).textContent = "♥";

    } else {

        saveText.textContent =
            "Save";

        saveButton.querySelector(
            ".heart-icon"
        ).textContent = "♡";

    }

}


saveButton.addEventListener(
    "click",
    () => {

        saved = !saved;


        if (saved) {
            favorites.push(company.id);
        } else {
            favorites = favorites.filter(
                id => id !== company.id
            );
        }

        localStorage.setItem(
            "wayviaFavorites",
            JSON.stringify(favorites)
        );


        updateSaveButton();

    }
);


/* =========================================================
   VISIT WEBSITE
   ========================================================= */

visitWebsite.addEventListener(
    "click",
    () => {

        if (company?.website) window.open(company.website, '_blank', 'noopener,noreferrer');

    }
);


/* =========================================================
   GOOGLE MAPS
   ========================================================= */

openMaps.addEventListener(
    "click",
    () => {

        if (company?.mapsUrl) window.open(company.mapsUrl, '_blank', 'noopener,noreferrer');

    }
);


/* =========================================================
   WHY MATCH?
   ========================================================= */

whyMatch.addEventListener(
    "click",
    () => {

        alert(
            "Match explanation:\n\n" +
            "✓ AI / Machine Learning\n" +
            "✓ Python\n" +
            "✓ SQL\n" +
            "✓ Development\n" +
            "✓ Marrakech\n\n" +
            "These criteria match your current profile."
        );

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
   SECURITY HELPER
   ========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


/* =========================================================
   INITIALIZE — load data before looking up the requested company
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadCompanies();
        company = companies.find(item => item.id === companyId);

        if (!company) {
            companyName.textContent = 'Company not found';
            companyDescription.textContent = 'This company could not be found in the current WayVia dataset. Return to search and select a company again.';
            [saveButton, visitWebsite, openMaps, whyMatch].forEach(button => {
                if (button) button.disabled = true;
            });
            return;
        }

        saved = favorites.includes(company.id);
        renderCompany();
        updateSaveButton();
    } catch (error) {
        companyName.textContent = 'Unable to load company';
        companyDescription.textContent = 'Please run WayVia through a local web server and refresh this page.';
    }
});