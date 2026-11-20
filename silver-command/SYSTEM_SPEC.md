# NVTSK SYSTEM · SILVER COMMAND 0.4
## Product specification · 2026-11-20

**Status:** concept and independent implementation track. Files live only in `silver-command/`; existing 0.3 remains untouched. All example organisations, lots, people and bids are fictional demos unless clearly labelled otherwise.

### Mission
A practical PV coordination system for crews, clients and specialist partners in Germany. Every real-world action belongs to a verified project, a bounded lot, a stage and a responsible party. Tactical command centre and professional engineering workflow are primary; Legacy is a transparent career layer.

### Visual system
Graphite `#0B1016`, deep surface `#17212B`, steel `#8094A3`, silver `#CBD5DC`, platinum `#F1F4F6`; slight cyan for active navigation and green/yellow/red for meaningful statuses only. Core glass-metal cards: `rgba(16,25,33,.82)`, `backdrop-filter:blur(16px)`, 1px translucent silver border, 22px radius, subtle top highlight and soft depth shadow. Nested cards 88% opacity and lighter depth. Large touch controls suitable for roof work. Don't use decorative animation at expense of legibility.

Mobile navigation: **Command Center, Map/Market, Projects, Chats, Profile**; contextual Crew and MentorGate under Profile. Desktop sidebar and split-window project workspace. Fallback for no-JavaScript/offline and reduced-motion support. Never treat schematic maps as navigational maps.

### First principles
- No global account-role selector at registration. Person enters **«Ваше имя»**, contact details and optionally skills; on each lot the **creator acts as customer** and authorised invited/awarded participants act as contractors or specialists. Bidder is a candidate, not a contractor until award. A captain is a **crew permission**, not a profession.
- Separate **person**, **company/legal entity**, **crew**, **project**, **lot**, **membership**, **contract**, **stage**, **evidence**, **ledger**. A person may be client on one lot and installer on another; the contracting legal entity may differ from the human creator. Avoid self-award and self-approval conflicts.
- A project may contain interdependent lots and arbitrarily nested sublots. Default workflow branches: `Projektierung`, `DC-Montage`, `AC-Anschluss`, `Anmeldung`. Each child inherits suitable documents and site constraints while owning separate budget, assignment, deadlines, scope and acceptance.
- Kompetenz: distinguish self-described DC experience, verified qualifications, and legally authorised AC/Netzbetreiber tasks in Germany. A profile saying Elektrofachkraft does **not** establish an authorisation.
- Project files include site conditions, safe access, scaffold/RSS, roof photos before, PDFs, Dachplan, Unterkonstruktion/Dachhaken, Stringplan, cable routing, Erdung, material list, labour allocation, logistics, change orders.
- Evidence-based stages: photo BEFORE → task → photo AFTER → review → accept/return with reason, revision and timestamp. Photo presence alone does not certify safety/compliance.
- Lot-specific posts, comments, attachments, mentions, reactions, notification and private chats create the social layer. Explicit access boundaries; messages do not leak to other users or clients.
- Merit is a tracked in-app reward; Legacy is earned reputation from independently verified outcomes and must **never be bought or doubled** via a balance. MentorGate bonds may reward genuine coaching after independent review, but not manufacture skill verification or reputation.
- Suggested **1 Merit = €0.01** is a UX hypothesis, not a tax exemption. Germany's invoices, VAT, transfers, employment classification and payment-service regulation need external legal/accounting review before live economic flows. Real fiat and platform points require separate books.
- The prototype is **local/demo only** unless a real backend, authentication, file storage, roles, legal protections, telemetry, moderation and recovery are explicitly implemented. Never claim shared real-time chats, transactions, contract award, verified acceptance or cross-device access without them.

### Core information model
Person(id, name, avatar, phone, languages, region, skills, verification_state)
Organisation(id, legal_name, verified_status, administrators, invoicing_identity)
Crew(id, organisation_id, captain_id, administrators[], members[], tools, vehicle, availability)
Project(id, owner_org, address_private, site_constraints, milestones, documents[], gallery_before[], revision)
Lot(id, project_id, parent_id, author_id, customer_org_id, scope, kind, budget, start, deadline, requirements[], state, awarded_bid_id)
LotMembership(id, lot_id, person_id, role, grantor, granted_at, revoked_at)
Bid(id, lot_id, crew_id, price, currency, scope_version, conditions, evidence, status, submitted_at)
Contract(id, lot_id, bidder_id, customer_id, terms_version, signature_status, changes[])
Stage(id, lot_id, type, owner_id, description, pdf_page_links[], status, acceptance_by)
Evidence(id, stage_id, uploader, type, storage_key, file_hash, created_at, capture_time, visibility)
Post(id, location, author, text, media[], status, created_at) + Comment / Reaction / Mention / Notification
Conversation(id, scope, participants[], messages[]) + Message(id, author, body, files, sent_at, read_by[])
LedgerEntry(id, person, account, direction, amount, currency_or_merit, actor, cause_id, reverses_id)
Mentorship(id, mentor_id, trainee_id, reserved_merit, goals[], assessor_id, state)
Dispute(id, lot_id, claimant, counterparty, evidence[], mediator, decision)
AuditEvent(id, object, action, actor, time, before, after)

### User journeys
**Customer** → create project and before photos → attach PDF, Stringplan and safe access constraints → split into four lots → choose criteria/requirements → shortlist and compare bidders by price, schedule and verified Legacy → contract award → exchange project chat/comments → review checklist and Zusatzarbeiten → approve/return evidence with rationale → reconcile invoice and tip → final closeout.
**Crew captain** → form a verified crew and availability → evaluate project documents and labour/safety requirements → bid with exact scope → assign qualified participants to awarded tasks → track tools, travel, logistics, photographs and site incidents → request acceptance → calculate real payment and Merit separately.
**DC installer** → join crew/lot → read plans → track assigned tasks → upload DC evidence → report problems → access own history and private finance.
**AC specialist** → upload qualification evidence → independent competence verification → receive authorised work only → maintain test/commissioning records; registration (Anmeldung) through qualified parties.
**Mentor/newcomer** → invitation from person with sufficient available Merit → bond freeze → consent and onboarding → goal milestones and independent assessor → release/reward or dispute with a defined time limit.
**Mediator/platform admin** → cannot arbitrarily edit earned Legacy or move user Merit without audited reason and permission → anti-fraud and dispute process.

### Critical acceptance criteria
1. Bidder cannot bid their own lot; cannot approve own work, or act on behalf of another organisation without authority.
2. Every stage acceptance cites file evidence, reviewer, time, and a review reason if returned. Offline uploads remain pending until server confirmation.
3. Subcontract/child lots cannot silently exceed parent budget; warn on scope changes and split responsibility.
4. Double charging avoided with separate accounts for fiat invoices, platform points, refundable mentor bonds.
5. Every real-world PV task has a responsible legal entity and explicit ownership of scaffold, materials, defects and damage.
6. Project documents versioned; a changed Stringplan makes old evidence/reviews visibly outdated.
7. The social layer enforces membership visibility and moderation; no exposure of client address to non-authorised people.
8. Security, backup, account recovery and device-loss controls exist before real data is used.
9. Role views tested from customer, contractor, captain, installer, AC specialist, trainee, mentor, mediator and admin perspectives.
10. Honest implementation status: prototype vs production clearly delineated in UI.

### MVP milestones
**0.4 design and system prototype:** coherent Silver Command navigation, a few fictional lots, working local interactions, architecture and risk documentation.
**0.5 connected pilot:** accounts/organisations, server database, signed access control, project document storage, chat, uploads, notifications, versioning and audit logs.
**0.6 commercial pilot:** real project contracts, invoices and payouts via regulated providers, legal terms, qualifications, anti-fraud, claims and privacy compliance.

### Quality loop
Each iteration should review visual consistency, user permission model, on-roof usability, failure/offline scenarios and how each change affects project/ledger state. Re-run syntax/invariant tests; record precise results in `AUDIT_LOG.md`. Stop adding features when risk to existing data exceeds value.
