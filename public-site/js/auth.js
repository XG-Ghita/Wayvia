/* =========================================================
   WAYVIA — AUTHENTICATION
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const signupForm = document.getElementById("signupForm");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");

const authMessage =
    document.getElementById("authMessage");

const showLogin =
    document.getElementById("showLogin");


/* =========================================================
   SIGN UP
   ========================================================= */

signupForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const username =
        usernameInput.value.trim();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    /* -----------------------------------------------------
       CHECK PASSWORD MATCH
       ----------------------------------------------------- */

    if (password !== confirmPassword) {

        authMessage.textContent =
            "Passwords do not match.";

        return;
    }


    /* -----------------------------------------------------
       CHECK PASSWORD LENGTH
       ----------------------------------------------------- */

    if (password.length < 6) {

        authMessage.textContent =
            "Password must contain at least 6 characters.";

        return;
    }


    /* -----------------------------------------------------
       CREATE USER
       ----------------------------------------------------- */

    const user = {
        username: username,
        email: email
    };


    /* -----------------------------------------------------
       SAVE USER
       ----------------------------------------------------- */

    localStorage.setItem(
        "wayviaUser",
        JSON.stringify(user)
    );


    /* -----------------------------------------------------
       MARK USER AS LOGGED IN
       ----------------------------------------------------- */

    localStorage.setItem(
        "wayviaLoggedIn",
        "true"
    );


    /* -----------------------------------------------------
       REDIRECT TO SEARCH
       ----------------------------------------------------- */

    window.location.href =
        "search.html";

});


/* =========================================================
   SIGN IN
   ========================================================= */

showLogin.addEventListener("click", function () {

    authMessage.textContent =
        "Sign in will be added next.";

});