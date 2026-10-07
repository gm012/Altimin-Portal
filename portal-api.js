// =========================================================
// ALTIMIN CLIENT PORTAL
// SUPABASE DATA API
// =========================================================
//
// PHASE 5 / STEP 02
// Supabase is the source of truth for portal reads and writes.
// This module also exposes the administrator-only client
// invitation flow through a secured Supabase Edge Function.
// Clerk secret credentials never enter browser JavaScript.
// =========================================================

(function () {

    "use strict";


    // =====================================================
    // RESULT HELPERS
    // =====================================================

    function unwrapResult(
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


        return result.data;

    }


    function assertArrayResult(
        result,
        label
    ) {

        const data =
            unwrapResult(
                result,
                label
            );


        return Array.isArray(
            data
        )
            ? data
            : [];

    }


    async function functionErrorMessage(
        error,
        fallbackMessage
    ) {

        if (
            error?.context &&
            typeof error.context.json ===
                "function"
        ) {

            try {

                const payload =
                    await error.context.json();


                if (
                    payload?.error &&
                    typeof payload.error ===
                        "string"
                ) {

                    return payload.error;

                }


                if (
                    payload?.message &&
                    typeof payload.message ===
                        "string"
                ) {

                    return payload.message;

                }

            } catch (
                parseError
            ) {

                console.warn(
                    "Could not parse Edge Function error response.",
                    parseError
                );

            }

        }


        return error?.message ||
            fallbackMessage;

    }


    // =====================================================
    // FORMAT HELPERS
    // =====================================================

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


    function requestIdFromReference(
        value
    ) {

        const match =
            String(
                value ??
                ""
            ).match(
                /\d+/
            );


        const id =
            match
                ? Number(
                    match[0]
                )
                : Number(
                    value
                );


        if (
            !Number.isFinite(
                id
            ) ||
            id <= 0
        ) {

            throw new Error(
                `Invalid request reference: ${value}`
            );

        }


        return id;

    }


    function createSubmissionId() {

        if (
            window.crypto &&
            typeof window.crypto.randomUUID ===
                "function"
        ) {

            return window.crypto.randomUUID();

        }


        const bytes =
            new Uint8Array(
                16
            );


        window.crypto.getRandomValues(
            bytes
        );


        bytes[6] =
            (bytes[6] & 0x0f) |
            0x40;


        bytes[8] =
            (bytes[8] & 0x3f) |
            0x80;


        const hex =
            Array.from(
                bytes
            )
                .map(
                    byte =>
                        byte
                            .toString(
                                16
                            )
                            .padStart(
                                2,
                                "0"
                            )
                )
                .join("");


        return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20)
        ].join("-");

    }


    // =====================================================
    // SESSION / DATABASE
    // =====================================================

    async function getContext() {

        if (!window.AltiminSession) {

            throw new Error(
                "Altimin session manager is unavailable."
            );

        }


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
                "An authenticated portal membership is required before using portal data."
            );

        }


        return context;

    }


    async function getDatabaseClient() {

        await getContext();


        return await window
            .AltiminSession
            .getDatabaseClient();

    }


    async function requireAdmin() {

        const context =
            await getContext();


        if (
            context.membership.role !==
            "admin"
        ) {

            throw new Error(
                "Administrator access is required for this action."
            );

        }


        return context;

    }


    // =====================================================
    // READS
    // =====================================================

    async function loadState() {

        const context =
            await getContext();


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
            assertArrayResult(
                clientsResult,
                "Could not load clients"
            );


        const services =
            assertArrayResult(
                servicesResult,
                "Could not load services"
            );


        const hardware =
            assertArrayResult(
                hardwareResult,
                "Could not load hardware"
            );


        const assignments =
            assertArrayResult(
                assignmentsResult,
                "Could not load client service assignments"
            );


        const requests =
            assertArrayResult(
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


    async function refreshStore() {

        const state =
            await loadState();


        if (
            window.PortalStore &&
            typeof window.PortalStore.hydrate ===
                "function"
        ) {

            return window.PortalStore
                .hydrate(
                    state
                );

        }


        return state;

    }


    // =====================================================
    // ADMIN WRITES
    // =====================================================

    async function createClient(
        payload
    ) {

        await requireAdmin();


        const client =
            await getDatabaseClient();


        const result =
            await client
                .from(
                    "portal_clients"
                )
                .insert({

                    company:
                        payload.company,

                    contact:
                        payload.contact,

                    email:
                        payload.email,

                    region:
                        payload.region ||
                        "South Africa",

                    status:
                        payload.status ||
                        "Active"

                })
                .select(
                    "id, company, contact, email, region, status"
                )
                .single();


        return unwrapResult(
            result,
            "Could not create client"
        );

    }


    async function updateClient(
        clientId,
        payload
    ) {

        await requireAdmin();


        const client =
            await getDatabaseClient();


        const result =
            await client
                .from(
                    "portal_clients"
                )
                .update({

                    company:
                        payload.company,

                    contact:
                        payload.contact,

                    email:
                        payload.email,

                    region:
                        payload.region,

                    status:
                        payload.status

                })
                .eq(
                    "id",
                    Number(
                        clientId
                    )
                )
                .select(
                    "id, company, contact, email, region, status"
                )
                .single();


        return unwrapResult(
            result,
            "Could not update client"
        );

    }


    async function assignClientServices(
        clientId,
        serviceIds
    ) {

        await requireAdmin();


        const client =
            await getDatabaseClient();


        const result =
            await client
                .rpc(
                    "portal_assign_services",
                    {
                        p_client_id:
                            Number(
                                clientId
                            ),

                        p_service_ids:
                            Array.isArray(
                                serviceIds
                            )
                                ? serviceIds.map(
                                    Number
                                )
                                : []
                    }
                );


        unwrapResult(
            result,
            "Could not update client service assignments"
        );


        return true;

    }


    async function createService(
        payload
    ) {

        await requireAdmin();


        const client =
            await getDatabaseClient();


        const result =
            await client
                .from(
                    "portal_services"
                )
                .insert({

                    name:
                        payload.name,

                    code:
                        payload.code,

                    category:
                        payload.category,

                    description:
                        payload.description,

                    status:
                        payload.status ||
                        "Active"

                })
                .select(
                    "id, code, name, category, description, status"
                )
                .single();


        return unwrapResult(
            result,
            "Could not create service"
        );

    }


    async function createHardware(
        payload
    ) {

        await requireAdmin();


        const client =
            await getDatabaseClient();


        const result =
            await client
                .from(
                    "portal_hardware"
                )
                .insert({

                    name:
                        payload.name,

                    code:
                        payload.code,

                    category:
                        payload.category ||
                        "Hardware",

                    description:
                        payload.description,

                    status:
                        payload.status ||
                        "Active"

                })
                .select(
                    "id, code, name, category, description, status"
                )
                .single();


        return unwrapResult(
            result,
            "Could not create hardware"
        );

    }


    async function updateRequestStatus(
        requestReferenceValue,
        status
    ) {

        await requireAdmin();


        const requestId =
            requestIdFromReference(
                requestReferenceValue
            );


        const client =
            await getDatabaseClient();


        const result =
            await client
                .from(
                    "portal_requests"
                )
                .update({
                    status
                })
                .eq(
                    "id",
                    requestId
                )
                .select(
                    "id, client_id, title, type, quantity, details, status, created_at"
                )
                .single();


        return unwrapResult(
            result,
            "Could not update request status"
        );

    }


    // =====================================================
    // CLIENT / ADMIN REQUEST WRITE
    // =====================================================

    async function createRequest(
        payload
    ) {

        const context =
            await getContext();


        const membership =
            context.membership;


        if (!membership?.id) {

            throw new Error(
                "The current portal membership does not have a valid member ID."
            );

        }


        const clientId = Number(membership.role === "client" ? membership.client_id : payload.clientId);


        if (
            !Number.isFinite(
                clientId
            ) ||
            clientId <= 0
        ) {

            throw new Error(
                "A valid client ID is required to create a request."
            );

        }


        const client =
            await getDatabaseClient();


        const result =
            await client
                .from(
                    "portal_requests"
                )
                .insert({

                    client_id:
                        clientId,

                    created_by:
                        membership.id,

                    submission_id:
                        createSubmissionId(),

                    title:
                        payload.title,

                    type:
                        payload.type,

                    quantity:
                        Number(
                            payload.quantity
                        ),

                    details:
                        payload.details

                })
                .select(
                    "id, client_id, title, type, quantity, details, status, created_at"
                )
                .single();


        return unwrapResult(
            result,
            "Could not create request"
        );

    }


    // =====================================================
    // CLIENT INVITATIONS
    // =====================================================

    async function getClientInvitation(
        clientId
    ) {

        await requireAdmin();


        const client =
            await getDatabaseClient();


        const members = await client.from("portal_members").select("id,active")
            .eq("client_id",Number(clientId)).limit(10);
        if (members.error) throw new Error("Portal membership status could not be checked.");
        if (members.data?.length) return { status:members.data.some(m=>m.active) ? "active_user" : "inactive_user" };
        const result =
            await client
                .from(
                    "portal_invitations"
                )
                .select(
                    "id, client_id, email, clerk_invitation_id, status, expires_at, created_at, updated_at"
                )
                .eq(
                    "client_id",
                    Number(
                        clientId
                    )
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    1
                )
                .maybeSingle();


        return unwrapResult(
            result,
            "Could not load client invitation status"
        );

    }


    async function sendClientInvitation(
        clientId
    ) {

        await requireAdmin();


        if (
            !window.Clerk?.session
        ) {

            throw new Error(
                "A Clerk session is required to send an invitation."
            );

        }


        const token =
            await window.Clerk
                .session
                .getToken();


        if (!token) {

            throw new Error(
                "Could not obtain the signed-in administrator token."
            );

        }


        const client =
            await getDatabaseClient();


        const {
            data,
            error
        } =
            await client
                .functions
                .invoke(
                    "send-client-invite",
                    {
                        body: {
                            clientId:
                                Number(
                                    clientId
                                )
                        },

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


        if (error) {

            const message =
                await functionErrorMessage(
                    error,
                    "The portal invitation could not be sent."
                );


            throw new Error(
                message
            );

        }


        if (
            !data?.success
        ) {

            throw new Error(
                data?.error ||
                "The portal invitation could not be sent."
            );

        }


        return data;

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.AltiminPortalApi = {

        loadState,

        refreshStore,

        createClient,

        updateClient,

        assignClientServices,

        createService,

        createHardware,

        updateRequestStatus,

        createRequest,

        getClientInvitation,

        sendClientInvitation

    };

})();
