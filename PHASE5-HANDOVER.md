# Altimin Phase 5 — handover (7 October 2026)

## Result and limits
Implemented in the existing feature/supabase-clerk working tree, starting at f4603dd and preserving its unfinished P5_02 UI. Nothing committed, pushed, merged, deployed or reseeded. No invitations were sent.

The existing design, Clerk login form, Supabase reads/writes and admin preview remain. Added verified invite authorization, signed webhook provisioning, invitation acceptance with provisioning wait/retry, active-user invite status, membership-bound client selection, memory-only business data, project-path redirects and safe text rendering. Failed sign-out no longer pretends to succeed. Session changes clear the current page.

**Not yet a live-ready demo:** apply the additive migration, configure secrets, deploy functions and configure the Clerk webhook. Then complete the two-account live acceptance test below. Local tests do not establish email delivery or the live database's RLS behaviour.

## Files
- Updated: admin.html/js, dashboard.html/js, index.html, login.js, portal-api.js, portal-session.js, portal-store.js, connection-test.html.
- Added: portal-ui.js, accept-invitation.html/js; supabase/functions/_shared/security.ts and invited-user.ts; clerk-webhook/index.ts; hardened existing send-client-invite/index.ts; supabase/config.toml.
- Added: sql/ALTIMIN_P5_03_INVITATION_FUNCTIONS.sql, tests/security.test.ts, tests/browser.cjs, scripts/stage.cjs, scripts/serve.cjs, .github/workflows/staging.yml, .gitignore.
- Existing P5_02 verification SQL retained. No seed scripts.

## 1. Database
In Supabase SQL Editor run **sql/ALTIMIN_P5_03_INVITATION_FUNCTIONS.sql** in full.
This adds two service-role-only transactional functions; it does not recreate tables or reset records.
It expects the previously created portal_invitations schema described in your handover.
Do not rerun the old initial database/seed scripts.

## 2. Supabase secrets
Dashboard: project → Edge Functions → Secrets → add/save these names.
Enter secret values directly in that dashboard, never in chat, browser JS or Git.

| Name | Value/source |
|---|---|
| CLERK_SECRET_KEY | Altimin **Development** application's secret key from Clerk → API keys |
| CLERK_WEBHOOK_SIGNING_SECRET | Signing secret from the new Clerk webhook endpoint in step 4 |
| CLERK_ISSUER | https://inviting-molly-2739.clerk.accounts.dev |
| PORTAL_ALLOWED_ORIGINS | http://localhost:3000,https://gm012.github.io |
| PORTAL_INVITE_REDIRECT_URL | For local testing: http://localhost:3000/accept-invitation.html. Before remote invitations change to https://gm012.github.io/Altimin-Portal/accept-invitation.html |

SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are supplied automatically by hosted Supabase Edge Functions; do not copy the service key into frontend configuration.
No API keys or webhook secrets belong in GitHub Actions secrets for this static deployment.

## 3. Deploy the two functions
From the existing repository folder in PowerShell, after installing Node.js:

```powershell
npx --yes supabase login
npx --yes supabase functions deploy send-client-invite --project-ref gxekalufcgquneoabret --no-verify-jwt
npx --yes supabase functions deploy clerk-webhook --project-ref gxekalufcgquneoabret --no-verify-jwt
```

The flag disables Supabase's legacy gateway check, **not authentication**: the invite function verifies Clerk's signature, issuer, expiry and authorized origin itself; the webhook verifies its signing secret before touching the database. Do not deploy the previous decode-only invite function.

## 4. Clerk webhook and sign-up
Clerk Dashboard → Altimin Portal Demo → Development → Webhooks → Add endpoint:
- URL: https://gxekalufcgquneoabret.supabase.co/functions/v1/clerk-webhook
- Subscribe to **user.created** and **user.updated**.
- Copy its signing secret into CLERK_WEBHOOK_SIGNING_SECRET in Supabase, then save.
- Enable email/password sign-up in Clerk if not already enabled; users set their own password.
- Keep the existing Supabase integration activated in Clerk.
- Use distinct email addresses for Admin and Client. Existing admins are never converted to clients by an invitation.

The webhook checks signed metadata, verified invitation email, matching company, invitation validity and existing membership. Provisioning and marking the invitation accepted occur together. Duplicate deliveries are safe. Failed provisioning returns an error so Clerk can retry; inspect/replay failed deliveries from the Clerk Webhooks dashboard after fixing configuration.

Browser users with no membership receive a waiting/retry state, never automatic access.

## 5. URLs and project base path
Origins (no path): **http://localhost:3000** and **https://gm012.github.io**.
Use these wherever Clerk asks for allowed/authorized origins; don't enter /Altimin-Portal/ as an origin.

Full application URLs:
| Purpose | Local | Staging |
|---|---|---|
| Sign in / after sign out | http://localhost:3000/index.html | https://gm012.github.io/Altimin-Portal/index.html |
| Invitation/sign-up | http://localhost:3000/accept-invitation.html | https://gm012.github.io/Altimin-Portal/accept-invitation.html |
| Client | http://localhost:3000/dashboard.html | https://gm012.github.io/Altimin-Portal/dashboard.html |
| Admin | http://localhost:3000/admin.html | https://gm012.github.io/Altimin-Portal/admin.html |

If configuring Clerk's custom sign-in/sign-up paths, use the index and acceptance URLs above for the environment being tested. Our code explicitly supplies local-page redirect URLs; invitation redirect is controlled by the server secret. Clerk Development remains a test instance; production-domain migration is separate.

## 6. Local test
```powershell
node scripts/stage.cjs
node scripts/serve.cjs
```
Open **http://localhost:3000**. Keep the terminal running.
The staging script copies only browser files into _site, excluding functions, SQL, tests, .git and connection-test.html.
If _site already exists, rename that generated folder before running the staging script again.

1. Sign in with the existing admin. Check the existing data remains; create/edit one clearly labelled test client using an email you control.
2. Assign services and hard-refresh. Preview that client; the small ADMIN PREVIEW label should appear.
3. Save the client's correct email before sending. Click SEND PORTAL INVITE once; confirm the recipient in the existing confirmation dialog.
4. Check actual email delivery and the pending row in portal_invitations.
5. Open the email in a separate browser/profile. Create the client's own password in Clerk.
6. Verify the webhook delivery succeeds, portal_members maps that user to the intended client, and the invitation is accepted.
7. Client should see their Clerk name and company, not the company's contact as their personal identity.
8. Submit a service/hardware request. Admin approves it. Refresh the client page on the other device: Approved must appear.
9. Attempt admin.html as client; it must route back to dashboard. Change ?client= to another company: company selection must stay on the membership's company.
10. Verify actual Supabase RLS with a second client: reading another company's requests must return no rows, and inserting/updating against that company must fail. UI tests alone are insufficient.
11. Sign out and revisit protected pages. Check no account data remains in localStorage.
12. Test inactive membership, missing membership, wrong/expired invite and duplicate send. Do not reuse the admin account as the client.

## 7. GitHub Pages staging
Prepared for your requested project path; not published. GitHub Pages has commercial/SaaS and sensitive-transaction restrictions, so this is not a production hosting recommendation. Confirm hosting suitability before publishing; the same _site artifact can be hosted elsewhere.

1. Review the uncommitted changes. Commit/push **feature/supabase-clerk only when you decide to**; no merge to main is needed.
2. Repository Settings → Pages → Source: **GitHub Actions**. Check Pages is available for the repository's visibility/plan.
3. Settings → Environments → github-pages: allow deployment from feature/supabase-clerk if branch restrictions currently permit only main.
4. The manual workflow may not appear in Actions until it exists on the default branch. Since you requested no merge to main, dispatch via GitHub CLI after the branch is pushed:
```powershell
gh workflow run .github/workflows/staging.yml --repo gm012/Altimin-Portal --ref feature/supabase-clerk
```
If GitHub refuses because the workflow is absent from the default branch, that is a staging blocker: do not merge without approval. Use the workflow-file-only default-branch change with approval, or upload the generated _site artifact to another approved static host.
5. On success the expected URL is https://gm012.github.io/Altimin-Portal/.
6. Set PORTAL_INVITE_REDIRECT_URL to the staging acceptance URL **before** sending remote test invitations. Previously sent localhost invitations retain their old redirect; use fresh controlled test records/emails.
7. Repeat the admin/client test on separate devices. Confirm invite emails point to the staging path.

## Behaviour intentionally kept simple
- Refresh to see changes from another device; no claim of realtime updates.
- One portal membership per Clerk user. Existing membership/client conflicts require manual review.
- No resend/revoke UI in this pass. Pending invites block duplicate sends. Expired tracked invites can be replaced. Unknown Clerk delivery outcomes remain pending for administrator review rather than risking duplicate emails.
- Five-minute cooldown per email, thirty-second cooldown per inviting admin.
- If Clerk accepted an invitation but record finalisation failed, reconcile it with the Clerk dashboard and matching metadata; do not delete/reseed records or blindly resend.
- Existing live RLS and live table schema are not modified by this pass beyond the two added service-only functions.

## Verification
- Browser JavaScript syntax checks and git diff --check.
- Deno type checks of both Edge Functions.
- Four local security tests: metadata/verified email; genuine/tampered webhook signatures; JWT issuer/expiry/origin/signature; PostgreSQL-compatible transaction tests for idempotency, role conflict, company/email mismatch, expiry and service-only grants.
- Local Playwright check with explicit provider doubles: client routing/isolation, admin preview, escaped HTML, 390px layout, project-path sign-out and inactive/anonymous access.
- Not verified: live webhook, actual email delivery, real invitation/password completion, deployed Edge Functions, GitHub Pages or existing live RLS.

Re-run:
```powershell
npx --yes deno check supabase/functions/send-client-invite/index.ts supabase/functions/clerk-webhook/index.ts
npx --yes deno test --allow-env --allow-read --allow-net tests/security.test.ts
node --test tests/browser.cjs
git diff --check
git diff --stat
git status --short --branch
```
Browser tests use the bundled local Playwright path by default; set PLAYWRIGHT_MODULE to an installed Playwright module on another machine.

References: [Clerk webhook verification](https://clerk.com/docs/reference/backend/verify-webhook), [application invitations](https://clerk.com/docs/guides/users/inviting), [Supabase function configuration](https://supabase.com/docs/guides/functions/function-configuration), [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

