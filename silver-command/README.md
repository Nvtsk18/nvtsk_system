# NVTSK SYSTEM 0.4 · SILVER COMMAND

**Independent MVP track**. The root `index.html` of version 0.3 is not modified.

Open in browser, when GitHub Pages is enabled: `https://nvtsk18.github.io/nvtsk_system/silver-command/`. The published deployment has **not yet been independently confirmed**.

Files: `index.html`, `style.css`, `app.js`.

## Current tested local demo scope
- Silver/glass-metal visual language, slightly translucent cards, responsive layout with mobile five-tab navigation and visible HTML fallback when scripts are blocked.
- Command Center, Map/Market list, Projects tree, Chats placeholder, Profile, lot workspace.
- Create a lot, assign its author as contextual customer, split into Projektierung / DC / AC / Anmeldung sublots.
- Local test bids. Prevent self-bidding and self-assignment as installer of own lot.
- LocalStorage test data isolated from version 0.3. This is **not** a shared user database.

## Not yet implemented or production-ready
- Persistent photo/video/PDF evidence uploads and viewer, stage approval with real identity and signed audit.
- Real project social network, shared chat, verified qualifications and financial/Legacy ledger.
- MentorGate workflows, payments, VAT/invoicing, multiuser auth, GDPR controls, encrypted storage, offline sync, account recovery and independent arbitrator.
- Real company accounts or actual Sunpower/Solan Plus/Kempter project PDF data.

See `SYSTEM_SPEC.md`, `GAP_ANALYSIS.md` and `AUDIT_LOG.md`. Nightly automation iterates on the isolated folder and records **only actually tested results**.

## Smoke test
1. Open home on iPhone and confirm five bottom tabs.
2. Create a dummy project. The current user is its customer.
3. Split it into four child lots and check relationships.
4. Attempt to bid on the original user-created lot, and confirm this is rejected.
5. Open a sample external lot and place a **demo** bid.
6. Reopen the page and confirm data persists locally.
7. Confirm the original GitHub Pages root version 0.3 is unchanged.

This demo should **never** be used for real customer private documents or actual payment handling.
