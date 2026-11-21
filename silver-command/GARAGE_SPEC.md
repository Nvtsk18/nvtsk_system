# NVTSK Garage · inventory and custody model (design specification)

Status: approved concept, **not implemented functionality**. Applies to Silver Command 0.4, Local First → Network → Europe. Keep root 0.3 unchanged.

## 1. Domain
- **Organisation** may operate multiple **Garages**.
- **Garage** is the team/clan operational unit with one shared inventory pool, captain(s), delegated administrators, members, physical depot, and zero or more vehicles. A depot plus three vans is ONE garage stock pool, not four independent warehouses.
- **Location** is a physical bin/depot/vehicle/site within the garage, for traceability. The total garage on-hand is the sum across internal locations; internal transfers do not change that total.
- **External custodian (Fremdlager)** is a contractor, company, person or vehicle outside the garage, optionally without an NVTSK account. It holds items on behalf of the owning organisation/garage, without necessarily owning them.
- **Ownership** and **custody/location** are distinct attributes. External handoff must not silently transfer title or mark material consumed.
- **Project/lot** and **Bautagebuch** link inventory usage to task evidence and financial cost.

## 2. Movements and balances
- Purchase/receipt increases owned stock at a specified internal location.
- Depot ↔ van, van ↔ van are **internal transfers**, not consumption or project expense.
- Handoff to an external custodian moves custody from garage available stock to **externally held** stock, still owned by NVTSK unless explicit ownership transfer.
- Reservation for a project reduces available-to-promise but not on-hand or ownership.
- Delivery to site is a location/custody movement, not automatically consumption.
- **Confirmed installed/consumed quantity** creates a project usage transaction and posts its cost once to the project's ledger and daily Bautagebuch; remaining material stays in custody and may be returned.
- Return reverses a custody movement, and if already consumed requires a distinct corrective/return transaction, not silent deletion.
- Disposal, loss, sale and ownership transfer require explicit separate transaction types and appropriate approval.

Invariant for each item and owner: owned total = internal on-hand + external custody + site custody + any other tracked owned custody (subject to explicit usage/disposal/sale); a custody transfer alone never changes owned total. Use consistent base units (pieces, meters, kg) and conversion rules. Never let quantities go negative.

## 3. Access and accountability
- Captain and delegated garage administrators manage resources, members and approvals; multiple admins supported.
- Member can view authorized garage inventory and request/confirm pick-up, installation and return within assigned project/lot.
- External contractor sees only their own consignment and assigned project scope, not the complete garage inventory.
- Every movement records item, quantity/unit, from/to, owner, custodian, actor, time, project/lot where applicable, and status; record who handed over and who acknowledged receipt.
- Unregistered custodians use a restricted contact/custody record; no fictitious authenticated confirmation. Audit entries are append-only in design; a local demo cannot provide tamper-proof audit.

## 4. UX and integration
- Command Mode: garage overview, pooled available stock, physical breakdown per vehicle/depot, external custody panel, shortages, outstanding acknowledgements and project cost.
- Field Mode: large controls for receive, install/consume, return, and discrepancy; show exact project and item before confirmation.
- Project Stückliste drives demand/reservation and shortage checks; Bautagebuch references confirmed consumption; financial ledger derives costs from posted usage and avoids double-counting.
- QR codes for vehicle, bin and item are a later enhancement, not prerequisite.
- Never automatically assume all issued stock was installed; capture actual quantity and reconcile differences.
- Avoid exposing private customer addresses or documents in public/demo repositories.

## 5. MVP sequence and acceptance criteria
1. Garage, depot, van and external custodian data model; pooled garage stock and physical-location balances.
2. Typed movements with validation, no negative balances, no duplicate posting; internal and external custody transfer.
3. Project reservation and confirmed consumption, return, daily journal and cost integration.
4. Permission boundaries for captain/admin/member/external contractor, mobile workflows, offline persistence/import tests.

Test scenarios: (a) 40 Dachhaken loaded in van, 34 installed, 6 remain; (b) 20 Dachhaken passed to external contractor, owner remains NVTSK and unavailable for local picking; (c) two vans transfer material internally, pooled garage total unchanged; (d) contractor cannot browse other garage stock; (e) repeated submission does not double-charge; (f) return and partial delivery reconcile quantities.

This is a specification, not evidence of a deployed inventory feature or secure multi-user authorization.
