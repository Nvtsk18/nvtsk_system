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


## Implementation pass #3 · 2026-11-21 ~00:00 CET

**Scope:** only `silver-command/stage-domain.js`, `silver-command/stage-domain.test.js` and this log. No root 0.3 files changed.
**Commits:** domain `b0e81d08`, tests `0f51fbf6`, test syntax correction `26ea2b33`.

**Four priorities:**
1. A pure local-domain model for evidence stages with explicit `draft → submitted → returned/accepted` transitions.
2. Before + after evidence requirements and optional PDF page reference, tied to a positive integer Stringplan/plan revision. Metadata references only; **no actual image or PDF upload yet**.
3. Independent review guards: stage owner cannot accept own work; only the lot's customer may accept/return in this local model; return requires a reason; accepted stage is locked.
4. Revision invalidation and traceability: newer plan revisions invalidate older evidence; append local action history. This is **not immutable server audit**.

**Stakeholder conflict review:** DC installer tries to submit without AFTER evidence; customer tries to upload evidence for installer; installer tries to self-approve; unrelated user tries to accept; customer returns without explanation; project planner updates the Stringplan after photos were captured. Guards implemented and exercised.

**Verification:** `node --check stage-domain.js`, `node --check stage-domain.test.js`, `node stage-domain.test.js` locally: **15/15 PASS** for pure domain invariants. Test source was committed and a transcription syntax error in the first GitHub test commit was corrected in `26ea2b33`. These are unit tests of the isolated domain logic, **not** browser tests of the deployed GitHub version. No Safari test, no server security test, no media storage test. The domain module is not yet wired into the existing application UI.

**Risks:** Stage state is currently mutable local JS and cannot establish real-world independent identity, verified AC permissions, authentic capture metadata, or legal acceptance. On accepted stages, a correction must be opened as a separate stage/change order, not mutate signed-off evidence. Stage evidence IDs must be unique across server storage in production, not merely within one local stage.

**Next:** integrate stage lifecycle into the lot screen with a safe demo role switcher and durable storage; add a test for reload and corrupted stage state; then add a scoped social feed with visibility semantics. Do not claim actual uploaded media or production approvals.


## Implementation pass #4 · 2026-11-21 ~01:00 CET

**Scope:** `silver-command/app.js`, `silver-command/index.html` and this audit log. No root 0.3 changes.
**Code commits:** `2776867120749a893337d3a8ce452725c44c55a2`, `989c04f6da88c1ea8101fb63430a0b1f06d9ff74`, `cbceb4755e0d0cb7366f354a0b897129264effd9`.

**Priorities implemented (4):**
1. Load the isolated `stage-domain.js` module before `app.js` so stage operations are available to the actual lot UI.
2. Add a stage section to each lot: create stage, add before/after metadata and optional PDF page, submit, return with reason or accept. **No actual image/PDF upload.**
3. Persist stage objects in the same local demo state, validate stage shape and lot reference on reload, cap stage count/evidence/history, and include stage records in the existing user-triggered JSON export.
4. Add an explicitly labeled local actor switcher to simulate separate customer and installer interactions, without pretending to authenticate identities.

**Stakeholders / conflict checks:**
- **Customer vs DC installer:** author of own lot assigns a separate executor; stage owner adds before+after metadata; customer reviews after submission. Pure domain enforces reviewer distinct from owner. **Code path connected, browser run not verified.**
- **Installer vs outsider:** wrong actor cannot append stage evidence or submit it; owner check in stage-domain. **Domain invariant from previous unit tests, new UI not end-to-end tested.**
- **Customer vs self-approval:** if stage owner equals lot creator, stage creation is refused; stage-domain also blocks self-review. **Code path present; identity switcher can be spoofed and is strictly demo.**
- **Planner vs old Stringplan:** stage-domain rejects old-revision evidence; revision UI is not yet wired. **Partial.**

**Verification:** GitHub returned commit SHAs for all three code changes. Static source checks confirmed stage module import and action dispatch. Attempted live download of GitHub raw source for Node syntax/unit tests; runtime network DNS failed (`Could not resolve host: raw.githubusercontent.com`). **Do not count this as a passed syntax or browser test.** Previous isolated domain tests 15/15 were performed in pass #3, not rerun in this pass. Safari/iPhone and persistence across reload are still unverified. The UI uses browser prompts and is a provisional field interface.

**Critical remaining risks:** no server-side permissions or authentication; demo actor switcher is not a security boundary; no actual media bytes, independent qualification, shared chat or immutable evidence. Stage schema validation is permissive for nested history contents, and invalid stored stage records are dropped without per-record recovery. UI must gain version-change controls, a formal actor/organisation permission model and automated integration tests before a real pilot. Never store real customer data in this demo.

**Next:** implement a structured scoped social feed (local-only), clarify visibility defaults and add automated tests for cross-lot access; then improve evidence metadata persistence/revision controls and test mobile Safari.
