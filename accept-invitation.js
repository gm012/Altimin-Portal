(async function () {
  const year = document.getElementById("currentYear");
  if (year) year.textContent = new Date().getFullYear();
  const message = document.getElementById("acceptMessage");
  const host = document.getElementById("clerkSignUp");
  const retry = document.getElementById("retryAccess");
  const logout = document.getElementById("switchAccount");
  let polling = false;
  const say = text => { message.textContent = text; };
  async function checkAccess() {
    if (polling) return;
    polling = true; retry.hidden = true;
    try {
      for (let attempt=0; attempt<15; attempt++) {
        const context = await AltiminSession.init({ refresh:true });
        if (!context.signedIn) return;
        logout.hidden = false;
        const member = context.membership;
        if (member && !member.active) {
          say("Your portal access is inactive. Contact your Altimin administrator."); return;
        }
        if (member?.active && ["admin","client"].includes(member.role)) {
          location.replace(AltiminPaths.url(member.role==="admin" ? "admin.html" : "dashboard.html")); return;
        }
        say("Your account is signed in. Waiting for Altimin to confirm your invitation…");
        await new Promise(resolve=>setTimeout(resolve,2000));
      }
      say("Your account is signed in, but portal access is not ready. Try again shortly or ask your administrator to check the invitation.");
      retry.hidden = false;
    } catch { say("Access could not be checked. Check your connection and try again."); retry.hidden=false; }
    finally { polling=false; }
  }
  retry.onclick = checkAccess;
  logout.onclick = async () => {
    try {
      // Retain the invitation ticket only in the current URL, never browser storage.
      await Clerk.signOut({ redirectUrl:location.href });
      location.reload();
    } catch { say("Could not sign out. Please try again."); }
  };
  try {
    const context = await AltiminSession.init({ refresh:true });
    if (context.signedIn) { await checkAccess(); return; }
    if (!new URL(location.href).searchParams.get("__clerk_ticket")) {
      say("This link has no invitation ticket. Open the latest invitation email, or return to sign in."); return;
    }
    say("Create your own account using the email that received the invitation. If Clerk reports an expired link, ask Altimin for a new invitation.");
    // Maintained Clerk component validates the invitation ticket in this URL.
    Clerk.mountSignUp(host, {
      routing:"hash", signInUrl:AltiminPaths.url("index.html"),
      forceRedirectUrl:AltiminPaths.url("accept-invitation.html"),
      fallbackRedirectUrl:AltiminPaths.url("accept-invitation.html"),
    });
    Clerk.addListener(({ session }) => { if (session) checkAccess(); });
  } catch { say("Secure sign-up is unavailable. Reload this page or contact Altimin."); }
})();
