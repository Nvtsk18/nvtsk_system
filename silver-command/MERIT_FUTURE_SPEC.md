# Merit economics · agreed future specification (NOT ACTIVE)

**Status:** specification only. No actual Merit minting, fees, financial transactions, accounting or user balances are implemented. First finish the PV operations MVP.

## Confirmed model (2026-11-21 evening)

- Creating a **Case with nominal value €1,000** issues **1,010 new Merit**: 1,000 base Case Merit and **10 additional Merit for the platform founder** (not the Case creator). The 10 founder Merit belong to this illustrated Case issuance event; repeated events and exact scaling require formal issuance rules.
- Creating a **Shard worth €250** issues **250 additional NEW Merit**. This is **not** a transfer, reservation or allocation of the Case's previously issued 1,000 Merit.
- The Case fee is **1% of €1,000 = €10**. The Shard fee is **1.2% of €250 = €3**, paid by the **Shard creator**. The previously suggested 2% Shard fee is superseded.
- After these two issuance events: **1,260 Merit issued**, **€13 in total fees**. Fees and issued Merit are different units and must not be conflated.
- **100% of both fees** is earmarked for Merit backing / dilution compensation, **without an 80/20 split**. This earmark does not establish actual reserves or guarantee value.

## Unresolved decisions (do not invent answers)

1. Recipient and vesting/availability of the 1,000 base Case Merit; recipient of the new 250 Shard Merit.
2. Exact issuance time and lifecycle: creation, acceptance, cancellation, refund and reversals.
3. Limits on total child Shard issuance relative to parent Case, including nested Shards and over-issuance risk.
4. Stable event IDs, retries, duplicate prevention, concurrent updates, audit and import/replay idempotency.
5. Founder grant formula for other Case sizes, rounding, minimum units and whether any one-off grants exist.
6. Fee payer for the Case, fee treatment of cancellation, taxes, refunds and cash custody.
7. Legal and financial obligations of backing Merit, dilution-offset methodology and independent accounting.

## Future acceptance scenarios

1. One Case €1,000 produces 1,010 Merit, including 10 allocated to founder. Retry of the same creation event issues zero additional Merit.
2. One new Shard €250 produces 250 **new** Merit, without reducing the 1,010 already issued. Retry issues zero.
3. Supply after both unique events equals 1,260 Merit; fees are €10 + €3 = €13, entirely earmarked for backing.
4. A Shard creator pays the €3 fee; 2% and 80/20 logic must not appear in executable financial code.
5. Any unclear recipient, cancellation or issuance-cap case must fail closed rather than mint arbitrary balances.
6. Three future authenticated roles: Case author, Shard executor and independent reviewer; an executor must not approve their own work.
7. On import/reload, reject duplicate events, unknown parent IDs and divergent supply, and reconcile from canonical events.

## MVP boundary

Do not wire Merit economics into Command Mode, Field Mode, Garage or Project Pulse until the local PV workflow, combined backup, restore and role tests are reliable. No live payments, tax exemptions, verified qualifications, production security or GDPR/AML compliance are claimed.
