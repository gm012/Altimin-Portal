import { cors, database, env, reply, verifiedSubject } from "../_shared/security.ts";

Deno.serve(async request => {
  let headers: Record<string,string>;
  try { headers = cors(request); }
  catch { return reply({ error: "The invitation service is not configured." }, 503); }
  const respond = (body: unknown, status = 200) => reply(body, status, headers);
  if (!headers["Access-Control-Allow-Origin"]) return respond({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405);
  let subject: string;
  try { subject = await verifiedSubject(request); }
  catch { return respond({ error: "Your session could not be verified. Sign in again." }, 401); }
  try {
    const db = database();
    const { data: member, error: memberError } = await db.from("portal_members")
      .select("id,role,active").eq("clerk_user_id", subject).maybeSingle();
    if (memberError) return respond({ error: "Access could not be checked. Try again." }, 503);
    if (!member?.active || member.role !== "admin") {
      return respond({ error: "Administrator access is required." }, 403);
    }
    let body;
    try { body = await request.json(); }
    catch { return respond({ error: "A client ID is required." }, 400); }
    const clientId = Number(body?.clientId);
    if (!Number.isSafeInteger(clientId) || clientId <= 0) {
      return respond({ error: "A valid client ID is required." }, 400);
    }
    // Validate configuration BEFORE reserving anything. Never take redirect/email from the browser.
    const key = env("CLERK_SECRET_KEY");
    const redirect = new URL(env("PORTAL_INVITE_REDIRECT_URL"));
    if (!headers || !env("PORTAL_ALLOWED_ORIGINS").split(",").map(x=>x.trim()).includes(redirect.origin) ||
        redirect.pathname.split("/").pop() !== "accept-invitation.html" ||
        (redirect.protocol !== "https:" && redirect.origin !== "http://localhost:3000")) {
      return respond({ error: "The invitation redirect is not configured correctly." }, 503);
    }
    // Service-only RPC rechecks admin/client and reserves under an advisory lock.
    const reservation = await db.rpc("portal_reserve_invitation", {
      p_client_id: clientId, p_admin_id: member.id,
    });
    if (reservation.error) {
      const code = reservation.error.message;
      const messages: Record<string,string> = {
        pending_invitation: "An invitation is already pending for this email. Do not send another.",
        portal_user_exists: "This client already has a portal user. Review their access first.",
        invite_cooldown: "Please wait five minutes before trying another invitation.",
        inactive_client: "Only active clients can receive invitations.",
        invalid_email: "Save a valid client email address first.",
      };
      return respond({ error: messages[code] || "The invitation could not be prepared. Check the database setup." }, 409);
    }
    const invitation = reservation.data;
    let response: Response;
    try {
      response = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST", signal: AbortSignal.timeout(15000),
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify({
          email_address: invitation.email, notify: true, ignore_existing: false,
          expires_in_days: 30, redirect_url: redirect.href,
          public_metadata: { altimin_role: "client", altimin_client_id: clientId,
            altimin_invitation_id: invitation.id },
        }),
      });
    } catch {
      // Outcome is unknown: keep reservation to prevent duplicate emails.
      return respond({ error: "Delivery could not be confirmed. An administrator must check the invitation in Clerk before retrying." }, 502);
    }
    if (!response.ok) {
      if (response.status < 500) {
        await db.from("portal_invitations").update({ status: "revoked", updated_at: new Date().toISOString() })
          .eq("id", invitation.id).eq("status", "pending");
      }
      return respond({ error: "Clerk could not send the invitation. Check whether this email already has an account and review Clerk's configuration." }, 502);
    }
    let payload;
    try { payload = await response.json(); } catch { payload = null; }
    if (!payload?.id) return respond({ error: "Delivery needs administrator review in Clerk. Do not resend yet." }, 502);
    // Don't overwrite accepted status if the webhook wins the race.
    const saved = await db.from("portal_invitations")
      .update({ clerk_invitation_id: payload.id, updated_at: new Date().toISOString() })
      .eq("id", invitation.id);
    if (saved.error) return respond({ error: "The email was sent, but its record needs administrator review. Do not resend." }, 500);
    return respond({ success: true, clientId, email: invitation.email, status: "pending", invitationId: invitation.id });
  } catch {
    console.error("send-client-invite: configuration or service failure");
    return respond({ error: "The invitation service is temporarily unavailable." }, 503);
  }
});

