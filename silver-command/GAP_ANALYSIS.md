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
