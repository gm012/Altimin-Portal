// =========================================================
// ALTIMIN CLIENT PORTAL
// SUPABASE DATA API
// =========================================================
//
// PHASE 4 / STEP 04
// Supabase is the source of truth for portal reads.
// This module converts the relational Supabase schema into
// the legacy state shape expected by admin.js/dashboard.js.
// =========================================================

(function () {

    "use strict";


    function assertResult(
        result,
        label
    ) {

        if (result.error) {

            const error =
                new Error(
                    `${label}: ${result.error.message}`
                );


            error.cause =
                result.error;


            throw error;

        }


        return result.data || [];

    }


    function formatRequestDate(
        value
    ) {

        if (!value) {

            return "";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return new Intl
            .DateTimeFormat(
                "en-GB",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    timeZone:
                        "Africa/Johannesburg"
                }
            )
            .format(
                date
            );

    }


    function requestReference(
        id
    ) {

        return `REQ-${String(
            id
        ).padStart(
            4,
            "0"
        )}`;

    }


    async function getDatabaseClient() {

        if (!window.AltiminSession) {

            throw new Error(
                "Altimin session manager is unavailable."
            );

        }


        return await window
            .AltiminSession
            .getDatabaseClient();

    }


    async function loadState() {

        const context =
            await window
                .AltiminSession
                .init();


        if (
            !context?.signedIn ||
            !context?.membership ||
            !context.membership.active
        ) {

            throw new Error(
                "An authenticated portal membership is required before loading portal data."
            );

        }


        const client =
            await getDatabaseClient();


        const [
            clientsResult,
            servicesResult,
            hardwareResult,
            assignmentsResult,
            requestsResult
        ] =
            await Promise.all([

                client
                    .from(
                        "portal_clients"
                    )
                    .select(
                        "id, company, contact, email, region, status"
                    )
                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    ),

                client
                    .from(
                        "portal_services"
                    )
                    .select(
                        "id, code, name, category, description, status"
                    )
                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    ),

                client
                    .from(
                        "portal_hardware"
                    )
                    .select(
                        "id, code, name, category, description, status"
                    )
                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    ),

                client
                    .from(
                        "portal_client_services"
                    )
                    .select(
                        "client_id, service_id"
                    )
                    .order(
                        "client_id",
                        {
                            ascending:
                                true
                        }
                    )
                    .order(
                        "service_id",
                        {
                            ascending:
                                true
                        }
                    ),

                client
                    .from(
                        "portal_requests"
                    )
                    .select(
                        "id, client_id, title, type, quantity, details, status, created_at"
                    )
                    .order(
                        "created_at",
                        {
                            ascending:
                                true
                        }
                    )
                    .order(
                        "id",
                        {
                            ascending:
                                true
                        }
                    )

            ]);


        const clients =
            assertResult(
                clientsResult,
                "Could not load clients"
            );


        const services =
            assertResult(
                servicesResult,
                "Could not load services"
            );


        const hardware =
            assertResult(
                hardwareResult,
                "Could not load hardware"
            );


        const assignments =
            assertResult(
                assignmentsResult,
                "Could not load client service assignments"
            );


        const requests =
            assertResult(
                requestsResult,
                "Could not load requests"
            );


        const serviceIdsByClient =
            new Map();


        assignments.forEach(
            assignment => {

                const clientId =
                    Number(
                        assignment.client_id
                    );


                const serviceId =
                    Number(
                        assignment.service_id
                    );


                if (
                    !serviceIdsByClient.has(
                        clientId
                    )
                ) {

                    serviceIdsByClient.set(
                        clientId,
                        []
                    );

                }


                serviceIdsByClient
                    .get(
                        clientId
                    )
                    .push(
                        serviceId
                    );

            }
        );


        const state = {

            activeClientId:
                context.membership.role ===
                    "client"
                    ? context.membership.client_id
                    : null,

            clients:
                clients.map(
                    item => ({

                        id:
                            Number(
                                item.id
                            ),

                        company:
                            item.company,

                        contact:
                            item.contact,

                        email:
                            item.email,

                        region:
                            item.region,

                        status:
                            item.status,

                        serviceIds:
                            serviceIdsByClient.get(
                                Number(
                                    item.id
                                )
                            ) || []

                    })
                ),

            services:
                services.map(
                    item => ({

                        id:
                            Number(
                                item.id
                            ),

                        code:
                            item.code,

                        name:
                            item.name,

                        category:
                            item.category,

                        description:
                            item.description,

                        status:
                            item.status

                    })
                ),

            hardware:
                hardware.map(
                    item => ({

                        id:
                            Number(
                                item.id
                            ),

                        code:
                            item.code,

                        name:
                            item.name,

                        category:
                            item.category,

                        description:
                            item.description,

                        status:
                            item.status

                    })
                ),

            requests:
                requests.map(
                    item => ({

                        id:
                            requestReference(
                                item.id
                            ),

                        clientId:
                            Number(
                                item.client_id
                            ),

                        title:
                            item.title,

                        type:
                            item.type,

                        date:
                            formatRequestDate(
                                item.created_at
                            ),

                        details:
                            item.details,

                        quantity:
                            Number(
                                item.quantity
                            ),

                        status:
                            item.status

                    })
                )

        };


        console.info(
            "[Altimin P4] Portal data loaded from Supabase",
            {
                role:
                    context.membership.role,

                clients:
                    state.clients.length,

                services:
                    state.services.length,

                hardware:
                    state.hardware.length,

                requests:
                    state.requests.length
            }
        );


        return state;

    }


    window.AltiminPortalApi = {

        loadState

    };

})();
