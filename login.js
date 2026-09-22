// =========================================================
// ALTIMIN CLIENT PORTAL
// LOGIN PROTOTYPE
// =========================================================

const loginForm =
    document.getElementById(
        "loginForm"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const passwordToggle =
    document.getElementById(
        "passwordToggle"
    );

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );

const currentYear =
    document.getElementById(
        "currentYear"
    );


// =========================================================
// CURRENT YEAR
// =========================================================

if (currentYear) {

    currentYear.textContent =
        new Date().getFullYear();

}


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

if (
    passwordToggle &&
    passwordInput
) {

    passwordToggle.addEventListener(
        "click",
        () => {

            const showingPassword =
                passwordInput.type ===
                "text";


            passwordInput.type =
                showingPassword
                    ? "password"
                    : "text";


            passwordToggle.textContent =
                showingPassword
                    ? "SHOW"
                    : "HIDE";


            passwordToggle.setAttribute(
                "aria-label",
                showingPassword
                    ? "Show password"
                    : "Hide password"
            );

        }
    );

}


// =========================================================
// FORGOT PASSWORD
// =========================================================

if (
    forgotPassword &&
    loginMessage
) {

    forgotPassword.addEventListener(
        "click",
        () => {

            loginMessage.textContent =
                "Password recovery will be connected when live authentication is added.";

            loginMessage.className =
                "login-message visible";

        }
    );

}


// =========================================================
// PROTOTYPE LOGIN
// =========================================================

if (
    loginForm &&
    emailInput &&
    passwordInput
) {

    loginForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value.trim();


            if (
                !email ||
                !password
            ) {

                if (loginMessage) {

                    loginMessage.textContent =
                        "Enter your email address and password.";

                    loginMessage.className =
                        "login-message visible error";

                }

                return;

            }


            if (loginMessage) {

                loginMessage.textContent =
                    "Opening your Altimin environment...";

                loginMessage.className =
                    "login-message visible success";

            }


            const submitButton =
                loginForm.querySelector(
                    ".login-button"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

            }


            window.setTimeout(
                () => {

                    window.location.href =
                        "dashboard.html";

                },
                650
            );

        }
    );

}