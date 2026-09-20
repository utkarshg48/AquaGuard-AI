/* =========================================================
   AQUAGUARD AI — LOGIN
   Demo authentication for the academic prototype.

   IMPORTANT:
   - Login session is stored ONLY in sessionStorage.
   - localStorage is NOT used for authentication.
   - "Remember this device" remembers only the username.
   - Old authentication keys are removed automatically.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initLogin();
});


/* =========================================================
   LOGIN INITIALIZATION
   ========================================================= */

function initLogin() {

    /*
       Clean up authentication keys created by older
       versions of the project.

       This prevents an old persistent login from
       bringing the user back into the dashboard.
    */
    clearOldAuthenticationKeys();

    initLoginForm();
    initPasswordToggle();
    initHelpButton();
    restoreRememberedName();

    /*
       If the page was reached after signing out,
       show a small confirmation.
    */
    const params =
        new URLSearchParams(
            window.location.search
        );

    if (
        params.get("logout") === "1"
    ) {
        showMessage(
            "You have been signed out successfully.",
            "info"
        );

        /*
           Remove ?logout=1 from the URL
           without reloading the page.
        */
        window.history.replaceState(
            {},
            document.title,
            "login.html"
        );
    }
}


/* =========================================================
   REMOVE OLD AUTHENTICATION DATA
   ========================================================= */

function clearOldAuthenticationKeys() {

    /*
       Current authentication key:
       - sessionStorage only
    */

    /*
       Old persistent authentication keys
       from previous versions.
    */
    localStorage.removeItem(
        "aquaguardPersistentSession"
    );

    localStorage.removeItem(
        "aquaguardSession"
    );

    localStorage.removeItem(
        "aquaguardAuth"
    );

    sessionStorage.removeItem(
        "aquaguardPersistentSession"
    );

    sessionStorage.removeItem(
        "aquaguardAuth"
    );
}


/* =========================================================
   LOGIN FORM
   ========================================================= */

function initLoginForm() {

    const form =
        document.getElementById(
            "login-form"
        );

    const usernameInput =
        document.getElementById(
            "username"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const rememberMe =
        document.getElementById(
            "remember-me"
        );

    const loginButton =
        document.getElementById(
            "signin-button"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage();

            const username =
                usernameInput
                    ?.value
                    .trim() || "";

            const password =
                passwordInput
                    ?.value || "";

            /*
               Username validation
            */
            if (!username) {

                showMessage(
                    "Please enter your name or username."
                );

                usernameInput?.focus();

                return;
            }

            /*
               Password validation
            */
            if (!password) {

                showMessage(
                    "Please enter a password."
                );

                passwordInput?.focus();

                return;
            }

            /*
               Show loading state
            */
            setLoading(
                loginButton,
                true
            );

            await wait(350);

            /*
               Create the login session.

               This is stored ONLY in sessionStorage.
               Closing the browser/tab will remove it.
            */
            const session = {
                authenticated: true,

                username: username,

                displayName:
                    formatDisplayName(
                        username
                    ),

                role:
                    "System Administrator",

                loginTime:
                    new Date()
                        .toISOString()
            };

            sessionStorage.setItem(
                "aquaguardSession",
                JSON.stringify(
                    session
                )
            );

            /*
               "Remember this device" stores ONLY
               the username for convenience.

               It does NOT store authentication.
            */
            if (
                rememberMe?.checked
            ) {

                localStorage.setItem(
                    "aquaguardRememberedUser",
                    username
                );

            } else {

                localStorage.removeItem(
                    "aquaguardRememberedUser"
                );
            }

            /*
               Make absolutely sure old
               authentication systems are gone.
            */
            localStorage.removeItem(
                "aquaguardPersistentSession"
            );

            localStorage.removeItem(
                "aquaguardSession"
            );

            localStorage.removeItem(
                "aquaguardAuth"
            );

            sessionStorage.removeItem(
                "aquaguardPersistentSession"
            );

            sessionStorage.removeItem(
                "aquaguardAuth"
            );

            /*
               Success state
            */
            if (loginButton) {

                loginButton.classList.remove(
                    "loading"
                );

                loginButton.disabled =
                    true;

                loginButton.innerHTML = `
                    <span>Access granted</span>
                    <span class="button-arrow">✓</span>
                `;
            }

            document
                .querySelector(
                    ".login-box"
                )
                ?.classList.add(
                    "login-success"
                );

            /*
               Go to dashboard.
            */
            setTimeout(
                () => {
                    window.location.replace(
                        "index.html"
                    );
                },
                450
            );
        }
    );
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function initPasswordToggle() {

    const passwordInput =
        document.getElementById(
            "password"
        );

    const toggleButton =
        document.getElementById(
            "toggle-password"
        );

    if (
        !passwordInput ||
        !toggleButton
    ) {
        return;
    }

    toggleButton.addEventListener(
        "click",
        () => {

            const isVisible =
                passwordInput.type ===
                "text";

            passwordInput.type =
                isVisible
                    ? "password"
                    : "text";

            toggleButton.textContent =
                isVisible
                    ? "Show"
                    : "Hide";

            toggleButton.setAttribute(
                "aria-label",
                isVisible
                    ? "Show password"
                    : "Hide password"
            );
        }
    );
}


/* =========================================================
   HELP / FORGOT PASSWORD
   ========================================================= */

function initHelpButton() {

    const button =
        document.getElementById(
            "forgot-password"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            showMessage(
                "This is a project prototype. Enter any non-empty name and password.",
                "info"
            );
        }
    );
}


/* =========================================================
   RESTORE REMEMBERED USERNAME
   ========================================================= */

function restoreRememberedName() {

    const input =
        document.getElementById(
            "username"
        );

    const checkbox =
        document.getElementById(
            "remember-me"
        );

    const remembered =
        localStorage.getItem(
            "aquaguardRememberedUser"
        );

    if (
        remembered &&
        input
    ) {

        input.value =
            remembered;

        if (checkbox) {
            checkbox.checked =
                true;
        }
    }
}


/* =========================================================
   LOADING BUTTON
   ========================================================= */

function setLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled =
            true;

        button.classList.add(
            "loading"
        );

        button.innerHTML = `
            <span>Signing in...</span>
            <span class="button-arrow">◌</span>
        `;

    } else {

        button.disabled =
            false;

        button.classList.remove(
            "loading"
        );

        button.innerHTML = `
            <span>Enter AquaGuard</span>
            <span class="button-arrow">→</span>
        `;
    }
}


/* =========================================================
   MESSAGE DISPLAY
   ========================================================= */

function showMessage(
    message,
    type = "error"
) {

    const box =
        document.getElementById(
            "login-error"
        );

    if (!box) {
        return;
    }

    box.textContent =
        message;

    box.hidden =
        false;

    if (
        type === "info"
    ) {

        box.classList.remove(
            "error-message"
        );

        box.style.borderColor =
            "#dce8ed";

        box.style.background =
            "#f1f7fa";

        box.style.color =
            "#466273";

    } else {

        box.classList.add(
            "error-message"
        );

        box.style.borderColor =
            "";

        box.style.background =
            "";

        box.style.color =
            "";
    }
}


function clearMessage() {

    const box =
        document.getElementById(
            "login-error"
        );

    if (!box) {
        return;
    }

    box.hidden =
        true;

    box.textContent =
        "";

    box.classList.add(
        "error-message"
    );

    box.style.borderColor =
        "";

    box.style.background =
        "";

    box.style.color =
        "";
}


/* =========================================================
   DISPLAY NAME FORMAT
   ========================================================= */

function formatDisplayName(
    value
) {

    const trimmed =
        value.trim();

    if (
        trimmed.includes("@")
    ) {

        const localPart =
            trimmed.split("@")[0];

        return localPart
            .replace(
                /[._-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .replace(
                /\b\w/g,
                (character) =>
                    character.toUpperCase()
            );
    }

    return trimmed
        .replace(
            /\s+/g,
            " "
        )
        .replace(
            /\b\w/g,
            (character) =>
                character.toUpperCase()
        );
}


/* =========================================================
   DELAY HELPER
   ========================================================= */

function wait(
    milliseconds
) {

    return new Promise(
        (resolve) => {
            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}


/* =========================================================
   CURRENT LOGIN STATUS
   ========================================================= */

function isLoggedIn() {

    const raw =
        sessionStorage.getItem(
            "aquaguardSession"
        );

    if (!raw) {
        return false;
    }

    try {

        const session =
            JSON.parse(raw);

        return (
            session?.authenticated ===
            true
        );

    } catch {

        sessionStorage.removeItem(
            "aquaguardSession"
        );

        return false;
    }
}


/* =========================================================
   GLOBAL LOGIN API
   ========================================================= */

window.AquaGuardLogin = {
    isLoggedIn
};