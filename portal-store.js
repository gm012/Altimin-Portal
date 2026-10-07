// =========================================================
// ALTIMIN CLIENT PORTAL
// SHARED PORTAL STATE CACHE
// =========================================================
//
// PHASE 4 NOTE
// Supabase is now the source of truth for portal data reads.
// This module keeps the existing synchronous PortalStore API
// so admin.js and dashboard.js can continue rendering without
// a large UI rewrite.
//
// localStorage is retained only as a short-lived browser cache
// and for the admin client-preview selection during this phase.
// =========================================================

(function () {

    "use strict";


    const STORAGE_KEY =
        "altiminPortalV2";


    let memoryState =
        null;


    const emptyState = {

        activeClientId:
            null,

        clients:
            [],

        services:
            [],

        hardware:
            [],

        requests:
            []

    };


    // =====================================================
    // HELPERS
    // =====================================================

    function clone(
        value
    ) {

        return JSON.parse(
            JSON.stringify(
                value
            )
        );

    }


    function normaliseState(
        value
    ) {

        const source =
            value &&
            typeof value === "object"
                ? value
                : {};


        return {

            activeClientId:
                source.activeClientId ??
                null,

            clients:
                Array.isArray(
                    source.clients
                )
                    ? source.clients
                    : [],

            services:
                Array.isArray(
                    source.services
                )
                    ? source.services
                    : [],

            hardware:
                Array.isArray(
                    source.hardware
                )
                    ? source.hardware
                    : [],

            requests:
                Array.isArray(
                    source.requests
                )
                    ? source.requests
                    : []

        };

    }


    function readCachedState() {

        try {

            const stored =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!stored) {

                return null;

            }


            return normaliseState(
                JSON.parse(
                    stored
                )
            );

        } catch (
            error
        ) {

            console.warn(
                "Altimin portal cache could not be read.",
                error
            );


            return null;

        }

    }


    function writeCachedState(
        state
    ) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    state
                )
            );

        } catch (
            error
        ) {

            console.warn(
                "Altimin portal cache could not be written.",
                error
            );

        }

    }


    function findEquivalentClientId(
        previousState,
        nextState
    ) {

        const previousClient =
            previousState?.clients?.find(
                client =>
                    Number(
                        client.id
                    ) ===
                    Number(
                        previousState.activeClientId
                    )
            );


        if (!previousClient) {

            return null;

        }


        const previousEmail =
            String(
                previousClient.email ||
                ""
            )
                .trim()
                .toLowerCase();


        const previousCompany =
            String(
                previousClient.company ||
                ""
            )
                .trim()
                .toLowerCase();


        const match =
            nextState.clients.find(
                client => {

                    const email =
                        String(
                            client.email ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const company =
                        String(
                            client.company ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        previousEmail &&
                        email === previousEmail
                    ) || (
                        previousCompany &&
                        company === previousCompany
                    );

                }
            );


        return match
            ? match.id
            : null;

    }


    // =====================================================
    // STATE
    // =====================================================

    function load() {

        if (memoryState) {

            return clone(
                memoryState
            );

        }


        const cached =
            readCachedState();


        memoryState =
            cached ||
            clone(
                emptyState
            );


        return clone(
            memoryState
        );

    }


    function save(
        state
    ) {

        memoryState =
            normaliseState(
                clone(
                    state
                )
            );


        writeCachedState(
            memoryState
        );


        window.dispatchEvent(
            new CustomEvent(
                "altiminPortalUpdated"
            )
        );


        return clone(
            memoryState
        );

    }


    function hydrate(
        remoteState
    ) {

        const previousState =
            load();


        const nextState =
            normaliseState(
                clone(
                    remoteState
                )
            );


        const remoteActiveClientExists =
            nextState.clients.some(
                client =>
                    Number(
                        client.id
                    ) ===
                    Number(
                        nextState.activeClientId
                    )
            );


        const previousActiveClientStillExists =
            nextState.clients.some(
                client =>
                    Number(
                        client.id
                    ) ===
                    Number(
                        previousState.activeClientId
                    )
            );


        if (remoteActiveClientExists) {

            // Keep the active client supplied by the remote state.

        } else if (
            previousActiveClientStillExists
        ) {

            nextState.activeClientId =
                previousState.activeClientId;

        } else {

            const equivalentClientId =
                findEquivalentClientId(
                    previousState,
                    nextState
                );


            nextState.activeClientId =
                equivalentClientId ??
                nextState.clients[0]?.id ??
                null;

        }


        memoryState =
            nextState;


        writeCachedState(
            memoryState
        );


        window.dispatchEvent(
            new CustomEvent(
                "altiminPortalHydrated",
                {
                    detail: {
                        source:
                            "supabase"
                    }
                }
            )
        );


        return clone(
            memoryState
        );

    }


    function reset() {

        memoryState =
            clone(
                emptyState
            );


        writeCachedState(
            memoryState
        );


        return clone(
            memoryState
        );

    }


    // =====================================================
    // LOOKUPS
    // =====================================================

    function getClientById(
        state,
        clientId
    ) {

        return state.clients.find(
            client =>
                Number(
                    client.id
                ) ===
                Number(
                    clientId
                )
        );

    }


    function getActiveClient(
        state
    ) {

        return getClientById(
            state,
            state.activeClientId
        );

    }


    function getClientServices(
        state,
        clientId
    ) {

        const client =
            getClientById(
                state,
                clientId
            );


        if (
            !client ||
            !Array.isArray(
                client.serviceIds
            )
        ) {

            return [];

        }


        return state.services.filter(
            service =>
                client.serviceIds.includes(
                    service.id
                )
        );

    }


    function getClientRequests(
        state,
        clientId
    ) {

        return state.requests.filter(
            request =>
                Number(
                    request.clientId
                ) ===
                Number(
                    clientId
                )
        );

    }


    function getNextRequestId(
        state
    ) {

        const numbers =
            state.requests
                .map(
                    request => {

                        const match =
                            String(
                                request.id
                            ).match(
                                /\d+/
                            );


                        return match
                            ? Number(
                                match[0]
                            )
                            : 0;

                    }
                );


        const highest =
            numbers.length
                ? Math.max(
                    ...numbers
                )
                : 0;


        return `REQ-${String(
            highest + 1
        ).padStart(
            4,
            "0"
        )}`;

    }


    function formatToday() {

        return new Intl
            .DateTimeFormat(
                "en-GB",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            )
            .format(
                new Date()
            );

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.PortalStore = {

        load,

        save,

        hydrate,

        reset,

        getActiveClient,

        getClientById,

        getClientServices,

        getClientRequests,

        getNextRequestId,

        formatToday

    };

})();
