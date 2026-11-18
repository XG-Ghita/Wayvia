
(function () {
    function updateProfileInitial() {
        const profileInitial = document.getElementById("profileInitial");

        if (!profileInitial) return;

        try {
            const storedUser = JSON.parse(
                localStorage.getItem("wayviaUser")
            ) || {};

            const username = storedUser.username || "User";

            profileInitial.textContent =
                username.trim().charAt(0).toUpperCase() || "U";

        } catch (error) {
            console.error("Could not read WayVia user:", error);
            profileInitial.textContent = "U";
        }
    }

    function setupProfileNavigation() {
        if (document.documentElement.dataset.profileNavigationReady) return;

        document.documentElement.dataset.profileNavigationReady = "true";

        document.addEventListener("click", function (event) {
            const profileButton = event.target.closest("#profileButton");

            if (!profileButton) return;

            window.location.href =
                "https://xg-ghita.github.io/Wayvia/html/profile.html";
        });
    }

    function initializeProfile() {
        updateProfileInitial();
        setupProfileNavigation();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeProfile);
    } else {
        initializeProfile();
    }
})();
