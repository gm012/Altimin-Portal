import { PGlite } from "npm:@electric-sql/pglite@0.5.8";
import { verifyWebhook } from "npm:@clerk/backend@3.23.0/webhooks";
import { generateKeyPair, exportJWK, SignJWT } from "npm:jose@6.2.12";
import { invitedUser } from "../supabase/functions/_shared/invited-user.ts";
import { verifiedSubject } from "../supabase/functions/_shared/security.ts";

function assert(ok: unknown, message = "Assertion failed"): asserts ok { if (!ok) throw new Error(message); }
async function rejects(fn:()=>Promise<unknown>) {
  let failed=false; try { await fn(); } catch { failed=true; } assert(failed,"Expected rejection");
}
Deno.test("Invitation metadata requires client role, valid link and verified email", () => {
  const u = { id:"user_A",public_metadata:{altimin_role:"client",altimin_client_id:7,
    altimin_invitation_id:"11111111-1111-4111-8111-111111111111"},
    email_addresses:[{email_address:"a@example.com",verification:{status:"verified"}}]};
  assert(invitedUser(u)?.p_client_id===7);
  assert(!invitedUser({...u,public_metadata:{...u.public_metadata,altimin_role:"admin"}}));
  assert(!invitedUser({...u,email_addresses:[]}));
  assert(!invitedUser({...u,public_metadata:{...u.public_metadata,altimin_client_id:"garbage"}}));
});
Deno.test("Clerk signed webhook accepts authentic body and rejects tampering", async () => {
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const base64 = (a:Uint8Array) => btoa(String.fromCharCode(...a));
  const signingSecret="whsec_"+base64(secret);
  const body=JSON.stringify({type:"user.created",data:{id:"user_A"}});
  const id="msg_test", timestamp=String(Math.floor(Date.now()/1000));
  const key=await crypto.subtle.importKey("raw",secret,{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=base64(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(id+"."+timestamp+"."+body))));
  const request=(text:string) => new Request("https://test.invalid/hook",{method:"POST",body:text,
    headers:{"svix-id":id,"svix-timestamp":timestamp,"svix-signature":"v1,"+signature}});
  const event=await verifyWebhook(request(body),{signingSecret});
  assert(event.type==="user.created");
  await rejects(()=>verifyWebhook(request(body+" "),{signingSecret}));
  await rejects(()=>verifyWebhook(new Request("https://test.invalid",{method:"POST",body}),{signingSecret}));
});
Deno.test("Invite caller JWT checks signature, issuer, expiry and authorized origin", async () => {
  Deno.env.set("CLERK_ISSUER","https://test.clerk.accounts.dev");
  Deno.env.set("PORTAL_ALLOWED_ORIGINS","http://localhost:3000");
  const {privateKey,publicKey}=await generateKeyPair("RS256");
  const jwk={...await exportJWK(publicKey),kid:"test-key",alg:"RS256",use:"sig"};
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({keys:[jwk]}),{headers:{"content-type":"application/json"}});
  try {
    const token=async(issuer="https://test.clerk.accounts.dev",azp="http://localhost:3000",exp="5m") =>
      await new SignJWT({azp}).setProtectedHeader({alg:"RS256",kid:"test-key"}).setSubject("user_A")
        .setIssuer(issuer).setIssuedAt().setExpirationTime(exp).sign(privateKey);
    const req=(t:string)=>new Request("http://localhost",{headers:{authorization:"Bearer "+t}});
    assert(await verifiedSubject(req(await token()))==="user_A");
    await rejects(async()=>verifiedSubject(req(await token("https://wrong.example"))));
    await rejects(async()=>verifiedSubject(req(await token(undefined,"https://evil.example"))));
    await rejects(async()=>verifiedSubject(req(await token(undefined,undefined,"-10m"))));
    await rejects(()=>verifiedSubject(req("eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyX0EifQ.")));
  } finally { globalThis.fetch=originalFetch; }
});
Deno.test("Provisioning is atomic, idempotent, service-only and protects existing members", async () => {
  const db=new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table portal_clients(id bigint primary key,email text,status text);
      create table portal_members(id uuid primary key default gen_random_uuid(),clerk_user_id text unique,
        role text,client_id bigint,active boolean);
      create table portal_invitations(id uuid primary key default gen_random_uuid(),client_id bigint,email text,
        clerk_invitation_id text,status text,invited_by uuid,accepted_clerk_user_id text,
        expires_at timestamptz,created_at timestamptz default now(),updated_at timestamptz default now());
      insert into portal_clients values(7,'client@example.com','Active'),(8,'other@example.com','Active');
      insert into portal_members(clerk_user_id,role,active) values('user_admin','admin',true);
    `);
    await db.exec(await Deno.readTextFile(new URL("../sql/ALTIMIN_P5_03_INVITATION_FUNCTIONS.sql",import.meta.url)));
    const admin=(await db.query<{id:string}>("select id from portal_members where clerk_user_id='user_admin'")).rows[0].id;
    const reserved=(await db.query<{i:{id:string}}>("select portal_reserve_invitation(7,$1) as i",[admin])).rows[0].i;
    await rejects(()=>db.query("select portal_reserve_invitation(7,$1)",[admin]));
    const accept=(user:string,client=7,email="client@example.com") =>
      db.query("select portal_accept_invitation($1,$2,$3,$4)",[reserved.id,user,client,[email]]);
    await rejects(()=>accept("user_admin")); // must never demote the admin
    await rejects(()=>accept("user_client",8));
    await rejects(()=>accept("user_client",7,"wrong@example.com"));
    await accept("user_client"); await accept("user_client");
    const rows=(await db.query<{role:string;client_id:number}>("select role,client_id from portal_members where clerk_user_id='user_client'")).rows;
    assert(rows.length===1 && rows[0].role==="client" && rows[0].client_id===7);
    await rejects(()=>accept("user_other")); // same invitation cannot be reused by another subject
    await db.exec("update portal_members set active=false where clerk_user_id='user_client'");
    await rejects(()=>accept("user_client"));
    const grants=(await db.query<{allowed:boolean}>(`select has_function_privilege('authenticated',
      'portal_accept_invitation(uuid,text,bigint,text[])','EXECUTE') as allowed`)).rows;
    assert(grants[0].allowed===false);
    const accepted=(await db.query<{status:string}>("select status from portal_invitations where id=$1",[reserved.id])).rows[0];
    assert(accepted.status==="accepted");
    await db.exec("insert into portal_invitations(client_id,email,status,expires_at) values(8,'other@example.com','pending',now()-interval '1 day')");
    const expired=(await db.query<{id:string}>("select id from portal_invitations where client_id=8")).rows[0].id;
    await rejects(()=>db.query("select portal_accept_invitation($1,'user_expired',8,array['other@example.com'])",[expired]));
  } finally { await db.close(); }
});

