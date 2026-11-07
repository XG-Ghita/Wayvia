// ==========================================
// WAYVIA — STATIC LANDING PAGE
// ==========================================

const startButton = document.getElementById("startSearch");

if (startButton) {
    startButton.addEventListener("click", () => {
        window.location.href = "search.html";
    });
}
