# Roadmap

## Lighthouse login (Nov 8, 2026)
- [ ] Create Stephen Taylor's Lighthouse-only client-admin account, verify action-item editing and Wheeler isolation, and send password setup instructions.

## Map alignment (Nov 8, 2026)
- [x] Keep saved aerial routes, personnel, and playback aligned across screen sizes; verified signed-in desktop/fullscreen playback and phone sizing; 3 tests pass, build OK.
- [x] Published map alignment correction; signed-in custom-domain aerial image and overlays verified at desktop/phone sizes, fullscreen, 1×/1.25×/2× zoom and ingress/egress playback, with no runtime errors.
- [ ] Verify saved aerial shuttle playback (no aerial shuttle routes exist in the current plan); Google Maps-dependent checks require user validation on the authorized domain.

- [x] Staff login: individual accounts for executives/consultants; own hours and assessments visible only to them
- [x] Account permission levels assignable by admin: full admin, add-notes/own-hours, read-only
- [x] Phone count entries feed Weekly summary + utilization trends automatically (live push + 30s refresh)

## Multi-client platform (Sep 16, 2026)
- [x] Organizations, memberships, audit log; Wheeler + Lighthouse seeded
- [x] All server functions scoped by client; storage paths per client
- [x] Client switcher (staff, admin, phone view), add-client wizard, client users, Kairos Portfolio
- [x] Verified: Wheeler records intact, Lighthouse workspace empty
- [ ] Re-enable device access codes before locked-down release (ACCESS_CODES_DISABLED = true)

## Lighthouse (Sep 19, 2026)
- [x] Police report tracker section (report number, status, follow-up notes, linked action item)
- [x] Publish live to commandhub.kairossecurity.com
- [x] Logged Sept 19 memo to Ivy McGregor: Kubota pricing, flatbed cart repair estimate, Parking Lot Ministry rebuild, Green Room / back-office access protocol + next-step action items

## Field Notes Assistant (Sep 23, 2026)
- [x] structureFieldNotes server function (AI gateway, structured output)
- [x] FieldNotesAI panel on the Executive Dashboard (speak/type → review → save)
- [x] Published live (commandhub.kairossecurity.com)

## Open question (Sep 23, 2026)
- [x] Answered: where to enter hours so they count as Total Recorded Hours on the Executive Dashboard
- [x] Logged 2h app-update time; dashboard shows 45.78 recorded hours; published

## Quick Hours Entry (Sep 23, 2026)
- [x] "Log Hours" form on Executive Dashboard (date, start/end or total hours, description, Time Status) → consulting_activities
- [ ] User enters Sunday 9/20 real hours via the new form (only they know the real times)
- [x] Per-person site assignment on the Admin page (one client per person, enforced server-side)
