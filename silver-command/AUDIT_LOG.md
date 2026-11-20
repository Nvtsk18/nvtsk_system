# NVTSK Silver Command 0.4 · audit and risk register

**2026-11-20, initial review.** An entry is marked PASS only after implementation and a reproducible test. A design decision is not proof of implementation. Nightly automated iterations should append new checks and verified outcomes without deleting known problems.

## First pass: 20 independent checks / risks

| # | Viewpoint | Scenario and invariant | Current state | Priority |
|---|---|---|---|---|
| 01 | New user | Registration asks only for «Ваше имя» and contact; never a global customer/installer role | SPECIFIED | P1 |
| 02 | Customer | Lot author is customer only in that lot, not all jobs | SPECIFIED | P0 |
| 03 | Installer | Awarded/invited member is performer in scoped lot | SPECIFIED | P0 |
| 04 | Customer + installer | Same person can serve different roles in different lots | SPECIFIED | P0 |
| 05 | Contractor | Cannot bid on own lot or approve own work | NOT IMPLEMENTED | P0 |
| 06 | AC specialist | Qualification is verified independently, not asserted by a profile | NOT IMPLEMENTED | P0 |
| 07 | Crew captain | Delegation and admin permissions don't expose other members' finances | NOT IMPLEMENTED | P0 |
| 08 | Customer | Project → four phase lots → arbitrary nested sublots preserves scope | SPECIFIED | P1 |
| 09 | Project manager | Child budgets and parent total reconcile, detect overruns | NOT IMPLEMENTED | P1 |
| 10 | Installer | Before/after evidence, linked PDF pages and corrections survive reload | NOT IMPLEMENTED | P0 |
| 11 | Safety officer | Scaffold/RSS, roof hazard and cable/earth checks documented | SPECIFIED | P0 |
| 12 | Client + contractor | PDF plan revisions invalidate stale approvals with audit | NOT IMPLEMENTED | P0 |
| 13 | Project team | Lot feed, posts, comments, file/video and scoped chat visibility | NOT IMPLEMENTED | P1 |
| 14 | Member | Phone, WhatsApp link, notifications, opt-in location, privacy | NOT IMPLEMENTED | P1 |
| 15 | Newcomer + mentor | Bond freeze/release, no fake mentoring rewards | NOT IMPLEMENTED | P0 |
| 16 | Finance | Real money, Merit, Legacy, tax and invoices remain separate | SPECIFIED | P0 |
| 17 | Dispute mediator | Evidence freeze, appeal, reversal, reviewer conflict controls | NOT IMPLEMENTED | P0 |
| 18 | Driver/installer | Navigation uses grounded address; offline capture/queue/retry | NOT IMPLEMENTED | P1 |
| 19 | Security | Role-based access, backups, GDPR, audit, anti-fraud, moderation | NOT IMPLEMENTED | P0 |
| 20 | iPhone field user | 5-tab responsive navigation, legible silver glass cards, no JS blank screen | NOT IMPLEMENTED | P1 |

## Important contradictions to resolve
1. **«Создал лот = заказчик» is a presentation-level rule.** Actual legal contracting customer may be a verified organisation represented by the creator. Track both.
2. **«Фото закрывает этап» vs «заказчик принимает».** An uploaded after photo marks *submitted for review*, not *accepted*; a separate reviewer authorises acceptance.
3. **«Legacy earned» vs «Merit deposit x2».** Only independently verified work may increase Legacy; an x2 MentorGate incentive should concern a bounded reward under anti-fraud and accounting rules, not Legacy itself.
4. **«Merit never leaves the system so no tax» is false as a categorical rule.** Taxation, payment-services status and employment law depend on economic substance, not just cash-out.
5. **«Every member has full project finance history» vs member privacy.** Display only own account, assigned amounts and authorised organisation reports.
6. **«Any member can invite» vs controlled access.** Proposal threshold/terms for inviter; require explicit newcomer consent and membership approval where needed.
7. **«Lowest bid» vs verified quality selection.** Show price, skill, documented performance, risk, availability and assumptions with transparent customer discretion.
8. **«Offline workflow» vs browser-only localStorage.** Production requires offline queue, deduplication, sync conflict resolution, file retention and server acknowledgements.
9. **«Public GitHub demos» vs client PDF/address privacy.** Use fictional/anonymised data only. Never commit source files with personal addresses or owner names.
10. **«Anmeldung and AC are just another task» vs regulated work.** Restrict work assignment and acceptance to legally authorised professionals and organisations; confirm German requirements with qualified advisors.

## Overnight review protocol
For each iteration log:
- Timestamp and GitHub commit(s)
- Which distinct stakeholder roles were simulated
- Specific change and why it was prioritised
- Test evidence, PASS/FAIL, syntax and regressions
- New risks and next action
- Whether behaviour is local demonstration only or actually multi-user/backend

Only count a review toward the user's requested ≥20 when it was a **separate, documented check**; do not fabricate PASS states or claim a night of continuous background execution. Scheduled tasks may run independently according to platform capabilities, but only their actual logged outputs count.

## Implementation pass #1 · 2026-11-20 evening

**Repository:** `Nvtsk18/nvtsk_system`, branch `main`, isolated path `silver-command/` only.
**Committed:** `SYSTEM_SPEC.md`, `GAP_ANALYSIS.md`, `README.md`, `style.css`, `index.html`, `app.js`.
**Design:** mobile five-tab navigation, silver translucent layered panels with no-JS visible fallback.
**Functionality:** local lot creation, per-lot customer role, four derived sublots, sample external bid and independent executor assignment. No server.

**Smoke tests (test harness, not physical iPhone): 7/7 passed**
1. Navigation / dashboard UI renders.
2. New lot is attributed to current creator (= customer).
3. Four distinct child lots generated with parent linkage.
4. Creator bid on own lot rejected.
5. Creator self-assignment as installer rejected.
6. Appointment as worker on another party's lot works.
7. Demo bid on external lot remains in local state.

**Known limitations:** use of sample organisation names is explicitly marked demo; no real company membership. No actual uploaded photos or PDFs, no secure storage, no authenticated server chat or stage acceptance. No verified electronic qualifications. UI has not been manually tested in Safari on a real iPhone. Public GitHub Pages availability of the new subdirectory has not been independently confirmed. These remain **open**, not PASS.

**Immediate next pass priorities:** persistent project storage and schema validation, user-scoped authentication/permission model, media/evidence lifecycle, social feed and comment model, secure backend plan, controlled MentorGate ledger events. Recheck no-JS iOS fallback in physical Safari.


## Implementation pass #2 · 2026-11-20 23:00 CET

**Commit:** `91ff0c483d9d87575e10af1159c796265978c196` (only `silver-command/app.js`). No edits to 0.3 root.

**Prioritised fixes (4):**
1. Validate local saved state: schema shape, lot IDs, references, cyclic parent graphs and finite non-negative prices. Reject corrupt saves and initialise safe demo defaults with a visible warning.
2. Enforce author-scoped lot mutation for assignment and splitting. An outsider cannot assign an executor or create derived sublots for a third party's lot in the local demo.
3. Block demo AC and Anmeldung assignment until an independent qualification/authorisation mechanism exists. Prevent assigned worker from placing another bid on the same lot.
4. Add user-triggered JSON backup export, explicit localStorage failure warning and bounded local audit events for create, split, bid, assign and profile edit.

**Three perspectives and conflicts reviewed:**
- Customer vs unauthorised outsider: assigning someone to a lot created by `demo-client` must be refused. **Code-path guard added.**
- DC installer vs AC specialist: an unverified user may not be assigned regulated AC or Anmeldung work. **Guard added; real verification remains absent.**
- Project owner vs self-interested bidder: author cannot bid own lot; appointed executor cannot rebid after appointment. **Guards present.**
- Device owner vs storage failure: localStorage exception must not silently masquerade as persistence. **Warning and JSON export implemented.**

**Verification:** 8 static source invariant assertions PASS after transformation (schema validation, cycle check, scoped assignment, AC gate, storage warning, backup export, bid conflict, audit event). These are **static source assertions**, NOT browser tests, syntax parser execution or end-to-end proof. GitHub update returned a commit SHA. Actual Safari/iPhone behavior and corrupted-storage recovery remain unverified. No backend/authentication; client-side checks are bypassable and must not be treated as security controls.

**Open problems:** no authenticated organisations, server-side permission checks, stage evidence workflow, chat/social network, immutable audit, independent acceptance, financial ledger, cloud backup or regulated electrical authorisation. Prototype export includes demo data only; must not be used for sensitive production records.

**Next:** add testable pure domain model for stage lifecycle and independent acceptance; introduce local posts/comments with visibility semantics clearly marked demo; design server authorization before any real users.
