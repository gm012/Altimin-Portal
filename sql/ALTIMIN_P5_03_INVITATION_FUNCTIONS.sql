-- P5 additive migration. Run once before deploying Phase 5 functions.
-- Preserves existing companies, memberships, requests and invitation history.
begin;
create or replace function public.portal_reserve_invitation(p_client_id bigint, p_admin_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.portal_clients%rowtype; i public.portal_invitations%rowtype; mail text;
begin
  if not exists(select 1 from public.portal_members where id=p_admin_id and role='admin' and active)
    then raise exception 'admin_required'; end if;
  select * into c from public.portal_clients where id=p_client_id for update;
  if not found or c.status <> 'Active' then raise exception 'inactive_client'; end if;
  mail := lower(btrim(c.email));
  if mail is null or mail !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then raise exception 'invalid_email'; end if;
  perform pg_advisory_xact_lock(hashtextextended('altimin-invite:' || mail,0));
  if exists(select 1 from public.portal_members where client_id=p_client_id)
    then raise exception 'portal_user_exists'; end if;
  update public.portal_invitations set status='expired',updated_at=now()
    where lower(email)=mail and status='pending' and expires_at <= now();
  if exists(select 1 from public.portal_invitations where lower(email)=mail and status='pending')
    then raise exception 'pending_invitation'; end if;
  if exists(select 1 from public.portal_invitations
    where (lower(email)=mail and created_at > now()-interval '5 minutes')
       or (invited_by=p_admin_id and created_at > now()-interval '30 seconds'))
    then raise exception 'invite_cooldown'; end if;
  insert into public.portal_invitations(client_id,email,status,invited_by,expires_at)
    values(p_client_id,mail,'pending',p_admin_id,now()+interval '30 days') returning * into i;
  return jsonb_build_object('id',i.id,'email',i.email,'client_id',i.client_id);
end;
$$;

create or replace function public.portal_accept_invitation(
  p_invitation_id uuid, p_clerk_user_id text, p_client_id bigint, p_verified_emails text[]
) returns void language plpgsql security definer set search_path='' as $$
declare i public.portal_invitations%rowtype; m public.portal_members%rowtype;
begin
  if p_clerk_user_id is null or p_clerk_user_id not like 'user_%' then raise exception 'invalid_user'; end if;
  perform pg_advisory_xact_lock(hashtextextended('altimin-member:' || p_clerk_user_id,0));
  select * into i from public.portal_invitations where id=p_invitation_id for update;
  if not found or i.client_id <> p_client_id or
    not (lower(i.email)=any(coalesce(p_verified_emails,'{}'::text[])))
    then raise exception 'invitation_mismatch'; end if;
  select * into m from public.portal_members where clerk_user_id=p_clerk_user_id for update;
  if found and (m.role <> 'client' or m.client_id is distinct from p_client_id or not m.active)
    then raise exception 'membership_conflict'; end if;
  -- Duplicate delivery cannot re-enable a revoked/inactive membership.
  if i.status='accepted' then
    if i.accepted_clerk_user_id=p_clerk_user_id and m.id is not null then return; end if;
    raise exception 'invitation_already_claimed';
  end if;
  if i.status <> 'pending' or i.expires_at is null or i.expires_at <= now()
    then raise exception 'invitation_not_pending'; end if;
  if not exists(select 1 from public.portal_clients where id=p_client_id and status='Active')
    then raise exception 'inactive_client'; end if;
  if m.id is null then
    insert into public.portal_members(clerk_user_id,role,client_id,active)
      values(p_clerk_user_id,'client',p_client_id,true);
  end if;
  update public.portal_invitations set status='accepted',accepted_clerk_user_id=p_clerk_user_id,
    updated_at=now() where id=p_invitation_id;
end;
$$;
-- These SECURITY DEFINER functions are for verified Edge Functions ONLY.
revoke all on function public.portal_reserve_invitation(bigint,uuid) from public,anon,authenticated;
revoke all on function public.portal_accept_invitation(uuid,text,bigint,text[]) from public,anon,authenticated;
grant execute on function public.portal_reserve_invitation(bigint,uuid) to service_role;
grant execute on function public.portal_accept_invitation(uuid,text,bigint,text[]) to service_role;
commit;

