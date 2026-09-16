# Kairos Command → Multi-Client Platform

Turn the current single-client app into a platform where Kairos manages many consulting clients, each in its own sealed workspace. Wheeler Avenue Baptist Church records stay exactly as they are and become the first client. The Lighthouse Church and Ministries is created as an empty workspace.

This is a large upgrade, so it is delivered in phases. Each phase leaves the app working.

## Phase 1 — Client foundation (additive, nothing removed)

- New client records store: organization name, client type, primary contact + title, email, phone, address/city/state/ZIP, website, project name, contract start/end, account status, internal Kairos notes, logo, and which modules are enabled.
- Client types: Church/Ministry, Corporate, School/University, Government, Residential Community, Event Venue, Healthcare, Nonprofit, Other. Status: Setup, Active, Paused, Completed, Archived.
- Membership: each person is linked to one or more clients with a role. Roles: Kairos Super Admin, Kairos Consultant, Client Admin, Client Leadership, Client Viewer, Field/Security User.
- Every operational record type (work activity, site visits, parking counts, milestones, action items, recommendations, progress notes, before/after, briefings, decisions, verification, lots, traffic plans, VIP guests/visits, documents, shared map state) gains a client link. Existing rows are all stamped to Wheeler — no content is touched, no IDs change.
- Isolation is enforced in the database itself (row-level rules keyed to client membership), not only in the screens. Kairos Super Admin sees everything; everyone else only their own client.
- An activity history records who changed what, in which client, with before/after status and time.

## Phase 2 — Client context in the app

- Header shows the current client at all times, including on phones: "KAIROS COMMAND — CLIENT: <NAME>" with the client logo where uploaded.
- Kairos admins get a client switcher (dropdown of clients + "Add New Client"). Switching reloads the whole workspace in that client's context.
- Client users skip the switcher entirely and land straight in their own workspace.
- Every create/edit form shows which client the record will be saved under.
- An empty workspace shows "No information has been entered for this client."

## Phase 3 — Add a client, without code changes

- Admin-only "+ Add New Client" opens a 6-step wizard: organization info → project/engagement → module selection → logo upload → invite client users → review & create. Finishes with "Client workspace successfully created." and an "Open Client Workspace" button.
- A short single-page form is also available for quick adds.
- Creating a client produces an empty workspace with the same module structure and no other client's data.
- Disabled modules are simply hidden for that client; nothing is removed globally.
- The Lighthouse Church and Ministries is created this way, blank.

## Phase 4 — Client users

- Admin section "Client Users" per client: name, email, role, status, last login, invitation status; buttons to invite, change role, disable access, resend invitation.
- Invitations always require email + client + role, and can only ever grant access to the client being viewed.

## Phase 5 — Dashboards and reporting per client

- Executive Dashboard cards calculate from the current client only: phase, status, latest assessment, open and critical action items, pending decisions, recommendations, site visits, consulting hours, latest progress update, upcoming milestones.
- Executive Reports and PDFs carry the client name, logo, project name, report period and Kairos Security branding. No cross-client mixing.
- New Kairos-only "Kairos Portfolio" dashboard: active clients, active engagements, assessments this month, open critical items, pending decisions, upcoming site visits, consulting hours this month, plus a client table (client, project, status, phase, last activity, open actions, critical items, next milestone) where a row opens that workspace. Client users can never reach it.
- Client search by organization, contact, project, status, with Active / Completed / Archived views. Archiving hides a client from the active list but preserves every record for Kairos admins.

## Phase 6 — Verification

Checks run before calling it done:
- Wheeler dashboards, assessments, parking data, maps, action items, reports and VIP records look identical to today.
- Lighthouse workspace is blank.
- A test record created under Lighthouse does not appear under Wheeler, and vice versa.
- A Wheeler client user cannot reach Lighthouse by navigation, link tampering or direct data requests, and vice versa.
- A third test client can be created with no code changes and starts blank; archiving it keeps its history for Kairos admins.

## Technical notes

- New tables: `organizations`, `organization_members`, plus an `audit_log`; `app_role` extended with the new roles (existing `admin`/`contributor`/`viewer` values are kept and mapped, so current sign-ins keep working).
- `organization_id uuid` added as a nullable column to every operational table, backfilled to the Wheeler organization, then set NOT NULL with a default resolved per request — additive only, no drops, no data rewrites.
- RLS on each table replaces the current service-only policies with membership-scoped policies plus a `is_kairos_super_admin()` security-definer bypass; server functions continue to run through the admin client but now always filter and stamp by the caller's active organization, resolved server-side from membership — never from client-supplied input.
- Active client is stored per user (server-side preference) and surfaced through a React context provider consumed by existing panels, so panel code changes stay minimal.
- Logos go to a new public storage bucket; client-facing PDFs read the logo from there.

## Out of scope for this pass

Notes on the current state, to confirm: the device access-code gate is still switched off from earlier work, and it should be turned back on as part of locking down a multi-client platform. Say the word and I will re-enable it.
