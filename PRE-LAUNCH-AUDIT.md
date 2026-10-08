# Altimin portal — pre-launch audit, 8 October 2026

Scope: existing `feature/supabase-clerk`, starting at `6b712b6` (portal/company link corrections). Preserved the design, framework, Clerk/Supabase architecture and server authorization. No commits, pushes, deployment, main-branch changes, database writes, reset, reseed or emails were performed.

## 1. Bugs found

Login footer positioning could overlap the Secure Access notice. The 500px client drawer combined a flexible paragraph with two competing buttons. Input value colour was inherited; the drawer close icon was white on a light background. The password-recovery control opened general sign-in rather than a dedicated reset flow. An admin service category was interpolated without HTML escaping. Client search searched HTML-escaped values. Service Details did nothing. Several empty admin lists were blank, dynamic labels were unbound, drawer focus could escape, closed mobile navigation remained keyboard-reachable, and forms used browser alerts.

Remaining concerns: updating client details and assigning services are separate writes and may partially succeed; an ambiguous network failure after a create may leave a saved record, so retrying can duplicate it. Double-click protection does not solve network-retry idempotency. Production RLS policies are not completely represented in this repository, so source inspection cannot certify all live row-level access.

## 2. Bugs fixed

Escaped service categories; corrected special-character search; connected service Details to an accessible details dialog; made dashboard navigation target a real section; linked the mobile admin logo to portal home. Added meaningful empty states, email input validation, trimmed required fields, field length limits, bounded whole-number request quantities and in-flight duplicate-submit prevention. Replaced browser alerts with visible status feedback and retained entered data after failed saves. Error copy warns about potentially partially saved records instead of promising nothing was saved. Removed routine login debug logging, retaining useful error diagnostics.

## 3. Cookie/privacy implementation

Shared `cookie-consent.js` / `.css` on all four application pages. Accept optional, Reject optional, Preferences, and Privacy Notice controls. Essential authentication always stays active. Analytics/marketing are disabled and explicitly not in use. Optional preference selection records a choice only; no trackers are installed or authorised for future use. Versioned local consent survives navigation; storage failures have a graceful fallback. Dialogs support native keyboard focus and Escape. The banner stays in document flow so it cannot cover controls.

The notice describes business data, Clerk, Supabase, GitHub Pages staging and Google Fonts. It requires Altimin to confirm retention periods and the privacy contact before production; it is not a legal-compliance certification.

## 4. Forgot-password status

Implemented a dedicated email → Clerk reset code → new password flow using the same Clerk JS API family already used by this portal. Credentials are not persisted. Invalid codes and network errors remain in the form; successful completion clears password fields and returns to sign-in. Additional security steps are handed to Clerk's maintained UI with project-relative redirects.

Locally tested with explicit provider doubles: send-code parameters, incorrect code, successful reset and return to sign-in. Real email delivery, expired code, MFA/device-trust recovery and production Clerk settings must be checked with a controlled live account. Reference: https://clerk.com/docs/guides/development/custom-flows/authentication/legacy/forgot-password

## 5. Broken/dead links and remaining search matches

No missing local `src`/`href` assets in the browser HTML scan. No `altimin.com` matches. Portal logo/home links stay within `index.html`; company links use `https://altiminlimited.com`. Project routing was tested under `/Altimin-Portal/`.

Remaining PROTOTYPE: `data.js`, unused historical fixture, not loaded by application pages and excluded from staging. The stale portal.css comment and login selector were renamed. Remaining localhost: development server, invitation server's explicit local redirect allowance, PHASE5-HANDOVER instructions, and local test harness URLs; none forces staging users to localhost. Console logging remains in the developer-only connection diagnostic, excluded from staging, and local build/server scripts. The API's existing aggregate-count diagnostic is retained; error logs remain for troubleshooting. No browser `alert()` remains in the shipped application. `placeholder` attributes are legitimate field hints; test doubles and example records are confined to tests/unused data.js. No TODO/FIXME/javascript:void findings requiring a code fix.

## 6. Authentication/security

Preserved verified Clerk sessions, membership-bound client IDs, server-only invitation creation, signed webhook verification and service-only provisioning functions. No RLS or server checks were weakened. Business records stay in memory, not localStorage. Added safe reauthentication on browser-history restoration. Closed drawers/navigation are inert; account/session-change routing and real sign-out remain intact.

No secret-key/database-credential literal pattern was found in the current source scan. Publishable browser keys and server environment-variable names are expected. This was not a historical Git secret audit.

Live, read-only anonymous probes to portal_clients, portal_members, portal_services, portal_hardware, portal_requests and portal_invitations all returned HTTP 401 / PostgreSQL 42501 (access denied). No business rows were retrieved. This does not prove authenticated cross-company isolation; that requires two real client accounts and review/export of deployed policies.

## 7. Visual/CSS issues found and fixed

Login footer now follows the form in normal flow with at least 36px separation. Account Management has a full-width paragraph followed by stacked invite/preview actions, suitable for the actual drawer width at every viewport. Saved values use dark #172b4d on white; placeholders, labels and disabled/read-only values are separately styled. Fixed close-icon contrast, long-name wrapping, focus indicators, scrollable tables, reduced motion and accessible drawer focus/return/Escape. Admin preview label now sits in normal flow instead of covering mobile controls.

Rendered Chrome at 1920×1080, 1366×768, 768×1024 and 390×844. Captured and inspected the login, invitation shell, admin, dashboard, client/service/request drawers, consent dialog and reset dialog. Real Google fonts were permitted in the final visual run; auth/database used synthetic fixtures. The deliberately unusual company name in screenshots tests HTML escaping and long-content layout. Assertions verify no document horizontal overflow, footer separation, readable description width, dark entered-value colour and label associations. Tables scroll internally on small screens; drawers scroll to lower fields. Actual hosted Clerk invitation-widget states require a live valid/expired invitation and were not visually certified by these fixtures.

Evidence: `audit-evidence/`, 36 PNG screenshots, plus static and anonymous-access JSON. Screenshots are ignored by Git and excluded from staging.

## 8. Files changed

Existing: `.gitignore`, `index.html`, `accept-invitation.html`, `admin.html`, `dashboard.html`, `admin.js`, `dashboard.js`, `login.js`, `login.css`, `portal.css`, `portal-api.js`, `portal-ui.js`, `scripts/stage.cjs`.

New: `cookie-consent.js`, `cookie-consent.css`, `password-reset.js`, `portal-polish.css`, `tests/audit.cjs`, `tests/visual.cjs`, this report.

Existing Edge Functions/SQL/session/store files were reviewed, not rewritten. The browser-only `_site` build was refreshed locally; prior generated build was preserved under Documents/Codex/2026-09-21/referenced-chatgpt-conversation-this-is-an/work/altimin-preaudit-site-20261008 if it existed.

## 9. Validation and manual configuration

PASS: all root browser JavaScript syntax checks; Deno checks for both Edge Functions; all four existing security tests (signed webhook, JWT, metadata and transactional provisioning); existing browser suite; new audit suite; visual viewport suite; `git diff --check`; allowlisted local staging build. Browser suites cover client/admin routing, query/cache tampering, preview, inactive access, sign-out, simulated expiry, XSS fixtures, consent persistence/rejection, reset, form bounds, network failure and duplicate clicks. These are local tests, not live integration certification.

No new secrets or database migration are required for this patch. Keep existing Clerk email/password settings and server configuration. Verify password reset with a controlled real account after an authorised staging update. Verify staging redirect origins remain correct. Production requires live Clerk keys/domain configuration and approved privacy/business retention details. Keep this private portal noindex; public marketing-site indexing guidance does not apply.

## 10. BLOCKER BEFORE REMOTE TESTING

The corrected code is local and has deliberately not been pushed/deployed. Remote staging still needs an authorised publication of these files, including the new shared assets. No local test/build failures remain. Use a controlled test account and inbox to verify reset delivery; do not substitute a mocked success for that check.

## 11. IMPORTANT BEFORE PRODUCTION

- Verify actual authenticated RLS with two client companies and an admin, including direct API attempts, inactive membership/company, writes and account switching. Preserve/export deployed policies into the repository for repeatable review.
- Verify live valid/expired/already-used invitations, provisioning, password recovery/MFA and sign-out after this change. Earlier live success reported by the user is respected but was not rerun here.
- Make client-update plus service-assignment atomic, and make create retries idempotent before relying on unattended production use; current UI prevents concurrent double-clicks and warns about uncertain outcomes.
- Confirm Clerk production credentials/domain, hosting suitability, security headers, recovery/backups, support ownership and privacy retention/contact content.
- Review remaining small/light secondary text against the agreed accessibility target. Focused form/close-control contrast is fixed; this is not a full WCAG certification.

## 12. NICE TO HAVE LATER

Admin resend/revoke invitation workflow; account/profile settings; fuller admin audit history; optional request-status notifications; realtime refresh. None was added speculatively.

## 13. git diff --stat

See exact output below. Git diff statistics cover tracked files only; new files appear in status until staged.

## 14. git status

Exact short status below. Branch remains feature/supabase-clerk. Nothing staged, committed, pushed or deployed by this audit.
```text
 .gitignore             |   2 +
 accept-invitation.html |   3 ++
 admin.html             |   9 ++--
 admin.js               |  91 +++++++++++++++++++------------------
 dashboard.html         |  11 +++--
 dashboard.js           |  10 ++---
 index.html             |   8 +++-
 login.css              |   8 ++--
 login.js               | 120 -------------------------------------------------
 portal-api.js          |   3 ++
 portal-ui.js           |  71 +++++++++++++++++++++++++++++
 portal.css             |   2 +-
 scripts/stage.cjs      |   2 +-
 13 files changed, 156 insertions(+), 184 deletions(-)
 M .gitignore
 M accept-invitation.html
 M admin.html
 M admin.js
 M dashboard.html
 M dashboard.js
 M index.html
 M login.css
 M login.js
 M portal-api.js
 M portal-ui.js
 M portal.css
 M scripts/stage.cjs
?? PRE-LAUNCH-AUDIT.md
?? cookie-consent.css
?? cookie-consent.js
?? password-reset.js
?? portal-polish.css
?? tests/audit.cjs
?? tests/visual.cjs
```
