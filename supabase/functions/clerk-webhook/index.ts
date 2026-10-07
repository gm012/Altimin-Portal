import { verifyWebhook } from "npm:@clerk/backend@3.23.0/webhooks";
import { database, env, reply } from "../_shared/security.ts";
import { invitedUser } from "../_shared/invited-user.ts";

Deno.serve(async request => {
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  let secret: string;
  try { secret = env("CLERK_WEBHOOK_SIGNING_SECRET"); }
  catch { return reply({ error: "Webhook is not configured." }, 503); }
  let event;
  try { event = await verifyWebhook(request, { signingSecret: secret }); }
  catch { return reply({ error: "Invalid webhook signature." }, 400); }
  if (event.type !== "user.created" && event.type !== "user.updated") return reply({ received: true });
  const candidate = invitedUser(event.data);
  if (!candidate) return reply({ received: true, ignored: true });
  try {
    const result = await database().rpc("portal_accept_invitation", candidate);
    if (result.error) {
      // Non-2xx allows Clerk retries; no secret or raw payload in response/logs.
      console.error("clerk-webhook: provisioning rejected", result.error.code);
      return reply({ error: "Membership provisioning requires review or retry." }, 503);
    }
    return reply({ received: true });
  } catch {
    return reply({ error: "Membership provisioning is temporarily unavailable." }, 503);
  }
});

