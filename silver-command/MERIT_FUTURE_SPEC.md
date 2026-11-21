# Merit economics · deferred design contract (NOT ACTIVE)

Status: **specification only**, not a deployed token, payment system, or accounting ledger. The PV operations MVP takes priority.

## Supply and allocation

- A Case with nominal value €1,000 creates 1,000 Case Merit units **once**. Case creation must have a stable idempotency key.
- An additional **10 founder Merit** is recorded in a separate founder issuance class, never as performer allocation. Whether this is per Case or a one-time grant is **unresolved**. Do not implement founder minting until clarified.
- A €250 Shard reserves/transfers **250 of the existing Case Merit**, not a new issuance. Shard creation never changes total issued supply.
- Case allocation invariant: sum(active Shard reservations + completed Shard allocations + other Case allocations) <= original Case issuance, excluding separately tracked founder units. A single unit cannot be both reserved and allocated. Cancellation releases only its own reservation, exactly once.
- Idempotency: retries of Case creation, Shard reservation, Shard completion and cancellation must not duplicate movements. All balances nonnegative. Concurrent updates must use an atomic compare-and-swap or transaction when a backend exists.

## Fees and coverage

- Current design instruction: **Case fee 1%, Shard fee 2%**; 100% of each fee is earmarked for Merit coverage / dilution offset, **no 80/20 split**. Earmarking is a *ledger policy*, not a claim of actual cash reserves or price stabilization.
- **Open conflict:** an earlier conversation used **1.2% on a €250 Shard (€3)**, whereas the latest design instruction says **2% (€5 if charged on full €250)**. Do not charge, display or settle either rate in live code before explicit confirmation.
- **Open fee bases:** whether Case fee applies to nominal Case value and Shard fee to nominal Shard value, paid amount, or another base; fee payer; rounding, refund, cancellation and tax treatment. No guessed calculations in active UI.
- Even if 100% of fees is earmarked, this does not prove complete compensation for dilution or guarantee Merit value. Merit does not eliminate taxes.

## Future executable acceptance scenarios

1. Create Case 1000: issued Case supply +1000; retry unchanged; founder issuance separate and disabled pending clarification.
2. Reserve Shard 250: Case available 750; total issued unchanged; retry unchanged.
3. Reserve another 800: reject (would exceed Case allocation). Reject negative or fractional units and cross-Case transfers.
4. Complete reserved 250: reservation -250, allocation +250; issued unchanged; repeated completion no-op.
5. Cancel an uncompleted 250: reservation -250, available +250; repeated cancellation no-op; cannot cancel completed allocation without explicit reversal policy.
6. Three roles: Case owner may propose Shard, assigned performer may report completion, independent reviewer may approve; outsider and performer-as-own-reviewer denied. These are future authenticated permissions, **not** the current demo actor switcher.
7. On import/reload, recompute supply and allocations from canonical events, reject duplicates, unknown Case references, and balance divergence. Test partial restore, replay and concurrent reservations.

## MVP boundary

Do not wire this specification into Command Mode, Field Mode, Garage or Project Pulse until local PV workflow, paired backup, restore and role tests are reliable. No live payments, token issuance, KYC/AML/GDPR compliance, qualified electrical acceptance or production accounting is claimed.
