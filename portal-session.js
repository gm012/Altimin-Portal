// =========================================================
// ALTIMIN CLIENT PORTAL
// SHARED CLERK + SUPABASE SESSION
// =========================================================

(function () {

    "use strict";


    let initPromise =
        null;


    let sessionContext =
        null;


    let databaseClient =
        null;


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

                const absoluteSource =
                    new URL(
                        source,
                        window.location.href
                    ).href;


                const existing =
                    Array
                        .from(
                            document.scripts
                        )
                        .find(
                            script =>
                                script.src ===
                                absoluteSource
                        );


                if (existing) {

                    if (
                        existing.dataset
                            .altiminLoaded ===
                        "true" ||
                        (
                            source.includes(
                                "clerk-js"
                            ) &&
                            window.Clerk
                        ) ||
                        (
                            source.includes(
                                "supabase-js"
                            ) &&
                            window.supabase
                        )
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


        return atob(
            padded
        ).replace(
            /\$$/,
            ""
        );

    }


    // =====================================================
    // CONFIG
    // =====================================================

    async function ensureConfig() {

        if (!window.AltiminConfig) {

            await loadScript(
                "portal-config.js"
            );

        }


        const config =
            window.AltiminConfig;


        if (
            !config ||
            !config.clerkPublishableKey ||
            !config.supabaseUrl ||
            !config.supabasePublishableKey
        ) {

            throw new Error(
                "Altimin portal configuration is incomplete."
            );

        }


        return config;

    }


    // =====================================================
    // CLERK
    // =====================================================

    async function ensureClerk(
        config
    ) {

        if (!window.Clerk) {

            const clerkDomain =
                getClerkDomain(
                    config.clerkPublishableKey
                );


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

            afterSignOutUrl:
                new URL(
                    "index.html",
                    window.location.href
                ).href

        });

    }


    // =====================================================
    // SUPABASE
    // =====================================================

    async function ensureSupabase() {

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

    }


    function createDatabaseClient(
        config
    ) {

        if (databaseClient) {

            return databaseClient;

        }


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


                            return await window
                                .Clerk
                                .session
                                .getToken();

                        }

                }

            );


        return databaseClient;

    }


    // =====================================================
    // USER IDENTITY
    // =====================================================

    function titleCaseFromEmail(
        email
    ) {

        const localPart =
            String(
                email ||
                ""
            )
                .split("@")[0]
                .replace(
                    /[._-]+/g,
                    " "
                )
                .trim();


        if (!localPart) {

            return "";

        }


        return localPart
            .split(/\s+/)
            .map(
                word =>
                    word.charAt(0)
                        .toUpperCase() +
                    word.slice(1)
            )
            .join(" ");

    }


    function buildIdentity(
        user
    ) {

        const firstName =
            String(
                user?.firstName ||
                ""
            ).trim();


        const lastName =
            String(
                user?.lastName ||
                ""
            ).trim();


        const email =
            String(
                user?.primaryEmailAddress
                    ?.emailAddress ||
                user?.emailAddresses?.[0]
                    ?.emailAddress ||
                ""
            ).trim();


        let displayName =
            [
                firstName,
                lastName
            ]
                .filter(Boolean)
                .join(" ")
                .trim();


        if (!displayName) {

            displayName =
                String(
                    user?.fullName ||
                    user?.username ||
                    ""
                ).trim();

        }


        if (!displayName) {

            displayName =
                titleCaseFromEmail(
                    email
                );

        }


        if (!displayName) {

            displayName =
                "Altimin User";

        }


        const resolvedFirstName =
            firstName ||
            displayName
                .split(/\s+/)[0] ||
            "there";


        const initials =
            displayName
                .split(/\s+/)
                .filter(Boolean)
                .map(
                    word =>
                        word.charAt(0)
                )
                .slice(
                    0,
                    2
                )
                .join("")
                .toUpperCase() ||
            "AU";


        return {

            displayName,

            firstName:
                resolvedFirstName,

            initials,

            email

        };

    }


    // =====================================================
    // MEMBERSHIP
    // =====================================================

    async function getMembership(
        client,
        clerkUserId
    ) {

        const {
            data,
            error
        } =
            await client
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

            throw error;

        }


        return data;

    }


    // =====================================================
    // INITIALISE
    // =====================================================

    async function init() {

        if (sessionContext) {

            return sessionContext;

        }


        if (initPromise) {

            return initPromise;

        }


        initPromise =
            (async () => {

                const config =
                    await ensureConfig();


                await Promise.all([

                    ensureClerk(
                        config
                    ),

                    ensureSupabase()

                ]);


                if (
                    !window.Clerk.session ||
                    !window.Clerk.user
                ) {

                    return {

                        signedIn:
                            false,

                        user:
                            null,

                        identity:
                            null,

                        membership:
                            null

                    };

                }


                const client =
                    createDatabaseClient(
                        config
                    );


                const membership =
                    await getMembership(
                        client,
                        window.Clerk.user.id
                    );


                sessionContext = {

                    signedIn:
                        true,

                    user:
                        window.Clerk.user,

                    identity:
                        buildIdentity(
                            window.Clerk.user
                        ),

                    membership

                };


                return sessionContext;

            })()
                .catch(
                    error => {

                        initPromise =
                            null;


                        throw error;

                    }
                );


        return initPromise;

    }


    // =====================================================
    // PAGE ACCESS
    // =====================================================

    async function requireAccess(
        allowedRoles = []
    ) {

        const context =
            await init();


        const membership =
            context.membership;


        const hasAllowedRole =
            !allowedRoles.length ||
            allowedRoles.includes(
                membership?.role
            );


        if (
            !context.signedIn ||
            !membership ||
            !membership.active ||
            !hasAllowedRole
        ) {

            window.location.replace(
                "index.html"
            );


            return null;

        }


        return context;

    }


    // =====================================================
    // SIGN OUT
    // =====================================================

    async function signOut() {

        const config =
            await ensureConfig();


        await ensureClerk(
            config
        );


        await window.Clerk.signOut();


        sessionContext =
            null;


        initPromise =
            null;


        window.location.replace(
            "index.html"
        );

    }


    // =====================================================
    // DATABASE CLIENT
    // =====================================================

    async function getDatabaseClient() {

        const context =
            await init();


        if (!context?.signedIn) {

            throw new Error(
                "A signed-in Clerk session is required before using Supabase."
            );

        }


        const config =
            await ensureConfig();


        return createDatabaseClient(
            config
        );

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.AltiminSession = {

        init,

        requireAccess,

        signOut,

        getDatabaseClient,

        getContext:
            () => sessionContext

    };

})();
