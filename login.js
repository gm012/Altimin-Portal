// =========================================================
// ALTIMIN CLIENT PORTAL
// CLERK + SUPABASE AUTHENTICATION
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // DOM
    // =====================================================

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


    const submitButton =
        loginForm
            ? loginForm.querySelector(
                ".login-button"
            )
            : null;


    // =====================================================
    // APPLICATION STATE
    // =====================================================

    let databaseClient =
        null;


    let authReady =
        false;


    let signingIn =
        false;


    let routingInProgress =
        false;


    let clerkListenerAttached =
        false;


    // =====================================================
    // CURRENT YEAR
    // =====================================================

    if (currentYear) {

        currentYear.textContent =
            new Date().getFullYear();

    }


    // =====================================================
    // UI HELPERS
    // =====================================================

    function showMessage(
        message,
        type = ""
    ) {

        if (!loginMessage) {

            return;

        }


        loginMessage.textContent =
            message;


        loginMessage.className =
            "login-message visible";


        if (type) {

            loginMessage.classList.add(
                type
            );

        }

    }


    function clearMessage() {

        if (!loginMessage) {

            return;

        }


        loginMessage.textContent =
            "";


        loginMessage.className =
            "login-message";

    }


    function setBusy(
        busy
    ) {

        signingIn =
            busy;


        if (submitButton) {

            submitButton.disabled =
                busy ||
                !authReady;

        }


        if (emailInput) {

            emailInput.disabled =
                busy;

        }


        if (passwordInput) {

            passwordInput.disabled =
                busy;

        }


        if (passwordToggle) {

            passwordToggle.disabled =
                busy;

        }

    }


    // =====================================================
    // PASSWORD VISIBILITY
    // =====================================================

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


    // =====================================================
    // SCRIPT LOADER
    // =====================================================

    function loadScript(
        source,
        attributes = {}
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const existing =
                    Array
                        .from(
                            document.scripts
                        )
                        .find(
                            script =>
                                script.src ===
                                new URL(
                                    source,
                                    window.location.href
                                ).href
                        );


                if (existing) {

                    if (
                        existing.dataset
                            .altiminLoaded ===
                        "true"
                    ) {

                        resolve();

                        return;

                    }


                    existing.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );


                    existing.addEventListener(
                        "error",
                        () => {

                            reject(
                                new Error(
                                    `Could not load ${source}`
                                )
                            );

                        },
                        {
                            once: true
                        }
                    );


                    return;

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    source;


                script.async =
                    false;


                Object.entries(
                    attributes
                ).forEach(
                    (
                        [
                            key,
                            value
                        ]
                    ) => {

                        script.setAttribute(
                            key,
                            value
                        );

                    }
                );


                script.addEventListener(
                    "load",
                    () => {

                        script.dataset.altiminLoaded =
                            "true";


                        resolve();

                    },
                    {
                        once: true
                    }
                );


                script.addEventListener(
                    "error",
                    () => {

                        reject(
                            new Error(
                                `Could not load ${source}`
                            )
                        );

                    },
                    {
                        once: true
                    }
                );


                document.head.appendChild(
                    script
                );

            }
        );

    }


    // =====================================================
    // CLERK DOMAIN
    // =====================================================

    function getClerkDomain(
        publishableKey
    ) {

        const encoded =
            publishableKey.replace(
                /^pk_(test|live)_/,
                ""
            );


        const base64 =
            encoded
                .replace(
                    /-/g,
                    "+"
                )
                .replace(
                    /_/g,
                    "/"
                );


        const padded =
            base64.padEnd(
                Math.ceil(
                    base64.length / 4
                ) * 4,
                "="
            );


        const decoded =
            atob(
                padded
            );


        return decoded.replace(
            /\$$/,
            ""
        );

    }


    // =====================================================
    // PUBLIC CONFIG
    // =====================================================

    async function loadConfig() {

        if (!window.AltiminConfig) {

            await loadScript(
                "portal-config.js"
            );

        }


        const config =
            window.AltiminConfig;


        if (!config) {

            throw new Error(
                "portal-config.js could not be loaded."
            );

        }


        if (
            !config.clerkPublishableKey ||
            !config.supabaseUrl ||
            !config.supabasePublishableKey
        ) {

            throw new Error(
                "Altimin portal configuration is incomplete."
            );

        }

    }


    // =====================================================
    // CLERK
    // =====================================================

    async function loadClerk() {

        const config =
            window.AltiminConfig;


        const clerkDomain =
            getClerkDomain(
                config.clerkPublishableKey
            );


        // =================================================
        // CLERK UI BUNDLE
        // =================================================

        if (
            !window.__internal_ClerkUICtor
        ) {

            await loadScript(
                `https://${clerkDomain}/npm/@clerk/ui@1/dist/ui.browser.js`,
                {
                    crossorigin:
                        "anonymous"
                }
            );

        }


        // =================================================
        // CLERK JS
        // =================================================

        if (!window.Clerk) {

            await loadScript(
                `https://${clerkDomain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
                {
                    crossorigin:
                        "anonymous",

                    "data-clerk-publishable-key":
                        config.clerkPublishableKey
                }
            );

        }


        if (!window.Clerk) {

            throw new Error(
                "Clerk authentication could not be loaded."
            );

        }


        await window.Clerk.load({

            ui: {

                ClerkUI:
                    window
                        .__internal_ClerkUICtor

            },

            afterSignOutUrl:
                new URL('index.html', window.location.href).href

        });


        console.log(
            "Altimin: Clerk loaded."
        );

    }


    // =====================================================
    // SUPABASE
    // =====================================================

    async function loadSupabase() {

        if (
            !window.supabase ||
            !window.supabase.createClient
        ) {

            await loadScript(
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
            );

        }


        if (
            !window.supabase ||
            !window.supabase.createClient
        ) {

            throw new Error(
                "Supabase could not be loaded."
            );

        }


        console.log(
            "Altimin: Supabase client loaded."
        );

    }


    // =====================================================
    // DATABASE CLIENT
    // =====================================================

    function createDatabaseClient() {

        const config =
            window.AltiminConfig;


        databaseClient =
            window.supabase.createClient(

                config.supabaseUrl,

                config.supabasePublishableKey,

                {

                    accessToken:
                        async () => {

                            if (
                                !window.Clerk ||
                                !window.Clerk.session
                            ) {

                                return null;

                            }


                            return (
                                await window
                                    .Clerk
                                    .session
                                    .getToken()
                            );

                        }

                }

            );


        console.log(
            "Altimin: Supabase client connected to Clerk token provider."
        );

    }


    // =====================================================
    // ERROR MESSAGE
    // =====================================================

    function getClerkErrorMessage(
        error
    ) {

        if (
            Array.isArray(
                error?.errors
            ) &&
            error.errors.length
        ) {

            return (
                error.errors[0]
                    .longMessage ||
                error.errors[0]
                    .long_message ||
                error.errors[0]
                    .message ||
                "We could not sign you in."
            );

        }


        if (
            error?.longMessage
        ) {

            return error.longMessage;

        }


        if (
            error?.message
        ) {

            return error.message;

        }


        return (
            "We could not sign you in."
        );

    }


    // =====================================================
    // PORTAL MEMBERSHIP
    // =====================================================

    async function getPortalMembership() {

        if (!databaseClient) {

            throw new Error(
                "The Altimin database connection is unavailable."
            );

        }


        if (
            !window.Clerk ||
            !window.Clerk.user
        ) {

            throw new Error(
                "The authenticated Clerk user is unavailable."
            );

        }


        const clerkUserId =
            window.Clerk.user.id;


        console.log(
            "Altimin: Checking portal membership for:",
            clerkUserId
        );


        const {
            data,
            error
        } =
            await databaseClient
                .from(
                    "portal_members"
                )
                .select(
                    "id, clerk_user_id, role, client_id, active"
                )
                .eq(
                    "clerk_user_id",
                    clerkUserId
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Altimin membership query failed:",
                error
            );


            throw error;

        }


        return data;

    }


    // =====================================================
    // CLOSE CLERK SIGN-IN MODAL
    // =====================================================

    function closeClerkSignIn() {

        try {

            if (
                window.Clerk &&
                typeof window.Clerk
                    .closeSignIn ===
                    "function"
            ) {

                window.Clerk.closeSignIn();

            }

        } catch (
            error
        ) {

            console.debug(
                "Altimin: No Clerk sign-in modal needed closing."
            );

        }

    }


    // =====================================================
    // ROUTE AUTHENTICATED USER
    // =====================================================

    async function routeAuthenticatedUser() {

        if (routingInProgress) {

            return;

        }


        if (
            !window.Clerk ||
            !window.Clerk.session ||
            !window.Clerk.user
        ) {

            return;

        }


        routingInProgress =
            true;


        try {

            showMessage(
                "Opening your Altimin environment...",
                "success"
            );


            const membership =
                await getPortalMembership();





            // =============================================
            // NO PORTAL ACCESS
            // =============================================

            if (
                !membership ||
                !membership.active
            ) {

                window.location.replace(AltiminPaths.url("accept-invitation.html"));
                return;

            }


            // =============================================
            // ADMIN
            // =============================================

            if (
                membership.role ===
                "admin"
            ) {

                console.log(
                    "Altimin: Admin authenticated."
                );


                closeClerkSignIn();


                window.location.replace(
                    "admin.html"
                );


                return;

            }


            // =============================================
            // CLIENT
            // =============================================

            if (
                membership.role ===
                    "client" &&
                membership.client_id
            ) {

                console.log(
                    "Altimin: Client authenticated.",
                    membership.client_id
                );


                closeClerkSignIn();


                window.location.replace(
                    "dashboard.html"
                );


                return;

            }


            // =============================================
            // INVALID MEMBERSHIP
            // =============================================

            await window.Clerk.signOut();


            throw new Error(
                "This Altimin account has not been configured correctly."
            );

        } catch (
            error
        ) {

            routingInProgress =
                false;


            throw error;

        }

    }


    // =====================================================
    // WATCH CLERK SESSION
    // =====================================================

    function attachClerkListener() {

        if (
            clerkListenerAttached ||
            !window.Clerk
        ) {

            return;

        }


        clerkListenerAttached =
            true;


        window.Clerk.addListener(

            async (
                {
                    session,
                    user
                }
            ) => {

                // =========================================
                // CLERK STILL LOADING
                // =========================================

                if (
                    typeof session ===
                        "undefined" ||
                    typeof user ===
                        "undefined"
                ) {

                    return;

                }


                // =========================================
                // SIGNED OUT
                // =========================================

                if (
                    !session ||
                    !user
                ) {

                    console.log(
                        "Altimin: No active Clerk session."
                    );


                    return;

                }


                console.log(
                    "Clerk session became active:",
                    user.id
                );


                try {

                    await routeAuthenticatedUser();

                } catch (
                    error
                ) {

                    console.error(
                        "Altimin routing failed:",
                        error
                    );


                    showMessage(
                        getClerkErrorMessage(
                            error
                        ),
                        "error"
                    );


                    setBusy(
                        false
                    );

                }

            }

        );

    }


    // =====================================================
    // OPEN CLERK VERIFICATION
    // =====================================================

    function openClerkVerification(
        email
    ) {

        if (
            !window.Clerk ||
            typeof window.Clerk
                .openSignIn !==
                "function"
        ) {

            throw new Error(
                "Secure verification could not be opened."
            );

        }


        console.log(
            "Altimin: Additional Clerk verification required."
        );


        showMessage(
            "Complete the additional security verification to continue."
        );


        setBusy(
            false
        );


        window.Clerk.openSignIn({

            initialValues: {

                emailAddress:
                    email

            }

        });

    }


    // =====================================================
    // PASSWORD LOGIN
    // =====================================================

    async function signInWithPassword(
        email,
        password
    ) {

        // =================================================
        // LEGACY CLERKJS PASSWORD ATTEMPT
        //
        // We use the existing ClerkJS browser flow here so
        // the current Altimin HTML form can remain unchanged.
        //
        // Any MFA / Device Trust / confirmation requirement
        // is handed to Clerk's maintained SignIn UI.
        // =================================================

        const signIn =
            await window
                .Clerk
                .client
                .signIn
                .create({

                    identifier:
                        email,

                    password:
                        password,

                    strategy:
                        "password"

                });


        console.log(
            "Altimin Clerk sign-in status:",
            signIn.status
        );


        // =================================================
        // PASSWORD SIGN-IN COMPLETE
        // =================================================

        if (
            signIn.status ===
                "complete" &&
            signIn.createdSessionId
        ) {

            console.log(
                "Altimin: Clerk password authentication complete."
            );


            await window.Clerk.setActive({

                session:
                    signIn.createdSessionId

            });


            // The listener should also receive this session.
            // Calling this directly gives us a safe fallback.

            await routeAuthenticatedUser();


            return;

        }


        // =================================================
        // ADDITIONAL VERIFICATION REQUIRED
        // =================================================

        if (
            signIn.status ===
                "needs_second_factor" ||
            signIn.status ===
                "needs_client_trust" ||
            signIn.status ===
                "needs_new_password" ||
            signIn.status ===
                "needs_first_factor" ||
            signIn.status ===
                "needs_identifier"
        ) {

            openClerkVerification(
                email
            );


            return;

        }


        // =================================================
        // UNKNOWN / FUTURE CLERK STEP
        //
        // Rather than breaking authentication if Clerk adds
        // another intermediate step, hand control to Clerk's
        // own maintained SignIn component.
        // =================================================

        if (
            signIn.status !==
            "complete"
        ) {

            openClerkVerification(
                email
            );


            return;

        }


        throw new Error(
            "The sign-in could not be completed."
        );

    }


    // =====================================================
    // LOGIN FORM
    // =====================================================

    if (
        loginForm &&
        emailInput &&
        passwordInput
    ) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                if (signingIn) {

                    return;

                }


                if (!authReady) {

                    showMessage(
                        "Secure authentication is still loading. Please try again.",
                        "error"
                    );


                    return;

                }


                clearMessage();


                const email =
                    emailInput
                        .value
                        .trim();


                const password =
                    passwordInput
                        .value;


                if (
                    !email ||
                    !password
                ) {

                    showMessage(
                        "Enter your email address and password.",
                        "error"
                    );


                    return;

                }


                setBusy(
                    true
                );


                showMessage(
                    "Signing you in securely..."
                );


                try {

                    await signInWithPassword(
                        email,
                        password
                    );

                } catch (
                    error
                ) {

                    console.error(
                        "Altimin sign in failed:",
                        error
                    );


                    routingInProgress =
                        false;


                    showMessage(
                        getClerkErrorMessage(
                            error
                        ),
                        "error"
                    );


                    setBusy(
                        false
                    );

                }

            }
        );

    }


    // =====================================================
    // FORGOT PASSWORD
    // =====================================================

    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (
                    !authReady ||
                    !window.Clerk
                ) {

                    showMessage(
                        "Secure authentication is still loading. Please try again.",
                        "error"
                    );


                    return;

                }


                const email =
                    emailInput
                        ? emailInput
                            .value
                            .trim()
                        : "";


                showMessage(
                    "Use the secure Clerk window to recover your account."
                );


                window.Clerk.openSignIn({

                    initialValues: {

                        emailAddress:
                            email

                    }

                });

            }
        );

    }


    // =====================================================
    // INITIALISE AUTHENTICATION
    // =====================================================

    async function initialise() {

        try {

            authReady =
                false;


            if (submitButton) {

                submitButton.disabled =
                    true;

            }


            showMessage(
                "Preparing secure sign in..."
            );


            // =============================================
            // CONFIG
            // =============================================

            await loadConfig();


            // =============================================
            // AUTH + DATABASE LIBRARIES
            // =============================================

            await Promise.all([

                loadClerk(),

                loadSupabase()

            ]);


            // =============================================
            // SUPABASE / CLERK CONNECTION
            // =============================================

            createDatabaseClient();


            // =============================================
            // LISTEN BEFORE CHECKING CURRENT SESSION
            // =============================================

            attachClerkListener();


            // =============================================
            // EXISTING CLERK SESSION
            // =============================================

            if (
                window.Clerk.session &&
                window.Clerk.user
            ) {

                console.log(
                    "Altimin: Existing Clerk session found:",
                    window.Clerk.user.id
                );


                showMessage(
                    "Existing session found. Opening your Altimin environment..."
                );


                await routeAuthenticatedUser();


                return;

            }


            // =============================================
            // READY FOR LOGIN
            // =============================================

            authReady =
                true;


            setBusy(
                false
            );


            clearMessage();


            if (emailInput) {

                emailInput.focus();

            }


            console.log(
                "Altimin: Authentication ready."
            );

        } catch (
            error
        ) {

            console.error(
                "Altimin authentication initialization failed:",
                error
            );


            authReady =
                false;


            signingIn =
                false;


            routingInProgress =
                false;


            if (submitButton) {

                submitButton.disabled =
                    true;

            }


            if (emailInput) {

                emailInput.disabled =
                    false;

            }


            if (passwordInput) {

                passwordInput.disabled =
                    false;

            }


            showMessage(
                "Secure sign in is temporarily unavailable. Please refresh the page.",
                "error"
            );

        }

    }


    // =====================================================
    // START
    // =====================================================

    initialise();

})();
