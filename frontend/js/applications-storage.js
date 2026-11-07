
/* =========================================================
   WAYVIA — SHARED APPLICATION STORAGE
   Used by Opportunities and My Applications pages.
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "wayvia_applications";

    function getAll() {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            console.error("WayVia storage error:", error);
            return [];
        }
    }

    function saveAll(applications) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }

    function createId(opportunity) {
        const url = String(opportunity.application_url || "").trim();

        if (url) {
            return url.split("?")[0].replace(/\/$/, "").toLowerCase();
        }

        return [
            opportunity.title,
            opportunity.company,
            opportunity.location
        ]
            .map(value => String(value || "").trim().toLowerCase())
            .join("|");
    }

    function isSaved(opportunity) {
        const id = createId(opportunity);
        return getAll().some(application => application.id === id);
    }

    function add(opportunity) {
        const applications = getAll();
        const id = createId(opportunity);

        if (applications.some(application => application.id === id)) {
            return false;
        }

        applications.push({
            ...opportunity,
            id,
            status: "saved",
            application_date: "",
            notes: "",
            saved_at: new Date().toISOString()
        });

        saveAll(applications);
        return true;
    }

    function update(id, updates) {
        const applications = getAll();
        const index = applications.findIndex(application => application.id === id);

        if (index === -1) return false;

        applications[index] = {
            ...applications[index],
            ...updates,
            id: applications[index].id
        };

        saveAll(applications);
        return true;
    }

    function remove(id) {
        const applications = getAll();
        const updated = applications.filter(application => application.id !== id);

        if (updated.length === applications.length) return false;

        saveAll(updated);
        return true;
    }

    window.WayViaApplicationsStorage = {
        getAll,
        add,
        update,
        remove,
        isSaved
    };
})();
