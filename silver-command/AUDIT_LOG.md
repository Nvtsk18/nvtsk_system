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


## Implementation pass #5 · 2026-11-21 ~02:00 CET

**Scope:** only `silver-command/social-domain.js`, `social-domain.test.js`, `index.html`, `app.js`, and this log. Root 0.3 remains unchanged.
**Code commits:** `53ca5116`, `58ba2410`, `080a6d3a`, `47d6f521`.

**Priorities (4):**
1. Introduce a separate pure local social-domain model: membership, lot-scoped post creation, comment creation and schema validation.
2. Add a concrete local feed and comments UI to each lot, using the existing demo actor switcher and HTML-escaping all displayed user text.
3. Persist bounded social data in the local demo state and user-triggered JSON backup; validate and filter post records on reload.
4. Add 14 explicit Node unit test cases for outsider/cross-lot denial, membership, empty input, invalid visibility, comments and basic schema.

**Role and conflict analysis:** customer/creator can post on own lot; appointed DC installer can post and comment; invited captain/member can comment; unrelated outsider cannot post or comment; someone who belongs to a different lot cannot read or comment on this one. Local UI shows only posts passing the same membership filter. Cross-lot post reuse is denied by post.lotId equality. Tests are committed but NOT executed in this run.

**Verification:** re-fetched all four code files from GitHub after commits. **10/10 static source/integration assertions PASS**, covering script order, post initialisation, reload validation, render wiring, event dispatch, outsider guards, cross-lot guard and test file presence. This is source inspection, **not syntax execution, browser testing or proof of security**. No Node runtime test executed in this run; 14/14 is NOT claimed.

**Critical limitations and findings:** all data remains in browser localStorage, and actor identity can be changed in the UI. No authentication, server ACL, encrypted media, cross-device chat, moderation, blocking, notification delivery or GDPR-grade deletion. In fact, `posts` are stored in one local state object and filtered for display only: this is NOT secure isolation for actual users. Post bodies are plain text only, no photo/video uploads. Local data loss is still possible; backup export is manual. No real client data should be entered. The app still contains UI placeholder text about upcoming photo workflow that should be updated. Revisit duplicate IDs and robust nested comment validation in a later pass.

**Next pass:** run actual syntax and unit tests in a Node-capable runtime, improve corrupted state recovery and saved-state regression tests, then design authenticated server-side ACL for social content before any real-user deployment. Extend the independent audit to moderation/appeals, data retention and crew offboarding.


## Implementation pass #6 · 2026-11-21 ~03:00 CET

**Scope:** only `silver-command/social-domain.js`, `social-domain.test.js`, `app.js` and this log. No root 0.3 files modified.

**Code commits:** `87c75314` (social guards and validation), `ed50e75a` (regression tests), `66a64f57` (saved-post ID deduplication).

**Priorities (3):**
1. Correct a **real role-conflict bug**: `member(lot, undefined)` could return true when `lot.assignee` was missing; likewise null/empty actors could accidentally match absent fields. Now only nonempty string actors can be lot members. This affects local social creation and read filters, not server security.
2. Reject malformed persisted posts/comments: blank IDs, blank bodies, duplicate comment IDs, invalid visibility. This reduces corruption and ambiguous identities on local reload.
3. Drop duplicate post IDs when normalizing saved browser state, retaining the first valid record to avoid ambiguous comment targets. Bounded history and local JSON export remain.

**Stakeholders and three conflict scenarios:**
- **Uninvited outsider** with an absent identity vs **customer** of a lot whose assignee is missing: formerly an accidental match was possible; now refused.
- **DC installer/captain** vs **other project customer**: cross-lot read/comment still checks both membership and exact lot ID; previously implemented guard retained.
- **Moderator / reviewer** inspecting malformed or duplicated social data: duplicate comment IDs and blank author/body now fail validation, and duplicate post IDs are removed on restore.

**Verification:** executed a JavaScript V8 harness in the connected tool runtime with the actual updated social-domain source: **20/20 assertions PASS**, including 14 prior behavior scenarios and six new edge cases. The harness parsed and executed the updated domain module, but is **not** Node CLI, an end-to-end browser test or proof of persistent storage. The six new regression tests were committed to `social-domain.test.js`. Static inspection confirms the app normalizer uses a Set to filter duplicate post IDs. Attempted to fetch GitHub raw source in container for Node CLI; DNS resolution failed (`Could not resolve host: raw.githubusercontent.com`), so no Node CLI or browser run is claimed.

**Open limitations:** saved posts still reside in one localStorage object and are not cryptographically isolated. The demo actor switcher is impersonation by design. There is no authenticated server, ACL, moderation backend, real-time messaging, photo bytes, GDPR workflow or guaranteed data recovery. Invalid social records are silently dropped rather than individually recoverable; further work should expose recovery warnings and export the original corrupt state before reset. Duplicate lot and stage IDs need a broader integrity test. UI rendering and persistence across reload remain unverified on iPhone/Safari.

**Next:** test saved-state recovery with a reproducible DOM harness; implement an explicit warning when records are dropped; review stage-owner/creator conflict under role switching; then design authenticated social moderation and message retention.


## Implementation pass #7 · 2026-11-21 ~04:00 CET

**Scope:** `silver-command/app.js` and this log only. Root 0.3 unchanged.
**Code commit:** `5a3dd9dd046430103011fd8e8d3b01e529648e71`.

**Priorities (3):**
1. Strengthen restored photo-stage records: unique nonblank stage IDs, unique nonblank evidence IDs, nonempty owner, no stage owner equal to lot creator, and accepted reviewer must equal lot creator and differ from stage owner. This catches malformed or self-approved persisted stage metadata before display.
2. Make dropped/limited saved posts and stages visible in the dashboard via explicit warnings, instead of silently discarding them.
3. Add a user-triggered **raw local-data recovery export** to the warning panel. Before overwriting the current stored record on a later save, attempt to retain the original in sessionStorage for the current tab. This is a best-effort recovery aid, not a reliable backup or a guarantee that corrupted state survives device/browser failure.

**Stakeholders and conflict scenarios:** customer attempts to restore an independently 'accepted' stage with themselves as stage owner; DC installer supplies duplicated evidence IDs to confuse audit; outsider inserts a stage with no owner or invalid reference. These records are now rejected by the local restore filter. Customer/project manager sees warnings and can export raw local state before further edits. A separate, authorised AC specialist still cannot be genuinely verified in this local prototype.

**Verification:** re-fetched `app.js` after GitHub commit. JavaScript `new Function(source)` parse **PASS** in V8; **9/9 static source assertions PASS** (stage duplicate guard, reviewer conflict, owner conflict, evidence dedup, social drop count, recovery warning and raw export). Attempted a mock-DOM execution harness for persistence and rendering; the harness failed with `ReferenceError: console is not defined` before any assertions could be established. **0/4 DOM integration scenarios verified**; do not count these as app failures or as passed tests. No real browser, localStorage reload, iPhone Safari, media upload, server permissions or cloud backup verified.

**Important remaining limitations:** browser storage is untrusted and can be altered; raw recovery export is not encrypted and may contain sensitive data if users disregard the demo warning. A sessionStorage backup may fail on quota, private browsing or crash, and a malformed record may already be lost from earlier runs. Stage validation still does not verify complete history authenticity or cryptographic evidence. Do not put real customer data into this public demo. The next pass should use a working browser/DOM harness and add a safe import-and-restore flow with preview and validation, plus explicit offboarding and organisation-scoped permissions.


## Implementation pass #8 · 2026-11-21 ~05:00 CET

**Scope:** `silver-command/app.js` and this audit log only. Root 0.3 untouched.
**Code commit:** `b29e2e940159eed866e0bc0d2f97255d03c28d5e`.

**Priorities implemented (3):**
1. Added a manual JSON restore path in Profile: paste an exported backup, enforce 1.5 MB input bound, require schema version 2 and required data sections, normalize lot references and stage/social records, reject any recovery warnings, show counts and request explicit confirmation before replacing local demo state.
2. Added a fail-closed recovery lock for malformed original JSON or unavailable localStorage on initial load. Ordinary actions no longer silently overwrite the unreadable original. Export of original raw data remains available in the warning panel. A successful validated import can release the lock.
3. Preserved existing safeguards against duplicate IDs, self-approval of stages and cross-lot social posts in the normalizer. Did not rewrite domain modules.

**Three stakeholder views and conflicting cases:**
- **Project customer** restores a stale or corrupt backup: invalid schema, missing sections or dangling lot parent must be rejected before overwriting current data.
- **DC installer** restores stages that appear self-approved by the same person who performed the work: stage validator rejects them rather than treating them as accepted.
- **Crew captain / outsider** attempts to restore posts with invalid lot reference or duplicate IDs: normalization drops these records; import rejects the entire backup if any record was dropped.
- **Administrator / operator** considers a corrupted startup record: new recoveryLock prevents automatic overwrite by subsequent ordinary UI actions; original raw export is best-effort only.

**Verification:** re-fetched actual committed `app.js`, `stage-domain.js`, and `social-domain.js` through GitHub connector. JavaScript `new Function(source)` parse **PASS 3/3**. Static integration assertions **PASS 8/8** for import UI, schema check, confirmation, normalizer, recovery lock, export, reviewer constraint and post dedup. These are syntax/static checks, **not** an executed import workflow, DOM persistence test, Node CLI or physical Safari test. No live client data used.

**Newly noticed caveats / next pass:** the import JSON input limit is a UI and code bound, not a secure server limit. Imported data is untrusted local demo data and cannot establish identity or acceptance. The current normalizer still accepts some malformed nested fields in lots, bids, crew and audit; its whitelist/schema validation needs strengthening. The recovery lock covers parse failures, but partially valid data with filtered records can still be saved after a best-effort sessionStorage backup. Improve the workflow with a real executable DOM integration harness, negative-case tests for partial data, and a mandatory full export before any destructive restore. Manual backup import has no encryption or cloud recovery and should never be used for real customer records.

**Remaining product gaps:** no backend, authenticated role enforcement, verified qualification, actual photo uploads, real-time messaging, money transfers, regulated Merit, privacy-compliant retention, legally binding acceptance or reliable cross-device sync.


## Implementation pass #9 · 2026-11-21 (scheduled follow-up)

**Scope:** only `silver-command/stage-domain.js` and this audit. Root 0.3 unchanged. **Code commit:** `87b72a51c39c308d73d791e919ab471383eb815b`.

**MVP-first priority:** harden restored stage metadata rather than expand social features. `validStage` now rejects blank stage/lot/owner identifiers, duplicate or blank evidence IDs, blank notes, invalid PDF page references, future plan revisions, excessive evidence/history arrays, malformed history entries, and accepted stages whose reviewer is missing or equals the performer. This is local-data integrity validation, not authenticated acceptance.

**Roles and conflict cases:** (1) customer attempts to import an accepted stage with no independent reviewer; (2) DC installer tries to insert duplicate evidence IDs or future-revision evidence; (3) crew captain imports a stage with missing owner or malformed PDF page. The corresponding domain checks now reject these states. The independently reviewed customer/installer happy path remains accepted.

**Verification:** actual fetched module compiled with JavaScript `new Function` in the tool V8 runtime. **8/8 executable domain assertions PASS**: fresh stage, blank owner, duplicate evidence, invalid PDF page, self-review, future revision, independent review, accepted-stage immutability. This is not a DOM, localStorage reload, Node CLI or iPhone Safari test. No private customer data was used.

**Open issues:** browser UI still lacks executable import/reload regression tests. History entries are mutable and not cryptographically authenticated; current check validates types only. `validStage` is not a full strict schema for every nested field, and localStorage actor switching is spoofable. Need to verify all existing stage tests against the stricter validator in Node; no claim that the full suite passed. Before real deployments, implement server-side roles, verified qualifications and protected evidence storage. The primary target remains a stable browser MVP, with social extensions deferred.


## Implementation pass #10 · 2026-11-21 (MVP-first follow-up)

**Scope:** `silver-command/stage-domain.js`, `stage-domain.test.js`, this audit only. Root 0.3 unchanged. Commits: `0648ebc1`, `4eb8d164`, `5ad2a8d5` (test repair).

**Three priorities:** (1) fail closed when restored `submitted` or `accepted` stages lack current-revision before/after evidence; (2) normalize duplicate evidence ID comparison with trim so whitespace cannot bypass it; (3) prohibit an unrelated actor from revising a stage plan in the pure local demo domain. Previously the revision helper accepted any actor. The revision helper now permits the stage owner; future product work should explicitly model separate authorized planning specialists and approval of revisions instead of relying on client-supplied actor strings.

**Three roles / conflict scenarios:** customer attempts to restore accepted status with stale/missing evidence (rejected); DC installer attempts duplicate photo reference IDs with whitespace (rejected); outsider or intermediary tries to increment plan revision without being stage owner (rejected). Positive cases include installer submission, independent customer review, and owner plan revision. The local UI actor switch remains spoofable; this is not secure access control.

**Verification:** fetched committed domain and test sources back from GitHub. V8 `new Function` syntax parse passed for both after repairing pre-existing malformed test closures. Executed the committed test script in a V8 harness with Node assert-compatible shims: **20/20 tests PASS**. This is an executable domain test, **not** the Node CLI test runner, actual DOM test, localStorage reload, iPhone Safari or end-to-end integration. No private data used.

**Remaining:** persisted state can still be manually tampered with; no backend ACL, real media evidence, qualified AC sign-off, authenticated revision authority, guaranteed recovery, GDPR compliance, or real payments. Critical next milestone: executable browser persistence/import/reload tests and mobile navigation validation. Defer new social features until MVP workflow passes.


## Implementation pass #11 · 2026-11-21 (Local First / Command + Field)
**Scope:** `silver-command/app.js`, `style.css`, and this audit only. Root 0.3 unchanged. Code commits: `c58cd145b58ae9675ffb5807f54019a69242207e`, `120f22141487f5cc736e393614c0ce72740dc8a4`.

**Three priorities implemented:**
1. Added **Project Pulse** to project cards and lot workspace. It counts only independently accepted local demo stages, not submitted work or physical percentage installed. The status includes pending review and returned-for-correction warnings. Accessible progressbar and responsive industrial/silver styling.
2. Fixed stage creation privilege: previously a customer could create a stage in their lot and assign ownership to the executor without being that executor. Now only the **assigned, independent performer** can create a stage through the demo UI and action guard. The reviewer remains the creator under the existing demo model.
3. Replaced obsolete checklist copy claiming photo stages were still future functionality; explicitly states that evidence consists of **descriptions/references, not uploaded photo/PDF bytes**. Reject nonfinite/oversized demo bids.

**Roles and conflicts checked:** customer vs DC installer: creator cannot impersonate the assignee to create stage using their own demo actor; assigned installer may create stage; unrelated outsider cannot create it. AC/Anmeldung remain blocked from unverified assignment. Reviewer acceptance is deliberately excluded from Project Pulse until stage status is `accepted`. Caveat: demo actor switcher is spoofable and is not authentication.

**Verification:** re-fetched committed `app.js` and `style.css`. V8 JavaScript syntax parse PASS; 9/9 targeted checks PASS, including four executable pure pulse cases (empty, accepted+submitted, returned, cross-lot isolation) and five static source/style invariants. These are **not** full browser tests, iPhone Safari, DOM click tests, localStorage reload or import end-to-end tests. No private client data used.

**Open blockers:** highest priority remains a real browser DOM persistence/import/reload harness and a tested iPhone field workflow. UI has only text evidence references, no photo upload, PDF viewer integration or real financial ledger. Demo identity and acceptance are not secure. Future: explicit Command/Field navigation, safety checklists and reliable offline backups; keep social/network work deferred until browser MVP passes.


## Implementation pass #12 · 2026-11-21 (Local First restore integrity)

**Scope:** only `silver-command/app.js` and this audit. Root 0.3 untouched. Code commit: `50d78c9e738a91b4fa46044166f3f08a9f4bd61a`.

**Three critical fixes:** (1) validate nonblank lot IDs, titles, creators, and assignees on local state restore, rejecting self-assignment; (2) validate members for duplicate/blank identities and bids for finite positive bounded amounts, nonblank team and correct optional `mine` type, preventing corrupt imports from becoming UI state; (3) restore imported data with a **single localStorage write** and include the import audit record in that same write, rather than writing restored state and immediately saving again. Require `crew` array in import backup.

**Roles and three conflicting scenarios:** customer tries to import a lot with themselves as assigned performer (rejected); DC captain imports duplicated member identities (rejected); outsider/intermediary imports NaN/Infinity or negative bid (rejected). Valid independent assignee and ordinary finite bid remain allowed. These are local integrity guards, not authenticated permissions.

**Verification:** fetched actual committed app source; JavaScript V8 `new Function` syntax **PASS**. Extracted the committed `validLot` predicate and executed **9/9 cases PASS** (valid baseline, blank ID, self-assignment, duplicate members, invalid bid, valid bid, blank title, blank member, negative bid). Recovery-lock source check PASS. Inspected the exact committed import-success block: **one localStorage.setItem**, no subsequent save. An initial broad static test incorrectly included unrelated later handlers and reported false failure; corrected the inspection to the exact import block. **No real browser, Safari, DOM event, reload, or storage-quota simulation was executed.**

**Open blockers:** import still asks confirmation but not mandatory prior export; localStorage can be tampered with; malformed top-level crew/audit sections are only partially normalized; initial seed lot has legacy bid shape but passes current schema; actual mobile Field Mode and end-to-end persistence remain untested. Next: create an executable DOM/storage harness or real browser smoke test, then mobile Field Mode navigation. No backend, authenticated role checks, real photo bytes, qualified AC acceptance, GDPR compliance or real payment.


## Implementation pass #13 · 2026-11-21 · NVTSK Garage local demo

**Scope:** only silver-command/GARAGE_SPEC.md, garage.js, app.js, index.html, style.css, AUDIT_LOG.md. Root 0.3 untouched. Commits: spec `d1b765fc`, module `e5df5dcb`, integration `b8126661`, `2b74c8ea`, `f1c57d00`.

**Implemented:** Garage tab in app navigation, shared internal stock pool (depot + three vans), physical location breakdown, external contractor custody (Fremdlager), typed receive/transfer/consume form, confirmed project consumption ledger (demo cost), journal, localStorage persistence with schema checks and fail-closed startup lock. Internal and external transfers do not post project consumption. All material values are demo only. No real company/contractor authentication or actual Bautagebuch integration.

**Executable V8 tests (6/6 PASS):** syntax and initialization; 40 hooks garage→van; 34 installed leaving 6 and posting €119 once; transfer 7 rejected when only 6 available; 6 handed to external custody; custody transfer does not double-post usage. Three actor/conflict perspectives: garage captain sees pooled stock; field installer cannot consume more than held; external contractor custody is separately visible without ownership transfer. **Role enforcement itself remains unimplemented**, so these are accounting invariants, not permission tests.

**Critical limitations:** no actual browser DOM click/reload or iPhone Safari test; independent localStorage key means Garage is not yet part of the existing main JSON export/import and could be lost when users assume backup includes it; no backend, QR scanning, contractor acknowledgement, immutable ledger, concurrency protection, verified ownership, price accounting method or signed handoffs. The external custodian is a single demo placeholder, not a per-contractor registry. Quantity model supports integer base units only. The cost ledger is local demonstration, not integrated into project finances. Avoid real client/private records.

**Next:** integrate Garage backup into main export/import or provide separate explicit export with warnings, test real DOM/storage/reload, add per-contractor custodian IDs, enforce actual actor permissions and integrate project Bautagebuch.


## Implementation pass #14 · 2026-11-21

Scope: silver-command/garage.js only, root 0.3 unchanged. Code commit: f3192477d20ee7432bb08ae9447a3e0c33ce3f77.

Added separate Garage JSON export, validated preview/import, explicit confirmation and single-write restore. Garage and project backups remain separate; both must be saved. Invalid backup type/schema is rejected and corrupted startup storage remains locked.

V8 mock-storage tests: 9/9 PASS, covering syntax, garage-to-van transfer, 34/40 installation with 6 remaining and EUR119 cost, overdraft rejection, external custody, non-mutating preview, invalid backup rejection, reload by module reinitialization, and restore. No real browser, DOM, iPhone Safari or actual file download test was run.

Role/conflict scenarios: operator can export; installer cannot consume beyond stock; external custodian holdings do not count as garage available; importer cannot inject invalid backup. These are local accounting rules, NOT authenticated role enforcement.

Open: no cross-key atomic backup, no Bautagebuch integration, no project-ID validation, no authenticated roles or cross-device sync. Next: real browser persistence tests and project-linked consumption.


## Implementation pass #15 · 2026-11-21 · Project-linked Garage usage

**Scope:** silver-command/garage.js and app.js, plus audit. Root 0.3 unchanged. Code commits: `4d0c5650440a320b4409fd325e4768f29ab46668`, `2c837595be104857a0d91c7e4e20ce3898ea2b3c`.

**Critical improvements:** (1) Garage consumption UI now uses actual project/sublot IDs from the app rather than free-text project names; new consumption rejects unknown IDs. (2) Lot workspace displays the sum of Garage consumption costs for that exact lot, excluding transfers and other lots. (3) Read-only usageForProject isolates per-lot entries and the project provider follows updated local state. Old backup usage entries with free-text project names remain in history but may not match lot IDs.

**Executable V8 tests: 9/9 PASS:** project dropdown, invalid project rejection, transfer not expense, installer consumes 34 hooks for EUR119, unrelated lot cost isolation, overdraft rejection, external transfer not expense, storage reload by reinitializing module, validated backup preview. Both changed files parsed in V8. Three role/conflict perspectives: DC installer cannot post against unknown project or exceed van stock; customer sees only costs on their selected lot; external contractor custody does not post as consumed. **No authenticated role restrictions**: the client-side operator can still submit consumption for any lot. No browser DOM or iPhone Safari test. Storage remains two independent keys, so cross-key consistency/backup is not guaranteed. No real Bautagebuch, real prices, document uploads or financial accounting.

**Next:** enforce local demo actor/lot assignment checks in inventory consumption, make project-linked usage resilient to project deletion/import and add actual browser DOM reload tests. Do not treat demo actor switching as real authorization.


## Implementation pass #16 · 2026-11-21 · Garage import integrity

**Scope:** only `silver-command/garage.js` and this audit. Root 0.3 untouched. Code commit: `f8e455fe653537291284f4ae3a18a98e4488b2a0`.

**Critical fixes:** (1) reject duplicate or missing usage records for consumption movements, preventing double charges or orphaned consumption; (2) reject altered quantity/cost and consumption linked to a transfer; (3) validate movement endpoints and reject malformed/duplicate movement IDs during restore/import. Existing valid local data remains compatible.

**Executable V8 checks: 12/12 PASS**: syntax, valid transfer/consumption, seven negative corruption scenarios (duplicate usage, missing usage, forged cost, wrong quantity, usage linked to transfer, malformed movement endpoint, duplicate movement), module reinitialization using persisted localStorage mock, backup preview and invalid backup rejection. First test harness failed because `structuredClone` was not available in tool V8; reran with JSON clone and all 12 passed. This is NOT real DOM, iPhone Safari, browser storage-quota or cross-device testing.

**Three roles/conflicts:** (1) DC installer cannot import a doubled consumption entry; (2) customer cannot forge a lower cost or wrong installed quantity in imported usage; (3) external contractor/custodian cannot relabel a transfer as consumption without corresponding consistent ledger. These are integrity checks only, not authenticated role enforcement; client-side actor switching and direct JS calls remain spoofable.

**Limitations and next:** separate project/Garage storage keys; no atomic combined backup, no authenticated roles, no server ledger or tamper-proof history. A fully internally consistent fabricated backup cannot be detected cryptographically. Actual browser click/reload tests and mobile Field Mode remain highest priority. Project-linked expense is demo-only, no accounting or Bautagebuch posting.


## Implementation pass #17 · 2026-11-21 · Garage local actor/lot guard

**Scope:** only silver-command/garage.js, app.js and AUDIT_LOG.md. Root 0.3 unchanged. Code commits: `26e0359586b3a00dcdb2f9be2e1de8af903c03d7`, `4e8e8888b21ccfa1c05317a96edf00616b24bd7e`.

**Changes:** Garage consumption now checks the *current lot's* assignee, creator and kind against the current demo actor at the transaction boundary. Only the assigned independent performer of DC or Projektierung may confirm consumption in the local demo. AC/Anmeldung consumption blocked pending real qualification verification. The app passes live lot metadata and demo actor through provider functions rather than capturing stale data. Receipt and custody transfers remain local demo actions without role authorization.

**Verification:** fetched committed code back. V8 new Function syntax PASS 2/2; executable assertions PASS 9/9: assigned installer DC allowed; customer attempting installer consumption rejected; outsider rejected; AC consumption rejected; self-assignment rejected; reinitialization from persisted mock storage retains usage; valid backup preview; invalid backup rejected; app-to-Garage provider wiring present. No actual DOM click, real Safari/iPhone, physical file import, storage quota or concurrency test. The mock actor is freely switchable and localStorage editable: **not secure authentication**.

**Conflicts:** customer cannot consume installer stock while selected as customer; unrelated outsider cannot consume; AC installer cannot claim qualified AC material posting. These are local UI/domain checks only. **Next:** integrate per-lot Field Mode workflow, real browser DOM smoke testing, Garage/project combined backup, and explicit garage admin permissions for receipt/transfer. No private client data used.


## Implementation pass #18 · 2026-11-21 · Garage ledger/balance consistency

**Scope:** silver-command/garage.js and AUDIT_LOG.md only; root 0.3 unchanged. Code commit: `f246b21c9bffda801729d0faabc81ac33d59b9a3`.

**Critical fix:** validate Garage imported/persisted balance totals by replaying each movement in order from the known local demo opening stock. Reject a forged balance, a movement overdraft, and balance/movement divergence, including attempted alteration of quantities in prior movements. Existing demo records from the original seed remain compatible. Receipt/transfer/consumption now undergo the same replay validation before persistence. No real inventory ownership verification or cryptographic audit.

**Executable JS V8 checks:** syntax PASS; 12/12 assertions PASS: transfer, consumption cost, insufficient stock, three demo actor scenarios (customer, outsider, AC performer), valid history, forged balance, forged movement quantity, backup preview, corrupted backup rejection, and module reload from mock localStorage. The three actor checks are NOT secure authentication. No real browser DOM/Safari test; no actual download/import through UI was tested.

**Known issues:** opening stock is hardcoded to original demo seed; real inventory onboarding requires versioned opening snapshots and signed adjustments. Project and Garage backups remain separate. Garage local actor is spoofable; receipt and transfer lack garage captain/admin authorization. No backend, true Bautagebuch, or real accounting. Next: mobile Field Mode end-to-end, combined backup or explicit paired backup safety, and browser tests.


## Implementation pass #19 · 2026-11-21 ~16:00 CET · Stage scope and backup clarity

**Scope:** only `silver-command/app.js` and this audit. Root 0.3 untouched. Code commit: `345fc80bbcd4f9672e0f010f8ed343ea3db19701`.

**Three targeted fixes:** (1) block stage creation for AC/Anmeldung even when a forged or legacy saved lot has an assignee; UI hides the creation control for regulated lots; (2) restrict demo actor dropdown to four known local identities, rejecting arbitrary actor strings; (3) explicitly label main JSON export/import as **projects only**, and warn that Garage requires a separate export/import. This does not solve cross-key atomicity.

**Role/conflict review:** DC installer assigned to DC can still reach the stage creation path; AC/Anmeldung assignee cannot create a new stage even if an imported record contains that assignee; outsider injecting an unknown actor via select change is refused; customer restoring only project JSON is warned that Garage stock is not restored. These are client-side demonstrations, not identity security.

**Verification:** fetched committed app source; V8 `new Function` syntax PASS, four targeted source assertions PASS (stage action guard, UI guard, actor allowlist, backup warning). No DOM click, real Safari/iPhone, reload or import end-to-end test. Existing stage records on regulated lots are not automatically removed, and the app remains locally spoofable.

**Open:** real browser persistence/import/reload test; atomic paired backup for project+Garage; stage validation against lot kind on restore; Field Mode usability; secure server ACL and actual media storage. No production claims.


## Implementation pass #20 · 2026-11-21 ~17:05 CET · Restore stage ownership

**Scope:** silver-command/app.js and AUDIT_LOG.md only; root 0.3 unchanged. Code commit: `aafd8ac7c696c4158e5f40443ffb534afd647cde`.

**Critical restore checks:** reject persisted stage metadata on AC/Anmeldung lots (previously blocked only for new stage creation); reject stages whose owner differs from the lot's currently assigned performer. This closes a path where imported legacy/forged stage data could appear under an unqualified or unassigned actor. Previously accepted independent-review guard remains.

**Three actor/conflict scenarios (source-path review, not executed):** DC assignee's matching stage remains eligible for further validation; unrelated outsider's stage owner is rejected; AC/Anmeldung performer stage is rejected even if assigned. A customer trying to be both stage owner and reviewer remains blocked by earlier guard. Changes were made against the fetched current file and the GitHub write returned a commit SHA. **No executable syntax test, actual browser test, import/reload test or iPhone Safari test in this pass.** Do not claim these scenarios PASS until executed.

**Risk:** restoring an older stage with an owner no longer assigned now drops that record and emits the existing recovery warning; raw-data export should be used before any subsequent save. This is deliberate fail-closed behavior but lacks an explicit historical reassignment workflow. Demo actors remain spoofable and this is not authenticated access control.

**Next:** implement executable import/reload integration harness and historical stage reassignment/revision rules; prioritise Field Mode and paired Garage/project backups. Defer network/Merit/social expansion.


## Implementation pass #21 · 2026-11-21 ~18:05 CET · Fail-closed collection restore

**Scope:** silver-command/app.js and AUDIT_LOG.md only. Root 0.3 untouched. Code commit: `8e532d069f0638fbff37ef428c593d51164883af`.

**Fixes:** (1) reject backups/persisted states missing required stages/posts/crew/audit arrays instead of silently treating them as empty; (2) reject malformed, duplicate or oversized crew identities; (3) reject malformed or excessive audit entries. This reduces accidental data loss and corrupt-state acceptance on import/reload. The existing recovery lock preserves the original localStorage entry on failed startup normalization.

**Three role/conflict source scenarios:** DC assignee's existing stage must still match its lot; outsider cannot substitute as stage owner; AC/Anmeldung stage remains rejected. The new collection guards are actor-independent and do not provide authentication. Static invariants inspected: owner/assignee comparison, regulated-lot guard, crew uniqueness and required arrays. GitHub update succeeded; **no executable JS parser, DOM, browser reload, actual import or iPhone Safari test was run in this pass**. Do not claim test PASS.

**Compatibility warning:** older backups lacking any of the four collection arrays now fail closed rather than migrate. User should export raw backup before replacing any damaged state. Next: versioned migration and real browser import/reload test; combined project+Garage backup; iPhone Field Mode. No backend, verified identity, actual media storage or production accounting.


## Implementation pass #22 · 2026-11-21 ~19:00 CET · Garage demo operator boundary

Scope: silver-command/garage.js and AUDIT_LOG.md only; root 0.3 untouched.

Changes: local demo receipt and transfer operations now require the selected demo-client actor, while assigned DC/PLAN performers retain consumption rights. Receipt form requires its unused source selector to be set to depot to avoid misleading direction input. These are UI/demo guards, not secure authentication; switching actors or editing local JS remains possible.

Verification: JS parsed with V8 new Function before commit. Source assertions confirm receipt/transfer guard and consume guard coexist. Three actor/conflict cases by static inspection: assigned DC installer may consume but not transfer; unrelated outsider cannot receive; demo-client can receive/transfer but cannot consume without assignment. No actual DOM, browser storage/reload, iPhone Safari, or import test in this pass. The source field on receipt remains a placeholder, not a real supplier identifier.

Next: execute browser DOM + import/reload integration harness, paired project/Garage backup, mobile Field Mode, and real warehouse-role model. No backend, payments or verified identities.


## Implementation pass #23 · 2026-11-21 ~20:00 CET · Garage malformed-item recovery

**Scope:** only `silver-command/garage.js` and this audit; root 0.3 untouched. Code commit: `ea65079e838a55e346e5585222752aa43e008dcd`.

**Critical changes:** (1) reject null/missing item IDs before the duplicate-ID Set/map step, avoiding a TypeError during restore; (2) reject item IDs containing `@`, which is reserved for the `item@location` inventory balance key and could otherwise create ambiguous keys. Existing valid sample data remains compatible. These guards apply to saved-state initialization, import preview, and transactions through `validate`.

**Executable V8 checks: 11/11 PASS:** JS syntax, valid opening stock, null item, missing ID, reserved separator, duplicate item, forged balance, customer transfer, outsider transfer refusal, assigned DC consumption, and customer consumption refusal. Tests used a mocked localStorage and document; **not a real DOM/browser/iPhone Safari run**. Role switching remains a demo and cannot establish actual security.

**Three roles/conflicts:** demo-client can transfer but not consume DC material; outsider cannot transfer; assigned DC installer can consume their assigned DC lot. These checks were executed in the V8 mock harness, not via actual UI clicks.

**Remaining:** combined project/Garage backup, real browser import/reload and mobile Field Mode; current backup is split across two localStorage keys. No backend, authentication, genuine payments, or production ledger. Next pass should prioritise an executable browser harness and safe paired backup rather than more social/Merit functionality.


## Implementation pass #24 · 2026-11-21 ~21:00 CET · Garage operator identity mismatch

**Scope:** only silver-command/app.js, garage-actor.test.js and AUDIT_LOG.md; root 0.3 untouched.
**Code commits:** `62f8582aa075bbfbd6b7370b931a693d51c88e37`, `26edcb30762799b64dfe606c0a8993f1099e75c1`.

**Bug fixed:** Garage receipt/transfer required `demo-client`, but the application's actor switcher only provided `me`, `roman`, `denis`, `olena`. Consequently the warehouse operator could never submit a receipt or transfer through the integrated UI. The actor provider now maps only `me` to the Garage demo operator `demo-client`; other actors retain their IDs. This is local-demo compatibility mapping, not authentication.

**Three-role conflict cases:** project owner `me` can act as Garage operator but cannot consume DC stock as an assigned installer; `roman` stays distinct and may consume only when assigned to an eligible DC/PLAN lot, not receive/transfer; `denis` unassigned cannot receive/transfer or consume. AC/REG remains blocked by the existing Garage guard.

**Verification:** GitHub writes returned commit SHAs. New source-linked Node regression test committed with seven assertions, but **the committed test was not executed** against fetched repository files in this pass. A local syntax check of an equivalent test draft succeeded; attempted local execution failed because the repository app.js/garage.js files were not present in that container, not because an assertion failed. No integrated browser click, import/reload, iPhone Safari, or end-to-end security test. Do not count the seven assertions as passed.

**Remaining:** execute committed test in a checkout, run real browser persistence/import/reload test, implement safe paired project/Garage backup, and improve Field Mode on iPhone. Demo role switching is spoofable; no backend or secure access control. No client records committed.


## Implementation pass #25 · 2026-11-21 ~21:00 CET · Deferred Merit contract

**Scope:** silver-command/MERIT_FUTURE_SPEC.md and AUDIT_LOG.md only; root 0.3 unchanged. Spec commit: `14589fd613c7a48c3a59ef36c44537cb5b98cb4e`.

**Delivered:** documented Case-only issuance (1000 Case Merit for €1000 Case), separately classified unresolved founder +10, zero Shard issuance, 250 existing Merit reserved by €250 Shard, supply/availability invariants, idempotency, cancellation and restore checks. Documented 100% fee earmarking without 80/20 split, and explicit conflicting Shard fee statements (earlier 1.2%, latest 2%) and fee-base uncertainty. **No fee logic or token logic enabled in MVP.**

**Verification:** specification arithmetic reviewed: 1000-250=750, 250+800>1000; 1.2% of 250=3 and 2% of 250=5 are *illustrative only*, not live charges. No JS application code changed in this pass, therefore no new executable syntax, role, conflict, browser, iPhone, import/reload tests were run. Previously committed garage-actor.test.js still needs execution against checked-out sources. No claims of verified functionality.

**Next:** prioritize a paired Case/Shard/Garage backup with rollback and migration, run actual JS tests against repo checkout, exercise three actors and three hostile restore/role scenarios in browser, then iPhone Field Mode. Founder +10 cadence and fee base/rate conflict require explicit product decision before implementation. No private records published.


## Implementation pass #26 · 2026-11-21 22:00 CET · Correct deferred Merit contract

**Scope:** silver-command/MERIT_FUTURE_SPEC.md and AUDIT_LOG.md only. Root 0.3 unchanged. Spec commit: `dd7b4314dfd49b3f9889e4177b6f167ebef623cb`.

**Critical correction:** prior pass #25 incorrectly asserted that Shards reserve existing Case Merit and that Shard fee was 2%. The user's latest explicit instruction supersedes both: Case €1000 issues 1010 new Merit (including 10 founder Merit), Shard €250 issues 250 **additional new** Merit; Case fee €10 (1%), Shard creator fee €3 (1.2%); resulting issuance 1260 Merit, fees €13; 100% earmarked for backing, no 80/20 split. Updated the future specification and its example scenarios, retaining unresolved recipient/issuance-cap/cancellation/legal questions rather than guessing.

**Verification:** arithmetic manually rechecked: 1000+10+250=1260; 1000×0.01=10; 250×0.012=3; 10+3=13. GitHub returned the spec commit SHA. **No application JS changed; no syntax, three-role execution, import/reload or browser/iPhone test was performed this pass.** The old #25 audit is intentionally retained as history, not as current requirements.

**Critical open items for next run:** unified Case/Shard/Garage backup and rollback, browser integration tests, project-only horizontal swipe navigation and top-of-screen screen replacement. Existing MVP remains local demo with spoofable actors; no production-ready claim.


## Implementation pass · 2026-11-21 23:00 CET

**Scope:** silver-command/app.js only; root 0.3 unchanged. Commits: `e290656a9edf79b902653a5d2e0cff340234753e` and syntax correction `0dea2c5fc0032eeb1ca94ce833801d3e4d8c8004`.

**Implemented:** Project workspace now renders one selected screen rather than stacking overview, stages, feed and sublots. Four project page buttons; swipe right advances and swipe left goes back, scoped only to the open project. 75px horizontal threshold and 1.7x direction ratio reduce conflicts with vertical scroll; interactive form elements excluded. Each page transition resets scroll to top. Main navigation remains button-based.

**Verification:** JavaScript parsed successfully using Function constructor on the complete updated app.js source after correction. First commit had a syntax error and was promptly fixed in second commit. No actual browser, iPhone Safari, reload, history or end-to-end testing performed in this pass. Static source presence checks only; do not mark touch behaviour PASS. Browser back/forward history and Garage unified backup remain open, as do secure roles and cross-component tests. Existing per-project stage, social and assignment code reused, not revalidated at runtime.

**Next:** browser smoke test of all four screens, role conflicts, stage submission/acceptance, persistence and touch gestures. Add history support and one atomic Case/Shard/Garage export/import without data loss. Verify that Garage state is included before claiming complete backup.


## Implementation pass · 2026-11-22 00:00 CET · browser history
- **Code commit:** `895b1f2778213e12c3e41ba0e3a01c1e152c63ff` (only `silver-command/app.js`).
- **Change:** route URL now captures top-level tab or `#lot/<lotId>/<projectPage>`; screen and selected project/page are restored on hashchange/popstate, while internal navigation pushes history entries. Every route render scrolls to the top. Existing right-swipe-forward and left-swipe-backward rules remain unchanged and only apply within the open project.
- **Stakeholder/conflict review:** customer opening a project sublot, installer using project pages, outsider opening a nonexistent/deleted lot route. The route parser checks that the lot exists and page index is in bounds; invalid routes fall back to dashboard. **Static source review only.**
- **Verification:** GitHub update succeeded and two static source assertions confirmed route helper and popstate listener. **No Node syntax execution, actual browser click-through, iPhone Safari test, persistence/reload test or 3-role runtime test in this iteration.** Do not count these as PASS.
- **Known limitations:** URL hash can expose internal demo lot IDs; do not put private customer identifiers into these IDs. Browser back can be affected by previous untracked hash entries. Route restoration does not establish access control. A full combined Case/Shard/Garage backup remains unresolved. The existing demo is not production-ready.
- **Next:** test route changes and swipe directions in a browser; implement and verify atomic combined backup with rollback and strict validation; run three role-conflict scenarios and complete a real end-to-end walkthrough.


## Implementation pass · 2026-11-22 01:00 CET · Combined export foundation

**Scope:** only silver-command/garage.js, app.js, AUDIT_LOG.md; root 0.3 untouched.
**Code commits:** a3b84e751bebcfaf63f9c125d930997e51d65bcb, 6547da741629d33889aab9905ec321502d6f0c23.

**Implemented:** Garage exposes a validated deep-cloned snapshot; the existing project Export action now packages both project state and Garage snapshot into a single JSON file with explicit kind/version. If Garage is invalid, locked or unavailable, the combined export is refused instead of silently omitting inventory. The snapshot call does not mutate storage. This is **export-only**, not a completed paired backup/restore feature.

**Critical limitation:** Existing project import accepts legacy project-only schema and does **not** import the new combined format or restore Garage. The new file is an archival combined export, **not yet a restorable one-click backup**. Preserve separate Garage/project backups until a validated two-store import with rollback, compatibility checks and crash recovery is implemented. No code claims atomic multi-key localStorage writes; browser localStorage cannot atomically commit two keys.

**Three perspectives/conflicts considered (design review, NOT executed):** owner exporting a full project; Garage operator with corrupted inventory must not produce falsely complete backup; field installer attempting restore must not be treated as authenticated. These are design checks only.

**Verification:** GitHub accepted both code commits; exact old source anchors were checked before replacement. **No JavaScript parser, Node tests, browser click, role tests, import/reload, or iPhone Safari tests were executed in this pass.** Therefore no runtime PASS claimed. Next run: execute source-linked JS tests, implement safe validated combined restore using rollback journal or single-envelope storage migration, test failure injection, and update UI to distinguish archival export from restorable backup.


## Iteration · 2026-11-22 02:00 CET · combined backup preflight

**Code commit:** `123dcb8b591f993cc703a7dffa5dfe5dcf2f07bf`; scope `silver-command/app.js` only. Root 0.3 unchanged.

**Priority:** prevent the combined JSON exporter from silently creating an unusable/lossy backup. Before downloading, run project normalization, reject records that would be dropped by restore, validate Garage snapshot, and reject consumption usage referring to nonexistent project IDs. Also reject export while project recovery lock is active. Fail closed with a visible alert and no mutation.

**Perspectives/conflicts reviewed:** (1) project manager with invalid stage or feed entry; (2) warehouse operator with consumption referring to a deleted project; (3) device owner with locked project recovery. Code guards are present. These are NOT role-authorization tests.

**Verification:** exact source anchor matched and GitHub content update returned commit SHA. No Node syntax test, browser execution, import/export/reload end-to-end test, iPhone/Safari test, or 3-role runtime test in this iteration. Mark these NOT RUN. The backup is still EXPORT ONLY as a combined artifact; unified atomic restore and rollback are NOT IMPLEMENTED. UI wording still needs alignment. Keep prior separate backups. Do not mark MVP ready.

**Next:** design and implement a validated, rollback-safe combined restore; exercise actual syntax/runtime tests and browser reload, then role conflicts and navigation.


## Iteration · 2026-11-22 03:00 CET · fail-closed combined archive import

**Code commit:** `e70248513e789e0f6b4f90832b36bfe3a9b318e5` (`silver-command/app.js` only).

**Change:** Project-only importer now explicitly rejects `nvtsk-silver-combined-export` and payloads with top-level `garage` before normalization, confirmation, or any storage write. Previously it could silently import only `data` from a combined export while leaving Garage unchanged, causing a false impression of full restoration. Profile UI now accurately calls combined export an archival snapshot, warns that unified import is unsupported, and labels project-only import separately.

**Verification:** Fetched updated GitHub blob; V8 Function parser successfully parsed complete `app.js` (PASS). Static assertions confirmed combined rejection guard and corrected UI label (PASS). The guard precedes all import writes by source inspection. **NOT RUN:** actual browser import/reload, Garage rollback, real role tests, iPhone gestures, end-to-end workflow. This is a protective patch, not a combined restore implementation.

**Perspectives:** device owner trying combined archive, Garage operator avoiding stale stock after project-only import, field installer reading misleading backup label. These are reviewed scenarios, not runtime role authorization PASS.

**Open P0:** validated two-store atomic restore with rollback/crash recovery; stage/post lossless migration; 3-role authorization conflicts; real browser flow and persistence tests. Preserve existing separate backups.


## Iteration · 2026-11-22 04:00 CET · prevent orphaned Garage usage on project-only restore

**Code commit:** `4572577eec5e85d6c486445dbe533559d96f795f` (`silver-command/app.js` only).

**Priorities:** (1) guard project-only import against orphaning existing Garage consumption, (2) reject project import when Garage snapshot is missing, invalid or recovery-locked. This is a protective integrity change, not the requested atomic combined importer.

**Change:** After validating the imported project state but **before confirmation and localStorage write**, request a validated Garage snapshot. Reject import if any existing Garage usage.project is absent from the imported lot IDs. Do not mutate either store on these rejection paths. Project-only restore remains permitted when no existing material usage is orphaned; Garage is not restored by it.

**Verification actually executed:** fetched current GitHub app.js and audit before edits; exact insertion anchor found once; V8 `new Function(fullAppSource)` syntax parse PASS; post-edit guard presence assertion PASS; GitHub code update committed. **NOT RUN:** actual browser form submission/reload, injected storage failures, 3-role runtime conflicts, full workflow, physical iPhone Safari. Static guard order inspected; this is not proof of end-to-end runtime behaviour.

**Perspectives reviewed, not runtime tested:** manager restoring a project backup that excludes a consumed-material project; warehouse custodian with corrupted/locked Garage; field installer encountering an import form. No real authentication is implemented.

**Remaining P0:** combined atomic/crash-recoverable Case/Shard/Garage import with rollback; schema migration without silent truncation; three-role runtime security tests; real mobile browser navigation and full workflow. Preserve separate backups; do not claim MVP is ready.


## Iteration · 2026-11-22 05:00 CET · fail-closed lossy startup

**Code commit:** `ea075ab294f20b4fe9d5b22797296205e28ee118` (`silver-command/app.js` only).

**Critical issue:** normalize() may discard invalid stage/post entries and emit recoveryWarnings during initial load. Previously storageError was shown but recoveryLock stayed false, so any later save could overwrite the original localStorage record with the truncated in-memory version. This is silent data-loss risk.

**Fix:** when initial normalization reports recoveryWarnings, activate recoveryLock before any user action. Existing save() refuses writes while locked, existing combined export refuses locked state, and the raw-original export action remains available. No destructive automatic migration was attempted.

**Checks executed:** fetched current app.js and AUDIT_LOG.md; exact unique source anchor and lock-before-save ordering PASS; GitHub update succeeded; fetched committed app.js and parsed complete source with V8 Function constructor PASS. Static check confirmed combined exporter rejects recoveryLock. No browser reload, storage fault injection, three-role authorization, actual iPhone Safari or end-to-end test this run. These remain NOT RUN. The UI still has potentially misleading legacy text, and the combined import remains unimplemented.

**Next:** validated combined Case/Shard/Garage restore with crash-safe journal or one-envelope storage migration; verify old backups without truncation; execute actual browser persistence, role-conflict and navigation tests. Keep original records and separate backups. MVP not ready.


## Iteration · 2026-11-22 06:00 CET · preserve audit history

**Code commit:** `ab126506ae8fa6b12bd75e0f646ce98623e51b99` (`silver-command/app.js` only).

**Issue:** `normalize()` accepted up to 3000 audit records but silently retained only the last 300, losing up to 2700 entries on load, export, or restore. Subsequent `log()` and import also truncated to 300.

**Fix:** normalize preserves all validated audit entries (up to existing 3000-record validation limit); routine log and import retention raised to 3000. This removes silent 300-record truncation during normal round trips. The 3000-record bounded retention policy still drops oldest entries when new events exceed the limit and must be disclosed or redesigned for archival-grade audit; this is NOT tamper-resistant audit logging.

**Checks executed:** fetched current code and audit before edit; updated app.js via GitHub; fetched committed source and parsed complete JavaScript using V8 Function constructor PASS; static assertions for all three retention paths PASS. **NOT RUN:** actual browser export/import/reload, three-role runtime conflict tests, iPhone Safari, full workflow. No claim of full audit durability. Root files unchanged.

**P0 remaining:** crash-safe combined Case/Shard/Garage restore, strict lossless legacy migration, actual browser persistence and authorization tests. Keep separate backups. MVP NOT ready.


## Iteration · 2026-11-22 07:00 CET · reconcile contradictory Merit specification

**Code/spec commit:** `65f49c1dfd5059f264df59cec12d869e2c0d69d2` (only `silver-command/MERIT_SPEC.md`).

**Critical discrepancy found:** existing specification still said Shard transfers existing Case Merit and charges 2%; this directly contradicted the user's final agreed rules. Corrected documentation: €1,000 Case mints 1,010 Merit (10 additional to platform creator), €250 Shard mints 250 additional Merit, Shard creator pays 1.2%=€3, Case fee €10, combined mint 1,260 Merit and fees €13, all fees to backing without 80/20. Explicitly preserved unresolved issuance recipients, timing, Shard limits, idempotency and real backing questions. No payment code or UI added.

**Checks performed:** read current `app.js` and `AUDIT_LOG.md` before change; checked arithmetic 1010+250=1260 and 10+3=13; GitHub spec update succeeded. **NOT RUN:** JS parser, runtime tests, three role scenarios, combined import/export/reload, browser or iPhone testing (no executable code changed). Current MVP remains blocked on atomic combined restore and full workflow verification. Root 0.3 untouched. Next: resume P0 combined import work; do not confuse specification correction with MVP readiness.


## Iteration · 2026-11-22 08:00 CET · malformed route resilience

**Code commit:** `0d67a7d7e57707970f64abab2a3271a2dfe9023c` (`silver-command/app.js` only). Root 0.3 untouched.

**Bug fixed:** `restoreRoute()` previously called `decodeURIComponent(location.hash.slice(1))` without exception handling. A malformed percent-encoded fragment such as `#lot/%ZZ/1` would throw during route restoration, potentially blanking navigation. Invalid encoding now falls back to dashboard, retaining the existing valid-route parser and top-of-screen reset. No stored data is touched.

**Checks actually run:** fetched source after commit; V8 `new Function(app.js)` full-source syntax parse PASS; static guard presence PASS. **NOT RUN:** browser URL test, iPhone Safari, 3-role runtime conflicts, combined import/export/reload or end-to-end Case→Shard→Garage→acceptance. No claim of a tested browser MVP.

**Remaining P0:** atomic crash-recoverable combined restore, lossless migration, actual browser flow and role-conflict tests. Next iteration should prioritise those rather than cosmetic work. Existing combined export is archival only; preserve separate backups.


## Iteration · 2026-11-22 ~08:55 CET

**Scope:** only `silver-command/app.js`, `silver-command/TOKENOMICS_SPEC.md`, and this audit log. Root 0.3 untouched.

**Code commit:** `4cc956503248019061898be6bb811abb701d1786`.
- Project-only swipe start now ignores buttons, anchors, labels, modal content and horizontally scrolling garage tables, in addition to input/textarea/select.
- `touchcancel` clears the start point to avoid a stale gesture after OS/browser cancellation.
- Minimum horizontal travel raised from 75px to 90px. Existing mapping RIGHT → next page, LEFT → previous page remains unchanged; no swipes between top-level tabs.

**Specification commit:** `babea4e03e9f8bca39c6231401b46bb3e5d9edea`.
- Separate non-executable Merit spec: Case €1,000 → 1,010 new Merit (10 extra to platform creator), €10 fee; Shard €250 → 250 additional new Merit, €3 fee paid by Shard creator; aggregate 1,260 Merit / €13. No 80/20 split, no old 2% fee. Open allocation, idempotency, issuance ceiling and backing questions remain explicit.

**Verification:** Source text and exact replacements verified in the connector write operation; GitHub returned commit SHAs. This iteration did **not** execute a JS parser, browser, iPhone Safari, role/conflict harness, backup import/export/reload or end-to-end UI tests. No PASS is claimed for those. Existing source inspection confirms project navigation is scoped to `screen === "lot"`; interactive target guard remains a UI heuristic, not a security boundary.

**Critical blockers:** Combined Case/Shard/Garage archive export exists, but atomic combined import is not implemented; separate localStorage keys make crash-safe cross-store import nontrivial. `normalize` filters invalid stages/posts, and rejects them for import, but legacy migration and exhaustive reload proof remain open. Client-side demo roles are not authentication. Stage evidence is metadata only. Garage snapshot validates movements but must be tested for recovery under corrupted storage.

**Next:** design and test crash-recoverable combined import (staging journal and rollback / deterministic recovery), migrate old backups without silent loss; then run 3-role conflict tests and browser navigation checks. Do not claim MVP complete.


## 2026-11-22 · daytime visual pass (iPad feedback)
- User reports deployed UI does not resemble approved concept images. Prioritised graphite/silver Tactical + Industrial + Legacy styling without replacing the functional app.
- Commit: `b26eebee0f05cd90ac098f6935990875f771f1b2` updates **only** `silver-command/style.css` with sidebar, active navigation, hero, panels, buttons, typography and responsive bottom navigation refinements.
- Safety: existing selectors and CSS remain; additive overrides only. No JavaScript, state, import/export or routes changed. No real user/client data committed.
- Checks: GitHub update returned commit SHA (PASS); CSS content appended successfully (PASS). **NOT TESTED:** actual Safari rendering, iPad/iPhone layout, full browser interactions, JavaScript syntax, three roles, conflicts, import/export/reload. These are not claimed as passing.
- Known gaps: current screen structure still differs from approved concepts; five-tab information architecture and exact canonical 3D N logo not implemented. Do not substitute a generic N for the approved reference. Unified atomic Case/Shard/Garage restore remains blocked.
- Next: user visually reviews deployment after refresh; implement actual Command/Field screen structure incrementally and test navigation; separately address atomic restore and regression coverage.

## 2026-11-22 · daytime Command UI restructuring
- User requested actual restructuring to match approved visual concepts, not additional mockups.
- Commits: `9d289f32dce72cceef1c1431add479efab6fe359` (app.js: dashboard, five tabs, Tasks, Settings), `6eb602fc5b69d36de4859306cd6aaa67c7d9940f` (style.css responsive dashboard), `c7de7349af7889f9a07905c3e6d51aaec43eeb27` (index.html no-JS navigation).
- Main navigation now Home / Projects / Garage / Tasks / Settings. Existing Map, Chat, Profile functions remain in source for backwards compatibility but are not top-level tabs. Project screen and swipe logic untouched. Settings exposes existing backup actions and marks future modules as “Скоро”; no fake active sync or financial transactions. Tasks lists existing stage data and links to project workspace; no new stage mutations.
- Verification: GitHub returned three commit SHAs (PASS); fetched updated app.js and parsed using V8 `new Function` (PASS); confirmed five-tab definition and settings route dispatch by source inspection (PASS). **NOT TESTED**: actual browser navigation, touch gestures, reload, import/export, 3-role adversarial scenarios, iPad/iPhone layout. No claim of fully completed design or MVP.
- Limitations: canonical ribbon N logo not yet implemented; photo-backed hero and full Field Mode require separate implementation. Unified atomic restore Case/Shard/Garage still missing; do not trust combined export as restorable. No changes outside silver-command/.
- Next: visual QA on iPad, fix any rendering regressions, implement real Field Mode and verify browser workflow; separately prioritise atomic import with rollback.
