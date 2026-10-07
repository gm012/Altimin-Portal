// Signed webhook data only. Browser metadata is never passed to this function.
export function invitedUser(user: {
  id?: string; public_metadata?: Record<string, unknown>;
  email_addresses?: Array<{ email_address: string; verification?: { status?: string } | null }>;
}) {
  const metadata = user.public_metadata;
  const clientId = Number(metadata?.altimin_client_id);
  const invitationId = metadata?.altimin_invitation_id;
  if (metadata?.altimin_role !== "client" || !user.id?.startsWith("user_") ||
      !Number.isSafeInteger(clientId) || clientId <= 0 ||
      typeof invitationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitationId)) return null;
  const emails = (user.email_addresses || [])
    .filter(email => email.verification?.status === "verified")
    .map(email => email.email_address.trim().toLowerCase());
  if (!emails.length) return null;
  return { p_invitation_id: invitationId, p_clerk_user_id: user.id,
    p_client_id: clientId, p_verified_emails: emails };
}

