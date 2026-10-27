/* =========================================================
   WAYVIA — PROFILE PAGE
   ========================================================= */


/* =========================================================
   MOCK USER DATA
   ========================================================= */

const storedUser =
    JSON.parse(localStorage.getItem("wayviaUser")) || {};

const user = {
    name: storedUser.username || "User",
    status: storedUser.status || "AI Student · Year 2",
    field: storedUser.field || "Artificial Intelligence",

    skills: storedUser.skills || [
        "Python",
        "SQL",
        "Pandas",
        "Machine Learning",
        "Data Analysis"
    ],

    locations: storedUser.locations || [
        "Marrakech",
        "Casablanca",
        "Rabat"
    ],

    opportunities: storedUser.opportunities || [
        "PFE",
        "Internship"
    ],

    experience: storedUser.experience || "Student"
};


/* =========================================================
   MOCK FAVORITES
   ========================================================= */

const favorites = [

    {
        id: "artificial-ma",
        name: "Artificial.ma",
        category: "AI · Development",
        location: "Marrakech",
        logo: "A",
        color: ""
    },

    {
        id: "monark-it",
        name: "Monark IT",
        category: "Software · Digital",
        location: "Marrakech",
        logo: "M",
        color: "blue"
    },

    {
        id: "devise",
        name: "Devise",
        category: "Development · Mobile",
        location: "Marrakech",
        logo: "C",
        color: "green"
    },

    {
        id: "powabu",
        name: "POWABU",
        category: "Data · Cloud",
        location: "Marrakech",
        logo: "P",
        color: "purple"
    }

];


/* =========================================================
   MOCK SEARCH HISTORY
   ========================================================= */

const searchHistory = [

    {
        query: "AI companies in Marrakech",
        date: "Today",
        results: 27
    },

    {
        query: "Python internship Marrakech",
        date: "Yesterday",
        results: 14
    },

    {
        query: "Data Analyst PFE Morocco",
        date: "Sep 17",
        results: 31
    },

    {
        query: "Machine Learning companies",
        date: "Sep 15",
        results: 19
    }

];


/* =========================================================
   RECENTLY VIEWED
   ========================================================= */

const recentlyViewed = [

    {
        id: "artificial-ma",
        name: "Artificial.ma",
        category: "AI · Development",
        location: "Marrakech",
        logo: "A",
        match: "92% match"
    },

    {
        id: "monark-it",
        name: "Monark IT",
        category: "AI · Tech",
        location: "Marrakech",
        logo: "M",
        match: "85% match"
    },

    {
        id: "devise",
        name: "Devise",
        category: "Development",
        location: "Marrakech",
        logo: "C",
        match: "79% match"
    }

];


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const favoritesList =
    document.getElementById("favoritesList");

const historyList =
    document.getElementById("historyList");

const recentList =
    document.getElementById("recentList");

const userName =
    document.getElementById("userName");    

const profileInitial =
    document.getElementById("profileInitial");

const profileAvatar =
    document.getElementById("profileAvatar");

const fieldValue =
    document.getElementById("fieldValue");

const userStatus = 
    document.getElementById("userStatus");    

const skillsContainer =
    document.getElementById("skillsContainer");    

const editProfileButton =
    document.getElementById("editProfileButton");

const ctaEditButton =
    document.getElementById("ctaEditButton");

const profileButton =
    document.getElementById("profileButton");

const viewAllButton =
    document.getElementById("viewAllButton");

const locationsContainer =
    document.getElementById("locationsContainer");

const opportunitiesContainer =
    document.getElementById("opportunityContainer");

const experienceValue =
    document.getElementById("experienceValue");    


userName.textContent = user.name;
userStatus.textContent = user.status;

profileInitial.textContent =
    user.name.charAt(0).toUpperCase();

profileAvatar.textContent =
    user.name.charAt(0).toUpperCase();    

console.log("Username:", user.name);
console.log("Profile initial:", profileInitial.textContent);


/* =========================================================
   RENDER FAVORITES
   ========================================================= */

function renderFavorites() {

    favoritesList.innerHTML = "";

    favorites.forEach(company => {

        const article =
            document.createElement("article");

        article.className = "company-item";

        article.innerHTML = `

            <div class="company-logo ${company.color}">
                ${company.logo}
            </div>

            <div class="company-info">

                <strong>
                    ${escapeHTML(company.name)}
                </strong>

                <span>
                    ${escapeHTML(company.category)}
                </span>

                <div class="company-location">
                    ◉ ${escapeHTML(company.location)}
                </div>

            </div>

            <button
                class="favorite-heart"
                aria-label="Remove favorite"
            >
                ♥
            </button>

        `;


        /* OPEN COMPANY PROFILE */

        article.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".favorite-heart"
                    )
                ) {
                    return;
                }

                openCompanyProfile(
                    company.id
                );

            }
        );


        /* REMOVE FAVORITE */

        const heart =
            article.querySelector(
                ".favorite-heart"
            );

        heart.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                article.remove();

            }
        );


        favoritesList.appendChild(article);

    });

}


/* =========================================================
   RENDER SEARCH HISTORY
   ========================================================= */

function renderHistory() {

    historyList.innerHTML = "";

    searchHistory.forEach(search => {

        const article =
            document.createElement("article");

        article.className = "history-item";

        article.innerHTML = `

            <div class="history-query">
                ${escapeHTML(search.query)}
            </div>

            <div class="history-meta">

                <span>
                    ${escapeHTML(search.date)}
                </span>

                <span>
                    ${search.results} results
                </span>

            </div>

        `;

        historyList.appendChild(article);

    });

}


/* =========================================================
   RENDER RECENTLY VIEWED
   ========================================================= */

function renderRecentlyViewed() {

    recentList.innerHTML = "";

    recentlyViewed.forEach(company => {

        const article =
            document.createElement("article");

        article.className = "recent-item";

        article.innerHTML = `

            <div class="recent-logo">
                ${company.logo}
            </div>

            <div class="recent-info">

                <strong>
                    ${escapeHTML(company.name)}
                </strong>

                <span>
                    ${escapeHTML(company.category)}
                    · ${escapeHTML(company.location)}
                </span>

            </div>

            <span class="recent-match">
                ${escapeHTML(company.match)}
            </span>

        `;

        article.addEventListener(
            "click",
            () => {
                openCompanyProfile(company.id);
            }
        );

        recentList.appendChild(article);

    });

}


function renderSkills() {
    skillsContainer.innerHTML = "";

    user.skills.forEach(skill => {
        const tag = document.createElement("span");
        tag.className = "profile-tag";
        tag.textContent = skill;
        skillsContainer.appendChild(tag);
    });
}

function editSkills() {
    const existingSkills =
        Array.from(
            skillsContainer.querySelectorAll(".profile-tag")
        ).map(tag => tag.textContent.trim());

    skillsContainer.innerHTML = "";

    existingSkills.forEach(skill => {
        const tag = document.createElement("span");

        tag.className = "profile-tag";
        tag.contentEditable = "true";
        tag.textContent = skill;

        skillsContainer.appendChild(tag);
    });

    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.className = "add-skill-button";
    addButton.textContent = "+";

    addButton.addEventListener("click", () => {
        const newTag = document.createElement("span");

        newTag.className = "profile-tag skill-input";
        newTag.contentEditable = "true";
        newTag.textContent = "";

        skillsContainer.insertBefore(
            newTag,
            addButton
        );

        newTag.focus();
    });

    skillsContainer.appendChild(addButton);
}


function renderLocations() {
    locationsContainer.innerHTML = "";

    user.locations.forEach(location => {
        const tag = document.createElement("span");

        tag.className = "profile-tag";
        tag.textContent = location;

        locationsContainer.appendChild(tag);
    });
}


function editLocations() {
    locationsContainer.innerHTML = "";

    user.locations.forEach(location => {
        const tag = document.createElement("span");

        tag.className = "profile-tag";
        tag.contentEditable = "true";
        tag.textContent = location;

        locationsContainer.appendChild(tag);
    });

    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.className = "add-skill-button";
    addButton.textContent = "+";

    addButton.addEventListener("click", () => {
        const newTag = document.createElement("span");

        newTag.className = "profile-tag skill-input";
        newTag.contentEditable = "true";
        newTag.textContent = "";

        locationsContainer.insertBefore(
            newTag,
            addButton
        );

        newTag.focus();
    });

    locationsContainer.appendChild(addButton);
}


function renderOpportunities() {
    opportunitiesContainer.innerHTML = "";

    user.opportunities.forEach(opportunity => {
        const tag = document.createElement("span");

        tag.className = "profile-tag";
        tag.textContent = opportunity;

        opportunitiesContainer.appendChild(tag);
    });
}

function editOpportunities() {
    opportunitiesContainer.innerHTML = "";

    user.opportunities.forEach(opportunity => {
        const tag = document.createElement("span");

        tag.className = "profile-tag";
        tag.contentEditable = "true";
        tag.textContent = opportunity;

        opportunitiesContainer.appendChild(tag);
    });

    const addButton = document.createElement("button");

    addButton.type = "button";
    addButton.className = "add-skill-button";
    addButton.textContent = "+";

    addButton.addEventListener("click", () => {
        const newTag = document.createElement("span");

        newTag.className = "profile-tag skill-input";
        newTag.contentEditable = "true";
        newTag.textContent = "";

        opportunitiesContainer.insertBefore(
            newTag,
            addButton
        );

        newTag.focus();
    });

    opportunitiesContainer.appendChild(addButton);
}


function renderExperience() {
    experienceValue.innerHTML = "";

    experienceValue.textContent = user.experience;
}

function editExperience() {

    experienceValue.innerHTML = "";

    const select = document.createElement("select");

    select.className = "experience-select";

    const experienceLevels = [
        "Student",
        "Entry Level",
        "Junior",
        "Intermediate",
        "Experienced"
    ];

    experienceLevels.forEach(level => {

        const option = document.createElement("option");

        option.value = level;
        option.textContent = level;

        if (level === user.experience) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    experienceValue.appendChild(select);
}


/* =========================================================
   PROFILE EDIT
   ========================================================= */

function editProfile() {

    const isEditing =
        userName.getAttribute("contenteditable") === "true";

    /* =====================================================
       START EDITING
       ===================================================== */

    if (!isEditing) {

        userName.setAttribute(
            "contenteditable",
            "true"
        );

        userStatus.setAttribute(
            "contenteditable", 
            "true"
        );

        fieldValue.setAttribute(
            "contenteditable",
            "true"
        );

        /* EDIT SKILLS */
        editSkills();

        /* EDIT LOCATIONS */
        editLocations();

        /* EDIT OPPORTUNITIES */
        editOpportunities();

        /* EDIT EXPERIENCE */
        editExperience();

        userName.focus();

        editProfileButton.textContent = "Save";
        ctaEditButton.textContent = "Save";

    }

    /* =====================================================
       SAVE
       ===================================================== */

    else {

        /* -----------------------------------------------
           BASIC PROFILE
           ----------------------------------------------- */

        const newName =
            userName.textContent.trim();

        const newStatus = 
            userStatus.textContent.trim();    

        const newField =
            fieldValue.textContent
                .replace("◫", "")
                .trim();

        const experienceSelect =
            experienceValue.querySelector(".experience-select");

        const newExperience =
            experienceSelect
                ? experienceSelect.value
                : user.experience;


        /* -----------------------------------------------
           VALIDATION
           ----------------------------------------------- */

        if (!newName || !newStatus || !newField || !newExperience) {
            return;
        }


        /* -----------------------------------------------
           GET SKILLS
           ----------------------------------------------- */

        const newSkills =
            Array.from(
                skillsContainer.querySelectorAll(".profile-tag")
            )
            .map(tag => tag.textContent.trim())
            .filter(skill => skill);


        /* -----------------------------------------------
           GET LOCATIONS
           ----------------------------------------------- */

        const newLocations =
            Array.from(
                locationsContainer.querySelectorAll(".profile-tag")
            )
            .map(tag => tag.textContent.trim())
            .filter(location => location);


        /* -----------------------------------------------
           GET OPPORTUNITIES
           ----------------------------------------------- */

        const newOpportunities =
            Array.from(
                opportunitiesContainer.querySelectorAll(".profile-tag")
            )
            .map(tag => tag.textContent.trim())
            .filter(opportunity => opportunity);


        /* -----------------------------------------------
           UPDATE USER OBJECT
           ----------------------------------------------- */

        user.name = newName;
        user.status = newStatus;
        user.field = newField;
        user.skills = newSkills;
        user.locations = newLocations;
        user.opportunities = newOpportunities;
        user.experience = newExperience;


        /* -----------------------------------------------
           SAVE TO LOCAL STORAGE
           ----------------------------------------------- */

        const updatedUser = {
            ...storedUser,
            username: newName,
            status: newStatus,
            field: newField,
            skills: newSkills,
            locations: newLocations,
            opportunities: newOpportunities,
            experience: newExperience
        };


        localStorage.setItem(
            "wayviaUser",
            JSON.stringify(updatedUser)
        );


        /* -----------------------------------------------
           UPDATE PROFILE AVATAR
           ----------------------------------------------- */
        userName.textContent = user.name;
        userStatus.textContent = user.status;

        fieldValue.innerHTML = `
            <span class="value-icon">◫</span>
            ${escapeHTML(user.field)}
        `;

        profileInitial.textContent =
            user.name.charAt(0).toUpperCase();

        profileAvatar.textContent =
            user.name.charAt(0).toUpperCase();


        /* -----------------------------------------------
           EXIT EDIT MODE
           ----------------------------------------------- */

        userName.setAttribute(
            "contenteditable",
            "false"
        );

        fieldValue.setAttribute(
            "contenteditable",
            "false"
        );

        userStatus.setAttribute(
            "contenteditable", 
            "false"
        );



        /* -----------------------------------------------
           RE-RENDER TAGS
           ----------------------------------------------- */

        renderSkills();

        renderLocations();

        renderOpportunities();

        renderExperience();


        /* -----------------------------------------------
           RESET BUTTONS
           ----------------------------------------------- */

        editProfileButton.textContent = "Edit";

        ctaEditButton.textContent =
            "✎ Edit profile";
    }
}


/* =========================================================
   OPEN COMPANY PROFILE
   ========================================================= */

function openCompanyProfile(companyId) {

    window.location.href =
        `company.html?id=${encodeURIComponent(companyId)}`;

}


/* =========================================================
   TABS
   ========================================================= */

const activityTabs =
    document.querySelectorAll(
        ".activity-tab"
    );

const activityContents =
    document.querySelectorAll(
        ".activity-content"
    );


activityTabs.forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            const target =
                tab.dataset.tab;


            activityTabs.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            activityContents.forEach(content => {

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
   PROFILE BUTTON
   ========================================================= */

profileButton.addEventListener(
    "click",
    () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


/* =========================================================
   EDIT BUTTONS
   ========================================================= */

editProfileButton.addEventListener(
    "click",
    editProfile
);

ctaEditButton.addEventListener(
    "click",
    editProfile
);


/* =========================================================
   VIEW ALL
   ========================================================= */

viewAllButton.addEventListener(
    "click",
    () => {

        const historyTab =
            document.querySelector(
                '[data-tab="history"]'
            );

        if (historyTab) {
            historyTab.click();
        }

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
   INITIALIZE
   ========================================================= */

renderFavorites();
renderHistory();
renderRecentlyViewed();

renderSkills();
renderLocations();
renderOpportunities();
renderExperience();

/* =========================================================
   PROFILE LOGOUT
   ========================================================= */

const logoutProfileButton =
    document.getElementById("logoutProfileButton");

logoutProfileButton.addEventListener("click", () => {

    localStorage.removeItem("wayviaLoggedIn");

    window.location.href = "search.html";

});