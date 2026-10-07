// =========================================================

// ALTIMIN CLIENT PORTAL

// ADMIN

// =========================================================



let state =

    PortalStore.load();



let drawerMode =

    null;



let selectedClientId =

    null;





// =========================================================

// ELEMENTS

// =========================================================



const sectionButtons =

    document.querySelectorAll(

        "[data-section]"

    );



const sections =

    document.querySelectorAll(

        ".admin-section"

    );



const adminSidebar =

    document.getElementById(

        "adminSidebar"

    );



const mobileMenuButton =

    document.getElementById(

        "mobileMenuButton"

    );



const clientsTableBody =

    document.getElementById(

        "clientsTableBody"

    );



const servicesGrid =

    document.getElementById(

        "servicesGrid"

    );



const hardwareGrid =

    document.getElementById(

        "hardwareGrid"

    );



const requestsTableBody =

    document.getElementById(

        "requestsTableBody"

    );



const overviewRequestsBody =

    document.getElementById(

        "overviewRequestsBody"

    );



const clientSearch =

    document.getElementById(

        "clientSearch"

    );



const adminDrawer =

    document.getElementById(

        "adminDrawer"

    );



const drawerBackdrop =

    document.getElementById(

        "drawerBackdrop"

    );



const drawerClose =

    document.getElementById(

        "drawerClose"

    );



const drawerForm =

    document.getElementById(

        "drawerForm"

    );



const drawerFields =

    document.getElementById(

        "drawerFields"

    );



const drawerTitle =

    document.getElementById(

        "drawerTitle"

    );



const drawerEyebrow =

    document.getElementById(

        "drawerEyebrow"

    );



const drawerSubmit =

    document.querySelector(

        ".drawer-submit"

    );





// =========================================================

// STATE

// =========================================================



function refreshState() {



    state =

        PortalStore.load();



}





function saveState() {



    PortalStore.save(

        state

    );



}



async function refreshFromSupabase() {



    if (!window.AltiminPortalApi) {

        throw new Error(
            "Altimin Supabase portal API is unavailable."
        );

    }



    await window.AltiminPortalApi
        .refreshStore();



    refreshState();



    return state;



}





// =========================================================

// NAVIGATION

// =========================================================



function openSection(

    name

) {



    sections.forEach(

        section => {



            section.classList.toggle(

                "active",

                section.id ===

                    `section-${name}`

            );



        }

    );





    sectionButtons.forEach(

        button => {



            button.classList.toggle(

                "active",

                button.dataset.section ===

                    name

            );



        }

    );





    if (adminSidebar) {



        adminSidebar.classList.remove(

            "mobile-open"

        );



    }





    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });



}





sectionButtons.forEach(

    button => {



        button.addEventListener(

            "click",

            () => {



                openSection(

                    button.dataset.section

                );



            }

        );



    }

);





document

    .querySelectorAll(

        "[data-go-section]"

    )

    .forEach(

        button => {



            button.addEventListener(

                "click",

                () => {



                    openSection(

                        button.dataset.goSection

                    );



                }

            );



        }

    );





// =========================================================

// HELPERS

// =========================================================



function formatCount(

    number

) {



    return String(

        number

    ).padStart(

        2,

        "0"

    );



}





function getClientName(

    clientId

) {



    const client =

        PortalStore.getClientById(

            state,

            clientId

        );





    return client

        ? client.company

        : "Unknown Client";



}





function statusClass(

    status

) {



    if (

        status === "Active" ||

        status === "Completed"

    ) {



        return "status-active";



    }





    if (

        status === "Under Review"

    ) {



        return "status-review";



    }





    if (

        status === "Approved"

    ) {



        return "status-approved";



    }





    return "status-inactive";



}





// =========================================================

// OVERVIEW

// =========================================================



function renderOverview() {



    const activeClients =

        state.clients.filter(

            client =>

                client.status ===

                "Active"

        );





    const activeServices =

        state.services.filter(

            service =>

                service.status ===

                "Active"

        );





    const activeHardware =

        state.hardware.filter(

            item =>

                item.status ===

                "Active"

        );





    const openRequests =

        state.requests.filter(

            request =>

                request.status !==

                "Completed"

        );





    document.getElementById(

        "overviewClientCount"

    ).textContent =

        formatCount(

            activeClients.length

        );





    document.getElementById(

        "overviewServiceCount"

    ).textContent =

        formatCount(

            activeServices.length

        );





    document.getElementById(

        "overviewHardwareCount"

    ).textContent =

        formatCount(

            activeHardware.length

        );





    document.getElementById(

        "overviewRequestCount"

    ).textContent =

        formatCount(

            openRequests.length

        );





    document.getElementById(

        "sidebarRequestCount"

    ).textContent =

        openRequests.length;





    overviewRequestsBody.innerHTML =

        state.requests

            .slice()

            .reverse()

            .slice(

                0,

                5

            )

            .map(

                request => `

                    <tr>



                        <td>



                            <strong class="table-title">

                                ${escapeHtml(request.title)}

                            </strong>



                            <span class="table-subtitle">

                                ${request.id}<details><summary>Request details</summary>${escapeHtml(request.details || "No additional details.")}</details>

                            </span>



                        </td>



                        <td>

                            ${escapeHtml(getClientName(request.clientId))}

                        </td>



                        <td>

                            ${escapeHtml(request.type)}

                        </td>



                        <td>



                            <span class="status-pill ${statusClass(

                                request.status

                            )}">

                                ${escapeHtml(request.status)}

                            </span>



                        </td>



                    </tr>

                `

            )

            .join("");



}





// =========================================================

// CLIENTS

// =========================================================



function renderClients(

    query = ""

) {



    const normalizedQuery =

        query

            .trim()

            .toLowerCase();





    const filtered =

        state.clients.filter(

            client => {



                const searchable =

                    `

                        ${escapeHtml(client.company)}

                        ${escapeHtml(client.contact)}

                        ${escapeHtml(client.email)}

                        ${escapeHtml(client.region)}

                    `

                        .toLowerCase();





                return searchable.includes(

                    normalizedQuery

                );



            }

        );





    clientsTableBody.innerHTML =

        filtered

            .map(

                client => {



                    const serviceCount =

                        Array.isArray(

                            client.serviceIds

                        )

                            ? client.serviceIds.length

                            : 0;





                    return `

                        <tr

                            class="client-manage-row"

                            data-client-id="${client.id}"

                            tabindex="0"

                            title="Manage ${escapeHtml(client.company)}"

                        >



                            <td>



                                <strong class="table-title">

                                    ${escapeHtml(client.company)}

                                </strong>



                                <span class="table-subtitle">

                                    ${escapeHtml(client.email)}

                                </span>



                            </td>



                            <td>

                                ${escapeHtml(client.contact)}

                            </td>



                            <td>

                                ${escapeHtml(client.region)}

                            </td>



                            <td>

                                ${serviceCount}

                            </td>



                            <td>



                                <span class="status-pill ${statusClass(

                                    client.status

                                )}">

                                    ${escapeHtml(client.status)}

                                </span>



                            </td>



                        </tr>

                    `;



                }

            )

            .join("");





    document.getElementById(

        "clientRecordCount"

    ).textContent =

        `${filtered.length} client${

            filtered.length === 1

                ? ""

                : "s"

        }`;





    bindClientRows();



}





// =========================================================

// CLIENT ROW INTERACTION

// =========================================================



function bindClientRows() {



    document

        .querySelectorAll(

            ".client-manage-row"

        )

        .forEach(

            row => {



                const openClient =

                    () => {



                        openClientManager(

                            Number(

                                row.dataset.clientId

                            )

                        );



                    };





                row.addEventListener(

                    "click",

                    openClient

                );





                row.addEventListener(

                    "keydown",

                    event => {



                        if (

                            event.key === "Enter" ||

                            event.key === " "

                        ) {



                            event.preventDefault();



                            openClient();



                        }



                    }

                );



            }

        );



}





// =========================================================

// CLIENT PORTAL INVITATIONS

// =========================================================


function setPortalInviteMessage(

    message,

    isError = false

) {


    const status =

        document.getElementById(

            "portalInviteStatus"

        );


    if (!status) {

        return;

    }


    status.textContent =

        message;


    status.style.color =

        isError

            ? "#b42318"

            : "#6f7891";


}



function applyPortalInviteState(

    invitation

) {


    const button =

        document.getElementById(

            "sendPortalInviteButton"

        );


    if (!button) {

        return;

    }


    if (invitation?.status === "active_user" || invitation?.status === "inactive_user") {
        button.disabled = true;
        button.textContent = invitation.status === "active_user" ? "ACTIVE PORTAL USER" : "INACTIVE PORTAL USER";
        setPortalInviteMessage("Portal membership exists for this client. Access changes require administrator review.");
        return;
    }
    if (invitation?.status === "pending" && invitation.expires_at &&
        new Date(invitation.expires_at) <= new Date()) invitation = { ...invitation, status:"expired" };
    if (!invitation) {

        button.disabled =

            false;


        button.textContent =

            "SEND PORTAL INVITE";


        setPortalInviteMessage(

            "No portal invitation has been sent for this client yet."

        );


        return;

    }


    const status =

        String(

            invitation.status ||

            "pending"

        ).toLowerCase();


    if (

        status === "pending"

    ) {

        button.disabled =

            true;


        button.textContent =

            "INVITATION PENDING";


        setPortalInviteMessage(

            `Portal invitation sent to ${invitation.email}.`

        );


        return;

    }


    if (

        status === "accepted"

    ) {

        button.disabled =

            true;


        button.textContent =

            "PORTAL ACCESS ACCEPTED";


        setPortalInviteMessage(

            `${invitation.email} has accepted portal access.`

        );


        return;

    }


    button.disabled =

        false;


    button.textContent =

        "SEND PORTAL INVITE";


    setPortalInviteMessage(

        `Previous invitation status: ${status}. A new invitation can be sent.`

    );


}



async function refreshClientInvitationStatus(

    clientId

) {


    const button =

        document.getElementById(

            "sendPortalInviteButton"

        );


    if (!button) {

        return;

    }


    button.disabled =

        true;


    button.textContent =

        "CHECKING INVITE...";


    try {

        const invitation =

            await window

                .AltiminPortalApi

                .getClientInvitation(

                    clientId

                );


        if (

            Number(

                selectedClientId

            ) !==

            Number(

                clientId

            )

        ) {

            return;

        }


        applyPortalInviteState(

            invitation

        );


    } catch (

        error

    ) {

        console.error(

            "Could not load portal invitation status:",

            error

        );


        button.disabled =

            false;


        button.textContent =

            "SEND PORTAL INVITE";


        setPortalInviteMessage(

            "Invitation status could not be loaded.",

            true

        );


    }


}


// =========================================================

// CLIENT MANAGEMENT

// =========================================================



function openClientManager(

    clientId

) {



    refreshState();





    const client =

        PortalStore.getClientById(

            state,

            clientId

        );





    if (!client) {



        return;



    }





    drawerMode =

        "manage-client";



    selectedClientId =

        client.id;





    drawerEyebrow.textContent =

        "CLIENT ACCOUNT";



    drawerTitle.textContent =

        client.company;





    if (drawerSubmit) {



        drawerSubmit.textContent =

            "Save Changes";



    }





    const clientServiceIds =

        Array.isArray(

            client.serviceIds

        )

            ? client.serviceIds.map(

                Number

            )

            : [];





    const serviceOptions =

        state.services

            .map(

                service => {



                    const assigned =

                        clientServiceIds.includes(

                            Number(

                                service.id

                            )

                        );





                    return `

                        <label class="client-service-option">



                            <span class="client-service-check">



                                <input

                                    type="checkbox"

                                    name="assignedServices"

                                    value="${service.id}"

                                    ${assigned ? "checked" : ""}

                                >



                                <span class="client-service-box"></span>



                            </span>





                            <span class="client-service-copy">



                                <strong>

                                    ${escapeHtml(service.name)}

                                </strong>



                                <small>

                                    ${escapeHtml(service.category || "Altimin Service")}

                                </small>



                            </span>





                            <span class="client-service-code">

                                ${escapeHtml(service.code)}

                            </span>



                        </label>

                    `;



                }

            )

            .join("");





    drawerFields.innerHTML = `



    <div class="client-management-summary">



        <div class="client-management-summary-copy">



            <span>

                ACCOUNT MANAGEMENT

            </span>



            <p>

                Update client information and control which

                Altimin services are active on this account.

            </p>



        </div>





        <div

            style="display:flex;gap:10px;align-items:center;justify-content:flex-end;flex-wrap:wrap;"

        >

            <button

                type="button"

                class="preview-client-button"

                id="sendPortalInviteButton"

            >

                SEND PORTAL INVITE

            </button>



            <button

                type="button"

                class="preview-client-button"

                id="previewClientButton"

            >

                PREVIEW CLIENT PORTAL →

            </button>

        </div>



    </div>



    <div

        id="portalInviteStatus"

        style="margin:-6px 0 22px;font-size:12px;line-height:1.5;color:#6f7891;"

    >

        Checking portal invitation status...

    </div>





        <div class="drawer-field">



            <label>

                COMPANY NAME

            </label>



            <input

                id="fieldCompany"

                type="text"

                value="${escapeHtml(client.company)}"

                required

            >



        </div>





        <div class="drawer-field">



            <label>

                PRIMARY CONTACT

            </label>



            <input

                id="fieldContact"

                type="text"

                value="${escapeHtml(client.contact)}"

                required

            >



        </div>





        <div class="drawer-field">



            <label>

                EMAIL ADDRESS

            </label>



            <input

                id="fieldEmail"

                type="email"

                value="${escapeHtml(client.email)}"

                required

            >



        </div>





        <div class="drawer-field">



            <label>

                REGION

            </label>



            <select

                id="fieldRegion"

                required

            >



                <option

                    value="South Africa"

                    ${

                        client.region ===

                        "South Africa"

                            ? "selected"

                            : ""

                    }

                >

                    South Africa

                </option>



                <option

                    value="United Kingdom"

                    ${

                        client.region ===

                        "United Kingdom"

                            ? "selected"

                            : ""

                    }

                >

                    United Kingdom

                </option>



                <option

                    value="Other"

                    ${

                        client.region !==

                            "South Africa" &&

                        client.region !==

                            "United Kingdom"

                            ? "selected"

                            : ""

                    }

                >

                    Other

                </option>



            </select>



        </div>





        <div class="drawer-field">



            <label>

                ACCOUNT STATUS

            </label>



            <select

                id="fieldStatus"

                required

            >



                <option

                    value="Active"

                    ${

                        client.status ===

                        "Active"

                            ? "selected"

                            : ""

                    }

                >

                    Active

                </option>



                <option

                    value="Inactive"

                    ${

                        client.status ===

                        "Inactive"

                            ? "selected"

                            : ""

                    }

                >

                    Inactive

                </option>



            </select>



        </div>





        <div class="client-services-section">



            <div class="client-services-heading">



                <div>



                    <span>

                        SERVICES

                    </span>



                    <h3>

                        Assigned services

                    </h3>



                </div>





                <small>

                    ${

                        clientServiceIds.length

                    } assigned

                </small>



            </div>





            <div class="client-services-list">



                ${

                    serviceOptions ||

                    `

                        <div class="client-services-empty">

                            No services are available yet.

                        </div>

                    `

                }



            </div>



        </div>



    `;





    const sendPortalInviteButton =

        document.getElementById(

            "sendPortalInviteButton"

        );



    if (sendPortalInviteButton) {


        sendPortalInviteButton.addEventListener(

            "click",

            async () => {


                refreshState();


                const currentClient =

                    PortalStore.getClientById(

                        state,

                        clientId

                    );


                if (!currentClient) {

                    return;

                }


                const emailField =

                    document.getElementById(

                        "fieldEmail"

                    );


                const currentEmail =

                    String(

                        emailField?.value ||

                        ""

                    )

                        .trim()

                        .toLowerCase();


                const savedEmail =

                    String(

                        currentClient.email ||

                        ""

                    )

                        .trim()

                        .toLowerCase();


                if (

                    currentEmail !==

                    savedEmail

                ) {

                    window.alert(

                        "Save the client changes first, then send the portal invitation to the updated email address."

                    );


                    return;

                }


                const confirmed =

                    window.confirm(

                        `Send a portal invitation to ${currentClient.email}?`

                    );


                if (!confirmed) {

                    return;

                }


                sendPortalInviteButton.disabled =

                    true;


                sendPortalInviteButton.textContent =

                    "SENDING INVITE...";


                setPortalInviteMessage(

                    "Sending secure Clerk invitation..."

                );


                try {

                    const result =

                        await window

                            .AltiminPortalApi

                            .sendClientInvitation(

                                currentClient.id

                            );


                    setPortalInviteMessage(

                        `Portal invitation sent to ${result.email}.`

                    );


                    sendPortalInviteButton.textContent =

                        "INVITATION PENDING";


                    sendPortalInviteButton.disabled =

                        true;


                } catch (

                    error

                ) {

                    console.error(

                        "Altimin portal invitation failed:",

                        error

                    );


                    sendPortalInviteButton.textContent =

                        "SEND PORTAL INVITE";


                    sendPortalInviteButton.disabled =

                        false;


                    setPortalInviteMessage(

                        error.message ||

                        "The portal invitation could not be sent.",

                        true

                    );


                    window.alert(

                        error.message ||

                        "The portal invitation could not be sent."

                    );


                }


            }

        );


    }



    const previewClientButton =

        document.getElementById(

            "previewClientButton"

        );





    if (previewClientButton) {



        previewClientButton.addEventListener(

            "click",

            () => {



                refreshState();





                const client =

                    PortalStore.getClientById(

                        state,

                        clientId

                    );





                if (!client) {



                    return;



                }





                state.activeClientId =

                    client.id;





                saveState();





                window.open(AltiminPaths.url("dashboard.html") + "?client=" + encodeURIComponent(client.id), "_blank", "noopener");



            }

        );



    }





    openDrawerShell();



    refreshClientInvitationStatus(

        client.id

    );



}





// =========================================================

// SERVICES

// =========================================================



function renderServices() {



    servicesGrid.innerHTML =

        state.services

            .map(

                service => `

                    <article class="catalogue-card">



                        <span class="catalogue-code">

                            ${escapeHtml(service.code)}

                        </span>



                        <h3>

                            ${escapeHtml(service.name)}

                        </h3>



                        <p>

                            ${escapeHtml(service.description)}

                        </p>



                        <div class="catalogue-footer">



                            <span>

                                ${service.category || "SERVICE"}

                            </span>



                            <span class="status-pill ${statusClass(

                                service.status

                            )}">

                                ${escapeHtml(service.status)}

                            </span>



                        </div>



                    </article>

                `

            )

            .join("");



}





// =========================================================

// HARDWARE

// =========================================================



function renderHardware() {



    hardwareGrid.innerHTML =

        state.hardware

            .map(

                item => `

                    <article class="catalogue-card">



                        <span class="catalogue-code">

                            ${escapeHtml(item.code)}

                        </span>



                        <h3>

                            ${escapeHtml(item.name)}

                        </h3>



                        <p>

                            ${escapeHtml(item.description)}

                        </p>



                        <div class="catalogue-footer">



                            <span>

                                HARDWARE

                            </span>



                            <span class="status-pill ${statusClass(

                                item.status

                            )}">

                                ${escapeHtml(item.status)}

                            </span>



                        </div>



                    </article>

                `

            )

            .join("");



}





// =========================================================

// REQUESTS

// =========================================================



function renderRequests() {



    requestsTableBody.innerHTML =

        state.requests

            .slice()

            .reverse()

            .map(

                request => `

                    <tr>



                        <td>



                            <strong class="table-title">

                                ${escapeHtml(request.title)}

                            </strong>



                            <span class="table-subtitle">

                                ${request.id}<details><summary>Request details</summary>${escapeHtml(request.details || "No additional details.")}</details>

                            </span>



                        </td>



                        <td>

                            ${escapeHtml(getClientName(request.clientId))}

                        </td>



                        <td>

                            ${escapeHtml(request.type)}

                        </td>



                        <td>

                            ${escapeHtml(request.date)}

                        </td>



                        <td>



                            <select

                                class="status-select"

                                data-request-id="${request.id}"

                            >



                                ${[

                                    "Under Review",

                                    "Approved",

                                    "Completed"

                                ]

                                    .map(

                                        status => `

                                            <option

                                                value="${status}"

                                                ${

                                                    status ===

                                                    request.status

                                                        ? "selected"

                                                        : ""

                                                }

                                            >

                                                ${status}

                                            </option>

                                        `

                                    )

                                    .join("")}



                            </select>



                        </td>



                    </tr>

                `

            )

            .join("");





    document

        .querySelectorAll(

            "[data-request-id]"

        )

        .forEach(

            select => {



                select.addEventListener(

                    "change",

                    async () => {



                        refreshState();



                        const request =

                            state.requests.find(

                                item =>

                                    item.id ===

                                    select.dataset.requestId

                            );



                        if (!request) {

                            return;

                        }



                        const previousStatus =

                            request.status;



                        select.disabled =

                            true;



                        try {

                            await window.AltiminPortalApi
                                .updateRequestStatus(
                                    request.id,
                                    select.value
                                );



                            await refreshFromSupabase();



                            renderAll();

                        } catch (
                            error
                        ) {

                            console.error(
                                "Altimin request status update failed:",
                                error
                            );



                            select.value =

                                previousStatus;



                            window.alert(
                                "The request status could not be updated. Please try again."
                            );

                        } finally {

                            select.disabled =

                                false;

                        }

                    }

                );



            }

        );



}





// =========================================================

// DRAWER SHELL

// =========================================================



function openDrawerShell() {



    adminDrawer.classList.add(

        "open"

    );



    drawerBackdrop.classList.add(

        "visible"

    );



    adminDrawer.setAttribute(

        "aria-hidden",

        "false"

    );



}





// =========================================================

// ADD RECORD DRAWER

// =========================================================



function openDrawer(

    mode

) {



    drawerMode =

        mode;



    selectedClientId =

        null;





    if (drawerSubmit) {



        drawerSubmit.textContent =

            "Save";



    }





    if (

        mode === "client"

    ) {



        drawerEyebrow.textContent =

            "NEW CLIENT";



        drawerTitle.textContent =

            "Add client";





        drawerFields.innerHTML = `

            <div class="drawer-field">



                <label>

                    COMPANY NAME

                </label>



                <input

                    id="fieldCompany"

                    type="text"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    PRIMARY CONTACT

                </label>



                <input

                    id="fieldContact"

                    type="text"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    EMAIL ADDRESS

                </label>



                <input

                    id="fieldEmail"

                    type="email"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    REGION

                </label>



                <select

                    id="fieldRegion"

                    required

                >



                    <option value="South Africa">

                        South Africa

                    </option>



                    <option value="United Kingdom">

                        United Kingdom

                    </option>



                    <option value="Other">

                        Other

                    </option>



                </select>



            </div>

        `;



    }





    if (

        mode === "service"

    ) {



        drawerEyebrow.textContent =

            "SERVICE CATALOGUE";



        drawerTitle.textContent =

            "Add service";





        drawerFields.innerHTML = `

            <div class="drawer-field">



                <label>

                    SERVICE NAME

                </label>



                <input

                    id="fieldName"

                    type="text"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    CODE

                </label>



                <input

                    id="fieldCode"

                    type="text"

                    maxlength="6"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    CATEGORY

                </label>



                <input

                    id="fieldCategory"

                    type="text"

                    placeholder="e.g. Cloud & Productivity"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    DESCRIPTION

                </label>



                <input

                    id="fieldDescription"

                    type="text"

                    required

                >



            </div>

        `;



    }





    if (

        mode === "hardware"

    ) {



        drawerEyebrow.textContent =

            "HARDWARE CATALOGUE";



        drawerTitle.textContent =

            "Add hardware";





        drawerFields.innerHTML = `

            <div class="drawer-field">



                <label>

                    HARDWARE NAME

                </label>



                <input

                    id="fieldName"

                    type="text"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    CODE

                </label>



                <input

                    id="fieldCode"

                    type="text"

                    maxlength="6"

                    required

                >



            </div>





            <div class="drawer-field">



                <label>

                    DESCRIPTION

                </label>



                <input

                    id="fieldDescription"

                    type="text"

                    required

                >



            </div>

        `;



    }





    openDrawerShell();



}





// =========================================================

// CLOSE DRAWER

// =========================================================



function closeDrawer() {



    adminDrawer.classList.remove(

        "open"

    );



    drawerBackdrop.classList.remove(

        "visible"

    );



    adminDrawer.setAttribute(

        "aria-hidden",

        "true"

    );





    drawerMode =

        null;



    selectedClientId =

        null;





    if (drawerSubmit) {



        drawerSubmit.textContent =

            "Save";



    }





    drawerForm.reset();



}





// =========================================================

// SAVE DRAWER

// =========================================================



drawerForm.addEventListener(

    "submit",

    async event => {



        event.preventDefault();



        refreshState();



        if (!window.AltiminPortalApi) {

            console.error(
                "Altimin Supabase portal API is unavailable."
            );



            return;

        }



        const originalSubmitText =

            drawerSubmit?.textContent ||
            "Save";



        if (drawerSubmit) {

            drawerSubmit.disabled =

                true;



            drawerSubmit.textContent =

                "Saving...";

        }



        try {

            // =================================================
            // MANAGE EXISTING CLIENT
            // =================================================

            if (
                drawerMode ===
                "manage-client"
            ) {

                const client =

                    PortalStore.getClientById(

                        state,

                        selectedClientId

                    );



                if (!client) {

                    return;

                }



                const serviceIds =

                    Array.from(

                        document.querySelectorAll(

                            'input[name="assignedServices"]:checked'

                        )

                    ).map(

                        checkbox =>

                            Number(

                                checkbox.value

                            )

                    );



                await window.AltiminPortalApi
                    .updateClient(
                        client.id,
                        {
                            company:
                                document
                                    .getElementById(
                                        "fieldCompany"
                                    )
                                    .value
                                    .trim(),

                            contact:
                                document
                                    .getElementById(
                                        "fieldContact"
                                    )
                                    .value
                                    .trim(),

                            email:
                                document
                                    .getElementById(
                                        "fieldEmail"
                                    )
                                    .value
                                    .trim(),

                            region:
                                document
                                    .getElementById(
                                        "fieldRegion"
                                    )
                                    .value,

                            status:
                                document
                                    .getElementById(
                                        "fieldStatus"
                                    )
                                    .value
                        }
                    );



                await window.AltiminPortalApi
                    .assignClientServices(
                        client.id,
                        serviceIds
                    );



                await refreshFromSupabase();



                closeDrawer();



                renderAll();



                return;

            }



            // =================================================
            // ADD CLIENT
            // =================================================

            if (
                drawerMode ===
                "client"
            ) {

                await window.AltiminPortalApi
                    .createClient({

                        company:
                            document
                                .getElementById(
                                    "fieldCompany"
                                )
                                .value
                                .trim(),

                        contact:
                            document
                                .getElementById(
                                    "fieldContact"
                                )
                                .value
                                .trim(),

                        email:
                            document
                                .getElementById(
                                    "fieldEmail"
                                )
                                .value
                                .trim(),

                        region:
                            document
                                .getElementById(
                                    "fieldRegion"
                                )
                                .value,

                        status:
                            "Active"

                    });

            }



            // =================================================
            // ADD SERVICE
            // =================================================

            if (
                drawerMode ===
                "service"
            ) {

                await window.AltiminPortalApi
                    .createService({

                        name:
                            document
                                .getElementById(
                                    "fieldName"
                                )
                                .value
                                .trim(),

                        code:
                            document
                                .getElementById(
                                    "fieldCode"
                                )
                                .value
                                .trim()
                                .toUpperCase(),

                        category:
                            document
                                .getElementById(
                                    "fieldCategory"
                                )
                                .value
                                .trim(),

                        description:
                            document
                                .getElementById(
                                    "fieldDescription"
                                )
                                .value
                                .trim(),

                        status:
                            "Active"

                    });

            }



            // =================================================
            // ADD HARDWARE
            // =================================================

            if (
                drawerMode ===
                "hardware"
            ) {

                await window.AltiminPortalApi
                    .createHardware({

                        name:
                            document
                                .getElementById(
                                    "fieldName"
                                )
                                .value
                                .trim(),

                        code:
                            document
                                .getElementById(
                                    "fieldCode"
                                )
                                .value
                                .trim()
                                .toUpperCase(),

                        category:
                            "Hardware",

                        description:
                            document
                                .getElementById(
                                    "fieldDescription"
                                )
                                .value
                                .trim(),

                        status:
                            "Active"

                    });

            }



            await refreshFromSupabase();



            closeDrawer();



            renderAll();

        } catch (
            error
        ) {

            console.error(
                "Altimin admin write failed:",
                error
            );



            window.alert(
                "The change could not be saved to Supabase. Please try again."
            );

        } finally {

            if (drawerSubmit) {

                drawerSubmit.disabled =

                    false;



                if (
                    drawerMode ===
                    "manage-client"
                ) {

                    drawerSubmit.textContent =

                        "Save Changes";

                } else if (
                    drawerMode
                ) {

                    drawerSubmit.textContent =

                        originalSubmitText;

                } else {

                    drawerSubmit.textContent =

                        "Save";

                }

            }

        }

    }

);





// =========================================================

// DRAWER BUTTONS

// =========================================================



document

    .querySelectorAll(

        "[data-action]"

    )

    .forEach(

        button => {



            button.addEventListener(

                "click",

                () => {



                    const action =

                        button.dataset.action;





                    if (

                        action ===

                        "add-client"

                    ) {



                        openDrawer(

                            "client"

                        );



                    }





                    if (

                        action ===

                        "add-service"

                    ) {



                        openDrawer(

                            "service"

                        );



                    }





                    if (

                        action ===

                        "add-hardware"

                    ) {



                        openDrawer(

                            "hardware"

                        );



                    }



                }

            );



        }

    );





drawerClose.addEventListener(

    "click",

    closeDrawer

);





drawerBackdrop.addEventListener(

    "click",

    closeDrawer

);





document.addEventListener(

    "keydown",

    event => {



        if (

            event.key ===

            "Escape"

        ) {



            closeDrawer();



        }



    }

);





// =========================================================

// SEARCH

// =========================================================



clientSearch.addEventListener(

    "input",

    () => {



        renderClients(

            clientSearch.value

        );



    }

);





// =========================================================

// MOBILE SIDEBAR

// =========================================================



if (

    mobileMenuButton &&

    adminSidebar

) {



    mobileMenuButton.addEventListener(

        "click",

        () => {



            adminSidebar.classList.toggle(

                "mobile-open"

            );



        }

    );



}





// =========================================================

// AUTHENTICATED ADMIN IDENTITY

// =========================================================


function renderAdminIdentity(
    context
) {

    const identity =
        context?.identity;


    if (!identity) {

        return;

    }


    const avatar =
        document.getElementById(
            "adminUserAvatar"
        );


    const name =
        document.getElementById(
            "adminUserName"
        );


    const meta =
        document.getElementById(
            "adminUserMeta"
        );


    if (avatar) {

        avatar.textContent =
            identity.initials;

    }


    if (name) {

        name.textContent =
            identity.displayName;

    }


    if (meta) {

        meta.textContent =
            identity.email ||
            "Administrator";

    }

}


async function initialiseAdminPage() {

    try {

        if (!window.AltiminSession) {

            throw new Error(
                "Altimin session manager is unavailable."
            );

        }


        const context =
            await window.AltiminSession
                .requireAccess([
                    "admin"
                ]);


        if (!context) {

            return;

        }


        if (!window.AltiminPortalApi) {

            throw new Error(
                "Altimin Supabase portal API is unavailable."
            );

        }


        const remoteState =
            await window.AltiminPortalApi
                .loadState();


        PortalStore.hydrate(
            remoteState
        );


        renderAdminIdentity(
            context
        );


        renderAll();
        document.documentElement.classList.remove("auth-pending");

    } catch (
        error
    ) {

        console.error(
            "Altimin admin session failed:",
            error
        );


        window.altiminAccessError("Portal data could not be loaded. Check your connection, or contact your administrator.");

    }

}


const adminSignOutButton =
    document.getElementById(
        "adminSignOutButton"
    );


if (adminSignOutButton) {

    adminSignOutButton.addEventListener(
        "click",
        async event => {

            event.preventDefault();


            try {

                await window.AltiminSession
                    .signOut();

            } catch (
                error
            ) {

                console.error(
                    "Altimin sign out failed:",
                    error
                );


                window.alert("Sign-out failed. Check your connection and try again.");

            }

        }
    );

}


// =========================================================

// CROSS-PAGE SYNC

// =========================================================



window.addEventListener(

    "storage",

    event => {



        if (

            event.key ===

            "altiminPortalV2"

        ) {



            PortalStore.syncFromCache();



            renderAll();



        }



    }

);





window.addEventListener(

    "altiminPortalUpdated",

    () => {



        renderAll();



    }

);





// =========================================================

// RENDER

// =========================================================



function renderAll() {



    refreshState();





    renderOverview();





    renderClients(

        clientSearch?.value ||

        ""

    );





    renderServices();



    renderHardware();



    renderRequests();



}





initialiseAdminPage();