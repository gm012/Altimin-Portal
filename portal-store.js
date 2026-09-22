// =========================================================
// ALTIMIN CLIENT PORTAL
// SHARED PROTOTYPE DATA STORE
// =========================================================

(function () {

    const STORAGE_KEY =
        "altiminPortalV2";


    // =====================================================
    // DEFAULT PROTOTYPE DATA
    // =====================================================

    const defaultState = {

        activeClientId: 1,


        clients: [

            {
                id: 1,

                company:
                    "ACME Industries",

                contact:
                    "Alex Morgan",

                email:
                    "alex@acme.co.za",

                region:
                    "South Africa",

                status:
                    "Active",

                serviceIds:
                    [1, 2, 3, 4]
            },

            {
                id: 2,

                company:
                    "Northstar Group",

                contact:
                    "Maya Singh",

                email:
                    "maya@northstar.co.za",

                region:
                    "South Africa",

                status:
                    "Active",

                serviceIds:
                    [1, 2, 3]
            },

            {
                id: 3,

                company:
                    "Barton & Co",

                contact:
                    "James Barton",

                email:
                    "james@barton.co.uk",

                region:
                    "United Kingdom",

                status:
                    "Active",

                serviceIds:
                    [1, 2]
            }

        ],


        services: [

            {
                id: 1,

                code:
                    "M365",

                name:
                    "Microsoft 365",

                category:
                    "Cloud & Productivity",

                description:
                    "Managed Microsoft 365 environment and user administration.",

                status:
                    "Active"
            },

            {
                id: 2,

                code:
                    "ITS",

                name:
                    "Managed IT Support",

                category:
                    "IT Services",

                description:
                    "Ongoing support for your day-to-day technology environment.",

                status:
                    "Active"
            },

            {
                id: 3,

                code:
                    "CB",

                name:
                    "Cloud Backup",

                category:
                    "Data Protection",

                description:
                    "Managed backup services protecting critical business data.",

                status:
                    "Active"
            },

            {
                id: 4,

                code:
                    "SEC",

                name:
                    "Cybersecurity Monitoring",

                category:
                    "Security",

                description:
                    "Ongoing monitoring supporting the security of your environment.",

                status:
                    "Active"
            }

        ],


        hardware: [

            {
                id: 1,

                code:
                    "NB",

                name:
                    "Laptop",

                description:
                    "Business laptop requests.",

                status:
                    "Active"
            },

            {
                id: 2,

                code:
                    "DSK",

                name:
                    "Desktop",

                description:
                    "Desktop workstation requests.",

                status:
                    "Active"
            },

            {
                id: 3,

                code:
                    "MON",

                name:
                    "Monitor",

                description:
                    "Business monitor and display requests.",

                status:
                    "Active"
            },

            {
                id: 4,

                code:
                    "NET",

                name:
                    "Networking Equipment",

                description:
                    "Network infrastructure and hardware.",

                status:
                    "Active"
            },

            {
                id: 5,

                code:
                    "SRV",

                name:
                    "Server",

                description:
                    "Server hardware and infrastructure requests.",

                status:
                    "Active"
            },

            {
                id: 6,

                code:
                    "ACC",

                name:
                    "Peripheral / Accessory",

                description:
                    "Business peripherals and accessories.",

                status:
                    "Active"
            }

        ],


        requests: [

            {
                id:
                    "REQ-0041",

                clientId:
                    1,

                title:
                    "5 × Business Laptops",

                type:
                    "Hardware",

                date:
                    "18 Sep 2026",

                details:
                    "Five business laptops required for new staff.",

                quantity:
                    5,

                status:
                    "Under Review"
            },

            {
                id:
                    "REQ-0038",

                clientId:
                    1,

                title:
                    "Additional Microsoft 365 Licences",

                type:
                    "Service",

                date:
                    "12 Sep 2026",

                details:
                    "Additional Microsoft 365 licences required.",

                quantity:
                    1,

                status:
                    "Approved"
            },

            {
                id:
                    "REQ-0032",

                clientId:
                    1,

                title:
                    "Office Monitor",

                type:
                    "Hardware",

                date:
                    "03 Sep 2026",

                details:
                    "Additional monitor for workstation.",

                quantity:
                    1,

                status:
                    "Completed"
            },

            {
                id:
                    "REQ-0029",

                clientId:
                    2,

                title:
                    "Cloud Backup",

                type:
                    "Service",

                date:
                    "28 Aug 2026",

                details:
                    "Cloud backup requirement for additional department.",

                quantity:
                    1,

                status:
                    "Completed"
            }

        ]

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


    function load() {

        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!stored) {

            const initial =
                clone(
                    defaultState
                );


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    initial
                )
            );


            return initial;

        }


        try {

            return JSON.parse(
                stored
            );

        } catch (
            error
        ) {

            console.warn(
                "Portal data could not be read. Restoring prototype data.",
                error
            );


            const initial =
                clone(
                    defaultState
                );


            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    initial
                )
            );


            return initial;

        }

    }


    function save(
        state
    ) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                state
            )
        );


        window.dispatchEvent(
            new CustomEvent(
                "altiminPortalUpdated"
            )
        );

    }


    function reset() {

        const initial =
            clone(
                defaultState
            );


        save(
            initial
        );


        return initial;

    }


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

        reset,

        getActiveClient,

        getClientById,

        getClientServices,

        getClientRequests,

        getNextRequestId,

        formatToday

    };

})();