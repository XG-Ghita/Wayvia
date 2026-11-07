
/* =========================================================
   WAYVIA — CV GENERATOR
   Live preview, templates, customization and local drafts.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const STORAGE_KEY = "wayvia_cv_draft";

    const paper = document.getElementById("cvPaper");
    const draftIndicator = document.getElementById("draftIndicator");

    const templateButtons = document.querySelectorAll(".template-option");
    const formInputs = document.querySelectorAll(
        ".cv-editor input:not([type='file']):not([type='color']), .cv-editor textarea"
    );

    const accentColor = document.getElementById("accentColor");
    const colorValue = document.getElementById("colorValue");
    const fontFamily = document.getElementById("fontFamily");

    const photoInput = document.getElementById("profilePhoto");
    const photoPreview = document.getElementById("photoPreview");
    const removePhotoButton = document.getElementById("removePhoto");

    const downloadButtons = [
        document.getElementById("downloadCV"),
        document.getElementById("downloadCVMobile")
    ];

    const resetButton = document.getElementById("resetCV");

    let currentTemplate = "modern";
    let profilePhoto = "";
    let saveTimeout = null;

    /* =====================================================
       HELPERS
    ===================================================== */

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

            if (!["http:", "https:"].includes(url.protocol)) {
                return "";
            }

            return url.href;
        } catch {
            return "";
        }
    }

    function getInputValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function splitItems(value) {
        return String(value || "")
            .split(/[\n,]+/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    function escapeURL(value) {
        return escapeHTML(safeURL(value));
    }

    function setDraftStatus(message) {
        draftIndicator.textContent = message;
    }

    /* =====================================================
       COLLECT FORM DATA
    ===================================================== */

    function collectCVData() {
        return {
            fullName: getInputValue("fullName"),
            professionalTitle: getInputValue("professionalTitle"),
            email: getInputValue("email"),
            phone: getInputValue("phone"),
            city: getInputValue("city"),
            linkedin: getInputValue("linkedin"),
            portfolio: getInputValue("portfolio"),

            targetRole: getInputValue("targetRole"),
            summary: getInputValue("summary"),

            education: getInputValue("education"),
            experience: getInputValue("experience"),
            projects: getInputValue("projects"),

            skills: getInputValue("skills"),
            languages: getInputValue("languages"),
            certifications: getInputValue("certifications"),

            template: currentTemplate,
            accentColor: accentColor.value,
            fontFamily: fontFamily.value,
            profilePhoto
        };
    }

    // Make CV data available to RayRay.
    window.getWayViaCVData = () => collectCVData();
    /* =====================================================
       RENDER CV SECTIONS
    ===================================================== */

    function createSection(title, content) {
        if (!content || !content.trim()) {
            return "";
        }

        return `
            <section class="cv-section">
                <h2 class="cv-section-title">${escapeHTML(title)}</h2>
                <div class="cv-section-content">${escapeHTML(content)}</div>
            </section>
        `;
    }

    function createEducationSection(content) {
        if (!content || !content.trim()) {
            return "";
        }

        const lines = content
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        const institution = lines.shift() || "";
        const details = lines.map(line => `
            <p class="cv-education-detail">${escapeHTML(line)}</p>
        `).join("");

        return `
            <section class="cv-section cv-education">
                <h2 class="cv-section-title">Education</h2>
                <div class="cv-section-content">
                    <h3 class="cv-education-institution">
                        ${escapeHTML(institution)}
                    </h3>
                    ${details}
                </div>
            </section>
        `;
    }



    function createProjectsSection(content) {
        if (!content || !content.trim()) {
            return "";
        }

        const cleaned = content
            .replace(/&#xA;/gi, "\n")
            .replace(/\\([*#-])/g, "$1")
            .replace(/^#{1,6}\s*Projects\s*$/gim, "")
            .trim();

        const headingRegex =
            /^\s*(?:[-*]\s*)?\*\*(WayVia|SignBridge|PriceScope)\s*[–—-]\s*([^*]+)\*\*\s*$/gim;

        const matches = [...cleaned.matchAll(headingRegex)];

        if (matches.length === 0) {
            return createSection("Projects", cleaned);
        }

        let projectHTML = "";

        matches.forEach((match, index) => {
            const start = match.index + match[0].length;

            const end = index + 1 < matches.length
                ? matches[index + 1].index
                : cleaned.length;

            const description = cleaned.slice(start, end).trim();

            const bullets = description
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean)
                .map(line => line.replace(/^[-*•]\s*/, "").trim())
                .filter(Boolean);

            projectHTML += `
                <article class="cv-project-entry">
                    <h3 class="cv-project-name">
                        ${escapeHTML(match[1])} – ${escapeHTML(match[2].trim())}
                    </h3>
                    <ul class="cv-project-list">
                        ${bullets.map(item => `
                            <li>${escapeHTML(item)}</li>
                        `).join("")}
                    </ul>
                </article>
            `;
        });

        return `
            <section class="cv-section">
                <h2 class="cv-section-title">Projects</h2>
                <div class="cv-section-content cv-projects-content">
                    ${projectHTML}
                </div>
            </section>
        `;
    }



    function createExperienceSection(content) {
        if (!content || !content.trim()) {
            return "";
        }

        const cleaned = content
            .replace(/&#xA;/gi, "\n")
            .replace(/\\([*#-])/g, "$1")
            .replace(/\s+/g, " ")
            .trim();

        const headingRegex =
            /(?:^|\s)-?\s*(WayVia|SignBridge|PriceScope)\s*[–—-]\s*([^•]*?)(?=\s*•|$)/g;

        const matches = [...cleaned.matchAll(headingRegex)];

        if (matches.length === 0) {
            return createSection("Experience", content);
        }

        let experienceHTML = "";

        matches.forEach((match, index) => {
            const projectName = match[1];
            const projectTitle = match[2].trim();

            const start = match.index + match[0].length;
            const end = index + 1 < matches.length
                ? matches[index + 1].index
                : cleaned.length;

            const description = cleaned.slice(start, end).trim();

            const bullets = description
                .split(/\s*•\s*/)
                .map(item => item.replace(/^\s*[-–—]\s*/, "").trim())
                .filter(Boolean);

            experienceHTML += `
                <article class="cv-experience-entry">
                    <h3 class="cv-experience-name">
                        ${escapeHTML(projectName)} – ${escapeHTML(projectTitle)}
                    </h3>
                    <ul class="cv-experience-list">
                        ${bullets.map(item => `
                            <li>${escapeHTML(item)}</li>
                        `).join("")}
                    </ul>
                </article>
            `;
        });

        return `
            <section class="cv-section cv-experience">
                <h2 class="cv-section-title">Experience</h2>
                <div class="cv-section-content">
                    ${experienceHTML}
                </div>
            </section>
        `;
    }


    function createSkillsSection(value) {
        const skills = splitItems(value);

        if (!skills.length) return "";

        return `
            <section class="cv-section">
                <h2 class="cv-section-title">Skills</h2>

                <div class="cv-skills">
                    ${skills.map(skill => `
                        <span class="cv-skill">${escapeHTML(skill)}</span>
                    `).join("")}
                </div>
            </section>
        `;
    }

    /* =====================================================
       RENDER CONTACT INFORMATION
    ===================================================== */

    function createContactItem(value, type = "text") {
        if (!value) return "";

        if (type === "email") {
            return `<a href="mailto:${escapeHTML(value)}">${escapeHTML(value)}</a>`;
        }

        if (type === "phone") {
            return escapeHTML(value);
        }

        if (type === "url") {
            const url = safeURL(value);

            if (!url) return "";

            return `<a href="${escapeURL(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(value.replace(/^https?:\/\//, ""))}</a>`;
        }

        return escapeHTML(value);
    }

    function createContactInformation(data) {
        const items = [
            createContactItem(data.email, "email"),
            createContactItem(data.phone, "phone"),
            createContactItem(data.city),
            createContactItem(data.linkedin, "url"),
            createContactItem(data.portfolio, "url")
        ].filter(Boolean);

        return items.length
            ? `<div class="cv-contact">${items.join("<span>•</span>")}</div>`
            : "";
    }

    /* =====================================================
       UPDATE PHOTO PREVIEW
    ===================================================== */

    function updatePhotoPreview() {
        if (profilePhoto) {
            photoPreview.innerHTML = `
                <img src="${profilePhoto}" alt="Professional profile photo">
            `;

            removePhotoButton.hidden = false;
        } else {
            photoPreview.innerHTML = "<span>+</span>";
            removePhotoButton.hidden = true;
        }
    }

    /* =====================================================
       RENDER COMPLETE CV
    ===================================================== */

    function renderCV() {
        const data = collectCVData();

        const name = data.fullName || "Your Name";
        const title = data.professionalTitle || data.targetRole || "Professional Title";

        const photo = data.profilePhoto
            ? `<img class="cv-photo" src="${data.profilePhoto}" alt="Profile photo">`
            : "";

        const contact = createContactInformation(data);

        const summary = createSection("Professional Summary", data.summary);
        const experience = createExperienceSection(data.experience);
        const education = createEducationSection(data.education);
        const projects = createProjectsSection(data.projects);
        const skills = createSkillsSection(data.skills);
        const languages = createSection("Languages", data.languages);
        const certifications = createSection("Certifications", data.certifications);

        paper.className = `cv-paper template-${currentTemplate}`;

        paper.style.setProperty("--cv-accent", data.accentColor);
        paper.style.setProperty("--cv-font", data.fontFamily);
        paper.style.fontFamily = `"${data.fontFamily}", sans-serif`;

        paper.innerHTML = `
            <header class="cv-header">

                ${photo}

                <div class="cv-header-info">
                    <h1 class="cv-name">${escapeHTML(name)}</h1>

                    <p class="cv-professional-title">
                        ${escapeHTML(title)}
                    </p>

                    ${contact}
                </div>

            </header>

            ${summary}
            ${experience}
            ${education}
            ${projects}
            ${skills}
            ${languages}
            ${certifications}

            ${!data.summary &&
              !data.experience &&
              !data.education &&
              !data.projects &&
              !data.skills &&
              !data.languages &&
              !data.certifications
                ? `<p class="cv-placeholder">Your CV content will appear here as you complete the form.</p>`
                : ""
            }
        `;
    }

    /* =====================================================
       TEMPLATE SELECTION
    ===================================================== */

    function selectTemplate(template) {
        const allowedTemplates = [
            "modern",
            "minimal",
            "professional",
            "creative"
        ];

        if (!allowedTemplates.includes(template)) return;

        currentTemplate = template;

        templateButtons.forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.template === template
            );
        });

        renderCV();
        saveDraft();
    }

    templateButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectTemplate(button.dataset.template);
        });
    });

    /* =====================================================
       COLOR CUSTOMIZATION
    ===================================================== */

    function updateColor() {
        const color = accentColor.value;

        colorValue.textContent = color.toUpperCase();

        renderCV();
        saveDraft();
    }

    accentColor.addEventListener("input", updateColor);

    document.querySelectorAll(".color-presets button").forEach(button => {
        button.addEventListener("click", () => {
            accentColor.value = button.dataset.color;
            updateColor();
        });
    });

    /* =====================================================
       FONT CUSTOMIZATION
    ===================================================== */

    fontFamily.addEventListener("change", () => {
        renderCV();
        saveDraft();
    });

    /* =====================================================
       PHOTO UPLOAD
    ===================================================== */

    photoInput.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Please upload a JPG, PNG or WebP image.");
            photoInput.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Your photo must be smaller than 2 MB.");
            photoInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            profilePhoto = reader.result;

            updatePhotoPreview();
            renderCV();
            saveDraft();
        };

        reader.onerror = () => {
            alert("Unable to read this image. Please try another one.");
        };

        reader.readAsDataURL(file);
    });

    removePhotoButton.addEventListener("click", () => {
        profilePhoto = "";
        photoInput.value = "";

        updatePhotoPreview();
        renderCV();
        saveDraft();
    });

    /* =====================================================
       LOCAL DRAFT STORAGE
    ===================================================== */

    function saveDraft() {
        clearTimeout(saveTimeout);

        setDraftStatus("Saving...");

        saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(collectCVData())
                );

                setDraftStatus("Draft saved");
            } catch (error) {
                console.error("Could not save CV draft:", error);

                setDraftStatus("Could not save draft");
            }
        }, 350);
    }

    function loadDraft() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) return false;

            const data = JSON.parse(saved);

            if (!data || typeof data !== "object") return false;

            const fields = [
                "fullName",
                "professionalTitle",
                "email",
                "phone",
                "city",
                "linkedin",
                "portfolio",
                "targetRole",
                "summary",
                "education",
                "experience",
                "projects",
                "skills",
                "languages",
                "certifications"
            ];

            fields.forEach(id => {
                const element = document.getElementById(id);

                if (element && typeof data[id] === "string") {
                    element.value = data[id];
                }
            });

            const allowedTemplates = [
                "modern",
                "minimal",
                "professional",
                "creative"
            ];

            currentTemplate = allowedTemplates.includes(data.template)
                ? data.template
                : "modern";

            const validColor = /^#[0-9a-f]{6}$/i.test(data.accentColor || "")
                ? data.accentColor
                : "#6c3cff";

            accentColor.value = validColor;

            const allowedFonts = [
                "Arial",
                "Georgia",
                "Verdana",
                "Trebuchet MS",
                "Tahoma"
            ];

            fontFamily.value = allowedFonts.includes(data.fontFamily)
                ? data.fontFamily
                : "Arial";

            if (
                typeof data.profilePhoto === "string" &&
                /^data:image\/(jpeg|png|webp);base64,/i.test(data.profilePhoto)
            ) {
                profilePhoto = data.profilePhoto;
            }

            return true;

        } catch (error) {
            console.error("Could not load CV draft:", error);
            return false;
        }
    }

    /* =====================================================
       RESET CV
    ===================================================== */

    function resetCV() {
        const overlay = document.createElement("div");
        overlay.className = "delete-modal-overlay";

        overlay.innerHTML = `
            <div class="delete-modal" role="dialog"
                aria-modal="true" aria-labelledby="clearCVModalTitle">

                <div class="delete-modal-icon">!</div>

                <h3 id="clearCVModalTitle">Clear your CV?</h3>

                <p>
                    Are you sure you want to clear all your CV information?
                    This will remove your saved draft.
                </p>

                <div class="delete-modal-actions">
                    <button type="button" class="cancel-delete">
                        Cancel
                    </button>

                    <button type="button" class="confirm-delete">
                        Clear CV
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
            formInputs.forEach(input => {
                input.value = "";
            });

            currentTemplate = "modern";
            profilePhoto = "";

            accentColor.value = "#6c3cff";
            fontFamily.value = "Arial";
            photoInput.value = "";

            updatePhotoPreview();

            templateButtons.forEach(button => {
                button.classList.toggle(
                    "selected",
                    button.dataset.template === "modern"
                );
            });

            renderCV();

            try {
                localStorage.removeItem(STORAGE_KEY);
                setDraftStatus("New CV");
            } catch (error) {
                setDraftStatus("Draft not saved");
            }

            closeModal();
        });

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeModal();
        });

        overlay.querySelector(".cancel-delete").focus();
    }

    resetButton.addEventListener("click", resetCV);

    /* =====================================================
       PDF EXPORT
    ===================================================== */

    function downloadPDF() {
        const name = getInputValue("fullName");

        if (!name) {
            alert("Please enter your full name before downloading your CV.");
            document.getElementById("fullName").focus();
            return;
        }

        window.print();
    }

    downloadButtons.forEach(button => {
        if (button) {
            button.addEventListener("click", downloadPDF);
        }
    });

    /* =====================================================
       LIVE FORM UPDATES
    ===================================================== */

    formInputs.forEach(input => {
        input.addEventListener("input", () => {
            renderCV();
            saveDraft();
        });
    });

    /* =====================================================
       INITIALIZE
    ===================================================== */

    loadDraft();

    updatePhotoPreview();

    templateButtons.forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.template === currentTemplate
        );
    });

    colorValue.textContent = accentColor.value.toUpperCase();

    renderCV();

    setDraftStatus("Draft saved");

});
