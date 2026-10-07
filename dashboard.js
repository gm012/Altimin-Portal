// =========================================================

// ALTIMIN CLIENT PORTAL

// CLIENT DASHBOARD

// =========================================================



let portalState =

    PortalStore.load();





let activeClient =

    PortalStore.getActiveClient(

        portalState

    );





let currentRequestType =

    "service";



let authenticatedIdentity =

    null;





// =========================================================

// ELEMENTS

// =========================================================



const serviceGrid =

    document.getElementById(

        "serviceGrid"

    );



const requestTableBody =

    document.getElementById(

        "requestTableBody"

    );



const activeServiceCount =

    document.getElementById(

        "activeServiceCount"

    );



const openRequestCount =

    document.getElementById(

        "openRequestCount"

    );



const portalSidebar =

    document.getElementById(

        "portalSidebar"

    );



const mobileMenuButton =

    document.getElementById(

        "mobileMenuButton"

    );



const requestDrawer =

    document.getElementById(

        "requestDrawer"

    );



const drawerBackdrop =

    document.getElementById(

        "drawerBackdrop"

    );



const drawerClose =

    document.getElementById(

        "drawerClose"

    );



const requestDrawerEyebrow =

    document.getElementById(

        "requestDrawerEyebrow"

    );



const requestDrawerTitle =

    document.getElementById(

        "requestDrawerTitle"

    );



const requestCategory =

    document.getElementById(

        "requestCategory"

    );



const requestQuantity =

    document.getElementById(

        "requestQuantity"

    );



const requestDetails =

    document.getElementById(

        "requestDetails"

    );



const requestForm =

    document.getElementById(

        "requestForm"

    );



const signOutButton =

    document.getElementById(

        "signOutButton"

    );





// =========================================================

// ACTIVE CLIENT

// =========================================================



function refreshState() {



    portalState =

        PortalStore.load();





    activeClient =

        PortalStore.getActiveClient(

            portalState

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



    return portalState;



}





function getFallbackClientIdentity() {

    const fallbackName =
        activeClient?.contact ||
        "Altimin User";


    const parts =
        fallbackName
            .split(/\s+/)
            .filter(Boolean);


    return {

        displayName:
            fallbackName,

        firstName:
            parts[0] ||
            "there",

        initials:
            parts
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
            "AU"

    };

}


function renderClientIdentity() {

    if (!activeClient) {

        return;

    }


    const identity =
        authenticatedIdentity ||
        getFallbackClientIdentity();


    const sidebarName =
        document.querySelector(
            ".sidebar-account strong"
        );


    const sidebarCompany =
        document.querySelector(
            ".sidebar-account div span"
        );


    const avatar =
        document.querySelector(
            ".account-avatar"
        );


    const greetingName =
        document.querySelector(
            ".dashboard-header h1 span"
        );


    if (sidebarName) {

        sidebarName.textContent =
            identity.displayName;

    }


    if (sidebarCompany) {

        sidebarCompany.textContent =
            activeClient.company;

    }


    if (avatar) {

        avatar.textContent =
            identity.initials;

    }


    if (greetingName) {

        greetingName.textContent =
            `${identity.firstName}.`;

    }

}


// =========================================================

// SERVICES

// =========================================================



function renderServices() {



    if (

        !serviceGrid ||

        !activeClient

    ) {

        return;

    }





    const services =

        PortalStore.getClientServices(

            portalState,

            activeClient.id

        );





    if (

        services.length ===

        0

    ) {



        serviceGrid.innerHTML = `

            <article class="service-card">



                <div class="service-card-copy">



                    <span>

                        ACCOUNT

                    </span>



                    <h3>

                        No active services

                    </h3>



                    <p>

                        There are currently no services assigned

                        to this account.

                    </p>



                </div>



            </article>

        `;





        return;



    }





    serviceGrid.innerHTML =

        services

            .map(

                (

                    service,

                    index

                ) => `

                    <article class="service-card">



                        <div class="service-card-top">



                            <span class="service-code">

                                ${service.code}

                            </span>



                            <span class="service-status">

                                ${service.status}

                            </span>



                        </div>





                        <div class="service-card-copy">



                            <span>

                                ${service.category}

                            </span>



                            <h3>

                                ${service.name}

                            </h3>



                            <p>

                                ${service.description}

                            </p>



                        </div>





                        <div class="service-card-footer">



                            <span>

                                SERVICE ${String(

                                    index + 1

                                ).padStart(

                                    2,

                                    "0"

                                )}

                            </span>



                            <button

                                type="button"

                                class="service-details-button"

                            >

                                Details →

                            </button>



                        </div>



                    </article>

                `

            )

            .join("");



}





// =========================================================

// REQUEST STATUS

// =========================================================



function getRequestStatusClass(

    status

) {



    const normalized =

        status

            .toLowerCase()

            .replace(

                /\s+/g,

                "-"

            );





    return `request-status request-status-${normalized}`;



}





// =========================================================

// REQUESTS

// =========================================================



function getClientRequests() {



    if (!activeClient) {

        return [];

    }





    return PortalStore

        .getClientRequests(

            portalState,

            activeClient.id

        )

        .slice()

        .reverse();



}





function renderRequests() {



    if (!requestTableBody) {

        return;

    }





    const requests =

        getClientRequests();





    if (

        requests.length ===

        0

    ) {



        requestTableBody.innerHTML = `

            <tr>



                <td colspan="4">

                    No requests have been submitted yet.

                </td>



            </tr>

        `;





        return;



    }





    requestTableBody.innerHTML =

        requests

            .map(

                request => `

                    <tr>



                        <td>



                            <strong>

                                ${request.title}

                            </strong>



                            <span>

                                ${request.id}

                            </span>



                        </td>



                        <td>

                            ${request.type}

                        </td>



                        <td>

                            ${request.date}

                        </td>



                        <td>



                            <span class="${getRequestStatusClass(

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

// SUMMARY

// =========================================================



function updateSummary() {



    if (!activeClient) {

        return;

    }





    const services =

        PortalStore.getClientServices(

            portalState,

            activeClient.id

        );





    const requests =

        PortalStore.getClientRequests(

            portalState,

            activeClient.id

        );





    const openRequests =

        requests.filter(

            request =>

                request.status !==

                "Completed"

        );





    if (activeServiceCount) {



        activeServiceCount.textContent =

            String(

                services.length

            ).padStart(

                2,

                "0"

            );



    }





    if (openRequestCount) {



        openRequestCount.textContent =

            String(

                openRequests.length

            ).padStart(

                2,

                "0"

            );



    }



}





// =========================================================

// REQUEST CATEGORIES

// =========================================================



function populateRequestCategories(

    type

) {



    if (!requestCategory) {

        return;

    }





    const items =

        type === "hardware"

            ? portalState.hardware

            : portalState.services;





    const activeItems =

        items.filter(

            item =>

                item.status ===

                "Active"

        );





    requestCategory.innerHTML =

        `

            <option value="">

                Select a category

            </option>

        ` +

        activeItems

            .map(

                item => `

                    <option value="${item.name}">

                        ${item.name}

                    </option>

                `

            )

            .join("");



}





// =========================================================

// DRAWER

// =========================================================



function openRequestDrawer(

    type

) {



    if (

        !requestDrawer ||

        !drawerBackdrop

    ) {

        return;

    }





    refreshState();





    currentRequestType =

        type === "hardware"

            ? "hardware"

            : "service";





    const hardware =

        currentRequestType ===

        "hardware";





    if (requestDrawerEyebrow) {



        requestDrawerEyebrow.textContent =

            hardware

                ? "NEW HARDWARE REQUEST"

                : "NEW SERVICE REQUEST";



    }





    if (requestDrawerTitle) {



        requestDrawerTitle.textContent =

            hardware

                ? "Request hardware"

                : "Request a service";



    }





    populateRequestCategories(

        currentRequestType

    );





    requestDrawer.classList.add(

        "open"

    );



    drawerBackdrop.classList.add(

        "visible"

    );



    requestDrawer.setAttribute(

        "aria-hidden",

        "false"

    );



    document.body.classList.add(

        "drawer-open"

    );



}





function closeRequestDrawer() {



    if (

        !requestDrawer ||

        !drawerBackdrop

    ) {

        return;

    }





    requestDrawer.classList.remove(

        "open"

    );



    drawerBackdrop.classList.remove(

        "visible"

    );



    requestDrawer.setAttribute(

        "aria-hidden",

        "true"

    );



    document.body.classList.remove(

        "drawer-open"

    );



}





// =========================================================

// OPEN DRAWER BUTTONS

// =========================================================



document

    .querySelectorAll(

        "[data-open-request]"

    )

    .forEach(

        button => {



            button.addEventListener(

                "click",

                () => {



                    openRequestDrawer(

                        button.dataset

                            .openRequest

                    );



                }

            );



        }

    );





if (drawerClose) {



    drawerClose.addEventListener(

        "click",

        closeRequestDrawer

    );



}





if (drawerBackdrop) {



    drawerBackdrop.addEventListener(

        "click",

        closeRequestDrawer

    );



}





document.addEventListener(

    "keydown",

    event => {



        if (

            event.key ===

            "Escape"

        ) {



            closeRequestDrawer();



        }



    }

);





// =========================================================

// SUBMIT REQUEST

// =========================================================



if (requestForm) {



    requestForm.addEventListener(

        "submit",

        async event => {



            event.preventDefault();



            refreshState();



            if (!activeClient) {

                return;

            }



            const category =

                requestCategory.value;



            const quantity =

                Number(

                    requestQuantity.value

                );



            const details =

                requestDetails.value.trim();



            if (
                !category ||
                !quantity ||
                !details
            ) {

                return;

            }



            const submitButton =

                requestForm.querySelector(

                    ".request-submit"

                );



            const originalSubmitText =

                submitButton?.textContent ||
                "Submit Request";



            if (submitButton) {

                submitButton.disabled =

                    true;



                submitButton.textContent =

                    "Submitting...";

            }



            try {

                await window.AltiminPortalApi
                    .createRequest({

                        clientId:
                            activeClient.id,

                        title:
                            quantity > 1
                                ? `${quantity} × ${category}`
                                : category,

                        type:
                            currentRequestType ===
                                "hardware"
                                ? "Hardware"
                                : "Service",

                        quantity,

                        details

                    });



                await refreshFromSupabase();



                requestForm.reset();



                closeRequestDrawer();



                renderAll();

            } catch (
                error
            ) {

                console.error(
                    "Altimin request submission failed:",
                    error
                );



                window.alert(
                    "The request could not be submitted to Supabase. Please try again."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =

                        false;



                    submitButton.textContent =

                        originalSubmitText;

                }

            }

        }

    );



}





// =========================================================

// SIGN OUT

// =========================================================


if (signOutButton) {

    signOutButton.addEventListener(
        "click",
        async () => {

            signOutButton.disabled =
                true;


            try {

                if (!window.AltiminSession) {

                    throw new Error(
                        "Altimin session manager is unavailable."
                    );

                }


                await window.AltiminSession
                    .signOut();

            } catch (
                error
            ) {

                console.error(
                    "Altimin sign out failed:",
                    error
                );


                window.location.replace(
                    "index.html"
                );

            }

        }
    );

}


// =========================================================

// CROSS-TAB SUPABASE CACHE SYNC

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



    renderClientIdentity();



    renderServices();



    renderRequests();



    updateSummary();



}



async function initialiseDashboardPage() {

    try {

        if (!window.AltiminSession) {

            throw new Error(
                "Altimin session manager is unavailable."
            );

        }


        const context =
            await window.AltiminSession
                .requireAccess([
                    "client",
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


        refreshState();


        authenticatedIdentity =
            context.identity;


        // A real client account should always see its own
        // client record. Admin users are intentionally left
        // on the currently selected client so the existing
        // admin preview workflow keeps working.

        if (
            context.membership?.role ===
                "client" &&
            context.membership.client_id
        ) {

            const assignedClient =
                PortalStore.getClientById(
                    portalState,
                    context.membership.client_id
                );


            if (assignedClient) {

                portalState.activeClientId =
                    assignedClient.id;


                PortalStore.save(
                    portalState
                );

            }

        }


        renderAll();

    } catch (
        error
    ) {

        console.error(
            "Altimin dashboard session failed:",
            error
        );


        window.location.replace(
            "index.html"
        );

    }

}



initialiseDashboardPage();