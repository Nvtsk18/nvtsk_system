# WHAT WE MISSED · NVTSK 0.4
## Risk discovery and requirements that must not be lost

This document is a product risk inventory, not legal advice or a claim that the code already implements the controls. Prioritise through the lens of **working solar projects in Germany**.

### 01. Real contracting responsibility (P0)
- One lot may have a **person who created it**, an **organisation legally commissioning it**, a project owner and a different payer. These are not interchangeable.
- Full project owner can subcontract DC while being contractor (not end-client) of the parent. At each sublot, identify opdrachtgever/contractor, insured party, VAT/invoice party, warranties and who can appoint others.
- Capture scope, exclusions, material supplied by which party, access, scaffold and weather delays before bid. Version terms after each change order. Allow independent execution and acceptance milestones.

### 02. German trade and safety (P0)
- DC montage, cable laying, AC electrical work, commissioning and Anmeldung carry distinct risks and legal permissions. Verified certificates, installations with Meister/Elektrofachkraft and Netzbetreiber registration must not be inferred from someone's chosen profile label.
- Roof-work safety: Gerüst/RSS, fall risks, traffic, weather stop-work authority, rescue plan, damage incidents and photos. Who signs the Sicherheitsunterweisung? Who supplies and inspects safety equipment? What about BG BAU, liability and accident reporting?
- No gamification incentive should reward unsafe speed or encourage skipping documented safety steps.

### 03. Independent acceptance and disputes (P0)
- User-submitted AFTER photo is a **request for review**, not confirmation that work is correct.
- Prevent self-acceptance, fake reviewer accounts and backdating. Need staged review, corrections, SLA, approved scope version, immutable history, disputed stages and arbitration.
- For payment disputes, define retention, partial acceptance, punch list, evidence lock and appeal route. Never deduct or grant reputation without an auditable reason.

### 04. Merit, Legacy, XP and fiat separation (P0)
- Four distinct systems: (a) real euros owed under contracts/invoices, (b) spendable Merit, (c) frozen MentorGate Merit, (d) non-purchasable Legacy/XP.
- The proposed 1 Merit = 1 eurocent may introduce tax, financial, consumer and employment obligations even if balances never cash out. Never represent tax exemption without advice.
- Need anti-fraud issuance thresholds, caps, reversible accounting entries, value policy, payout eligibility and proof of legitimate work. Incentives must not amount to unlicensed banking/gambling.
- Establish whether the business charges subscription, transaction commission or partner fees. Avoid building an economy before deciding a sustainable revenue model.

### 05. Business permission and private information (P0)
- Client site address and rooftop images may reveal personal information. A public search-result lot should show only approximate location until access is granted. Detailed address, PDF and photos become visible based on explicit project membership.
- Do not store identity documents, bank data, certificates or private contracts in public GitHub or unauthorised browser storage.
- Include GDPR roles (controller/processor), retention periods, deletion/export, third-party consent, audit, breach response and access revocation.
- An admin does not automatically gain authority to read everyone's direct messages or personal finance.

### 06. Persistent media, revisions and offline operation (P0)
- In-device preview mode is not a shared database. Browser cache clearing, iPhone storage pressure and app reinstall can lose localStorage / IndexedDB files.
- Need encrypted storage, upload retry, conflict detection, upload hashes, automatic compression where safe, server acknowledgement, queue monitoring, and structured backup.
- A changed PDF / Stringplan must signal whether photo proof or material orders refer to an obsolete revision.

### 07. Social network and trust (P1)
- Posts can target the lot, the project, a crew, a professional community or a direct conversation. Visibility defaults differ, especially for photos of private homes and work in progress.
- Features: threaded comments, mentions, reactions, image/video/PDF previews, media reports, search, moderation, notifications and read receipts. Prevent spam, doxing, unwanted invites, fake reviews, self-voting and harassment.
- Workers should be able to communicate across crews while keeping unrelated client chat private. Social achievement never constitutes verified technical qualification.

### 08. MentorGate and onboarding (P1)
- What if a newcomer never accepts, mentor quits, the trainee is removed from a crew, training is paused due to injury, or both parties dispute competence?
- Bond schedule, consent, measurable milestones, independent assessor, maximum duration, release conditions, appeals and anti-sybil controls are essential.
- Sponsoring a newcomer should not unfairly penalise people with limited Merit who are otherwise qualified; alternative invitation routes may be needed.

### 09. Lot dependencies and changes (P1)
- Default 4-stage breakdown (Projektierung, DC, AC, Anmeldung) is a template, not a universal contract structure. Real projects include scaffolding, grounding, cable routes, logistics, grid-operator appointments and separate technical inspections.
- Track milestone dependencies, materials inventory, change orders, roof measurements, module layouts, acceptance holdpoints and deadlines.
- If original lot is split, set parent/child budget reconciliation and prevent identical scope being awarded twice.

### 10. Governance, team lifecycle and business survival (P1)
- Crew membership and captain/admin permissions must handle departures, suspensions, ownership transfer and sign-off delegation.
- A freelancer/contractor can work with multiple organisations; availability, working time and potential Scheinselbstständigkeit in Germany cannot be hidden by game-like guild membership.
- Define pricing, operating costs for server and storage, payment provider, customer acquisition and support, incident response and accountable operator.
- Start with one verified pilot crew and a few consenting customer projects. Only then expand to marketplace and a public professional social network.

### Product quality gate
A feature is not **done** unless: actor and permission are defined, business state change is explicit, UI works on iPhone, data survives reload, failure path tested, backend-vs-demo status truthful, and an audit entry records it.


### Second review: overlooked product life-cycle failures (2026-11-20, additional discovery)

The first 20 risks mainly covered roles, permissions, safety and in-lot execution. A second review identifies **12 distinct scenarios** that deserve explicit product behavior and tests. These are *new requirements, not implemented features*.

| # | Failure scenario | Required behavior | Priority |
|---|---|---|---|
| 21 | A crew wins 3 lots starting the same day, but has only 2 installers and one van | Capacity calendar, crew-member availability, booking conflict, contingency reservation and clash warning before award | P0 |
| 22 | Customer cancels after scaffolding / worker travel booked, or crew is a no-show | Cancellation terms, deposits or contractual cancellation costs (subject to legal review), proof of notice, no-show clock, incident/audit trail | P0 |
| 23 | Procurement lists 90 PV modules; 88 arrive and 2 are damaged | Delivered-vs-planned materials ledger, photo evidence, chain of custody, shortage/damage owner, replenishment and return workflow | P0 |
| 24 | Bid priced for easy roof work; onsite reality needs tile repair or longer cable route | Quote scope/baseline version, approval of additional work *before* execution, price + schedule impact, dispute-safe revision | P0 |
| 25 | DC crew finishes but AC crew arrives after a week and defects block commissioning | A cross-party handover checklist, wiring/photos/measurement sign-off and a formal 'ready for AC' gate | P0 |
| 26 | A fault appears six months after acceptance | Warranty/service case linked to original lot, serials, installation snapshots, responsible firm, deadline and resolution | P1 |
| 27 | Panels, inverter, battery, optimiser serials must be traced for warranty and recalls | Device inventory with QR/serial import, location mapping, ownership and documentation, with appropriate privacy | P1 |
| 28 | Work priced at €2k looks profitable but travel, lifting gear, materials and rework erase margin | Project contribution margin and estimates-vs-actuals, with private accounting data isolated by legal entity | P0 |
| 29 | A captain, driver, licensed electrician, vehicle or lifting device becomes unavailable unexpectedly | Substitute workflow with verification, team approval, responsibilities, access revocation and revised schedule | P1 |
| 30 | Installer submits recycled/photoshopped evidence to farm Legacy | Duplicate hash detection, reviewer independence, suspicious submission signals and human review; metadata alone is not proof | P0 |
| 31 | Client leaves NVTSK or the platform shuts down | Export structured data + PDFs + photos + audit trail, backups, retention rules, transfer/exit and account continuity | P0 |
| 32 | Users do not join because features are too complex, market has no liquidity | Minimal operational utility for one customer + one real crew without marketplace: project intake, checklist, handoff, invoice-ready report; measure activation and completion before broader gamification | P0 |

Further system-design questions to explicitly resolve before backend:
- **Time model:** work start, staff shift, public holidays, site access windows, delivery slot, dependent AC/Netzbetreiber inspection appointments; all timezone-aware with calendar sync and conflict management.
- **Assignment vs binding contract:** a 'bid placed', 'bid accepted', 'contract signed', 'site access granted', 'work started' and 'stage accepted' are different states. Don't make one button legally or financially imply them all.
- **Resource ownership:** who supplied scaffolding, lifting gear, modules, rails, cable, van; who owns them and who pays for loss/damage.
- **Post-project longevity:** photos, serials, warranties, callbacks, original scope and acceptance must be retrievable after membership change and offboarding.
- **Sustainable adoption:** on day one each stakeholder needs a useful workflow even if there are zero external bids and no active social feed.

Suggested immediate tests:
1. Attempt to award a lot when crew or licensed resource is double-booked.
2. Mark material missing/damaged, ensure associated task and delivery gate cannot be silently cleared.
3. Reprice a change order and prove original bid, old document revision and acceptance remain visible.
4. Hand DC work over to AC with required evidence; prevent bypass without explicit waiver/authority.
5. Open a warranty case after closing the original contract; revoke former worker access while preserving audit.
6. Re-upload a previously accepted photo to another project; flag rather than automatically award reputation.
7. Export a complete signed-off case (structured history + references to media files, subject to access rights).
8. Have a newly invited, untrained worker attempt to accept AC tasks; reject until independent qualification/authorisation.
9. Simulate a single-crew pilot with no marketplace: it should still eliminate real coordination overhead.

These points complement, not replace, the earlier P0 requirements for legal contracting parties, privacy, safety, disputes, financial-service boundaries and server-backed multi-user security.
