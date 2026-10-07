-- ============================================================
-- ALTIMIN CLIENT PORTAL
-- PHASE 5 / STEP 02
-- NAME: ALTIMIN_P5_02_VERIFY_INVITE_RECORD
--
-- PURPOSE:
-- Verify that the admin Send Portal Invite action created a
-- tracked Supabase invitation record.
-- ============================================================

select
    i.id,
    i.client_id,
    c.company,
    i.email,
    i.clerk_invitation_id,
    i.status,
    i.invited_by,
    i.expires_at,
    i.created_at,
    i.updated_at
from public.portal_invitations i
join public.portal_clients c
    on c.id = i.client_id
order by i.created_at desc;
