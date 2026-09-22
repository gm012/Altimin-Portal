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
                                ${request.title}
                            </strong>

                            <span class="table-subtitle">
                                ${request.id}
                            </span>

                        </td>

                        <td>
                            ${getClientName(
                                request.clientId
                            )}
                        </td>

                        <td>
                            ${request.type}
                        </td>

                        <td>

                            <span class="status-pill ${statusClass(
                                request.status
                            )}">
                                ${request.status}
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
                        ${client.company}
                        ${client.contact}
                        ${client.email}
                        ${client.region}
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
                            title="Manage ${client.company}"
                        >

                            <td>

                                <strong class="table-title">
                                    ${client.company}
                                </strong>

                                <span class="table-subtitle">
                                    ${client.email}
                                </span>

                            </td>

                            <td>
                                ${client.contact}
                            </td>

                            <td>
                                ${client.region}
                            </td>

                            <td>
                                ${serviceCount}
                            </td>

                            <td>

                                <span class="status-pill ${statusClass(
                                    client.status
                                )}">
                                    ${client.status}
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
                                    ${service.name}
                                </strong>

                                <small>
                                    ${service.category || "Altimin Service"}
                                </small>

                            </span>


                            <span class="client-service-code">
                                ${service.code}
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


            <button
                type="button"
                class="view-client-portal-button"
                id="viewClientPortalButton"
            >
                View Portal →
            </button>

        </div>


        <div class="drawer-field">

            <label>
                COMPANY NAME
            </label>

            <input
                id="fieldCompany"
                type="text"
                value="${client.company}"
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
                value="${client.contact}"
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
                value="${client.email}"
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


    const viewClientPortalButton =
        document.getElementById(
            "viewClientPortalButton"
        );


    if (viewClientPortalButton) {

        viewClientPortalButton.addEventListener(
            "click",
            () => {

                refreshState();


                const selectedClient =
                    PortalStore.getClientById(
                        state,
                        clientId
                    );


                if (!selectedClient) {

                    return;

                }


                state.activeClientId =
                    selectedClient.id;


                saveState();


                window.open(
                    "dashboard.html",
                    "_blank"
                );

            }
        );

    }


    openDrawerShell();

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
                            ${service.code}
                        </span>

                        <h3>
                            ${service.name}
                        </h3>

                        <p>
                            ${service.description}
                        </p>

                        <div class="catalogue-footer">

                            <span>
                                ${service.category || "SERVICE"}
                            </span>

                            <span class="status-pill ${statusClass(
                                service.status
                            )}">
                                ${service.status}
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
                            ${item.code}
                        </span>

                        <h3>
                            ${item.name}
                        </h3>

                        <p>
                            ${item.description}
                        </p>

                        <div class="catalogue-footer">

                            <span>
                                HARDWARE
                            </span>

                            <span class="status-pill ${statusClass(
                                item.status
                            )}">
                                ${item.status}
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
                                ${request.title}
                            </strong>

                            <span class="table-subtitle">
                                ${request.id}
                            </span>

                        </td>

                        <td>
                            ${getClientName(
                                request.clientId
                            )}
                        </td>

                        <td>
                            ${request.type}
                        </td>

                        <td>
                            ${request.date}
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
                    () => {

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


                        request.status =
                            select.value;


                        saveState();

                        renderAll();

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
    event => {

        event.preventDefault();


        refreshState();


        // =====================================================
        // MANAGE EXISTING CLIENT
        // =====================================================

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


            client.company =
                document
                    .getElementById(
                        "fieldCompany"
                    )
                    .value
                    .trim();


            client.contact =
                document
                    .getElementById(
                        "fieldContact"
                    )
                    .value
                    .trim();


            client.email =
                document
                    .getElementById(
                        "fieldEmail"
                    )
                    .value
                    .trim();


            client.region =
                document
                    .getElementById(
                        "fieldRegion"
                    )
                    .value;


            client.status =
                document
                    .getElementById(
                        "fieldStatus"
                    )
                    .value;


            client.serviceIds =
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


            saveState();

            closeDrawer();

            renderAll();

            return;

        }


        // =====================================================
        // ADD CLIENT
        // =====================================================

        if (
            drawerMode === "client"
        ) {

            state.clients.push({

                id:
                    Date.now(),

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
                    "Active",

                serviceIds:
                    []

            });

        }


        // =====================================================
        // ADD SERVICE
        // =====================================================

        if (
            drawerMode === "service"
        ) {

            state.services.push({

                id:
                    Date.now(),

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


        // =====================================================
        // ADD HARDWARE
        // =====================================================

        if (
            drawerMode === "hardware"
        ) {

            state.hardware.push({

                id:
                    Date.now(),

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


        saveState();

        closeDrawer();

        renderAll();

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
// CROSS-PAGE SYNC
// =========================================================

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            "altiminPortalV2"
        ) {

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


renderAll();