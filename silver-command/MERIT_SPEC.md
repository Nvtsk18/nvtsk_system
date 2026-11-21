# NVTSK Merit economics — agreed rules (2026-11-21)

Status: SPECIFICATION ONLY. Not deployed, not a payment or securities system. Stable browser MVP has priority.

## Events and invariants

1. A Case creates the base Merit allocation **once** at Case creation. Nominal mapping: €1 of Case value = 1 base Merit. Example: €1,000 Case creates 1,000 base Merit.
2. An additional **10 founder Merit** were discussed for the €1,000 Case example. Record these as a separate founder allocation/event, never as executor Merit, and do not silently infer a universal formula from one example. Clarify exact issuance trigger and dilution treatment before implementing.
3. Creating a Shard never mints Merit. A €250 Shard carved out of the €1,000 Case reserves/transfers **250 of the existing 1,000 base Merit** to the Shard executor under the agreed workflow. The parent Case's unallocated balance decreases by 250; total base Merit remains 1,000. Avoid assigning funds before executor/award rules are resolved.
4. Sum of active child Shard allocations must never exceed the parent Case base Merit. No negative balances, duplicate issue/transfer events, replayed rewards, or creation of Merit from a Shard.
5. Case fee **1%**, Shard fee **2%**. Per latest verbal decision, **100% of each applicable fee** is allocated toward Merit backing / offsetting dilution. There is **no 80/20 split**. These are accounting policy requirements, not evidence of real escrow, asset backing, or an executed transfer.
6. Keep EUR fee amounts, Merit units, founder issuance, executor allocations, and backing entries as separate ledger dimensions. Never treat fees in EUR as new Merit minted or as automatic balance increases.

## Worked example (subject to fee base clarification)

- Create Case €1,000: base Merit issued = 1,000; founder event = +10 Merit separately if the agreed founder rule applies.
- Create Shard €250: 250 Merit allocated from Case; base Merit issued by Shard = 0; parent base Merit remaining = 750.
- If fees are computed on gross nominal value, 1% × €1,000 = €10 and 2% × €250 = €5, each fully designated to backing/dilution-offset. **This fee base is an assumption for illustration only**, not a final rule.

## Open questions before code/real money

- Does 1% apply to Case nominal value, platform payment, or another basis, and when is it charged? Does 2% apply to every Shard and when?
- Is the founder +10 Merit per €1,000, per Case, or a one-time special allocation? What event authorizes it?
- Does executor allocation occur at Shard creation, assignment, acceptance, or payment? How do cancellation/refund/reversal and disputes work?
- What precisely constitutes Merit backing and who holds it? Legal, tax and payment-service implications need professional review.

## Required tests before implementation

- Creating Case €1,000 produces exactly 1,000 base Merit once; idempotent replay adds zero.
- Splitting into €250 Shard moves exactly 250 existing base Merit; total supply unchanged; remaining Case allocation = 750.
- Four €250 Shards consume exactly 1,000; fifth fails; duplicate Shard ID fails.
- Case and Shard fees each allocate 100% to the backing ledger with no 80/20 branch, but never mint new Merit.
- Failed, rolled-back, cancelled and imported duplicate events do not double-credit or lose allocations.

Do not claim this spec is live in Silver Command 0.4 until implementation, regression tests and browser checks exist.
