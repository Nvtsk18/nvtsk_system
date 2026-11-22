# Merit economics — final agreed rules (2026-11-22)

**SPECIFICATION ONLY. NOT IMPLEMENTED.** This supersedes all earlier descriptions of Shard allocation, 2% Shard fee, or 80/20 fee split. No payment, minting, wallet, accounting, legal or tax-ready implementation is authorized in Silver Command 0.4. Merit does not exempt anyone from taxes.

## Agreed event rules

- **Case nominal €1,000:** creates **1,010 NEW Merit**, including **10 additional Merit awarded to the PLATFORM CREATOR**, NOT the Case creator. Case fee **1% = €10**.
- **Shard nominal €250:** creates **250 ADDITIONAL NEW Merit**; it does **not** transfer or deduct Merit from the parent Case. The **Shard creator** pays the **1.2% = €3** fee. The earlier 2% fee is cancelled.
- **Combined example:** total **1,260 NEW Merit** and **€13 fees**. EUR fees and Merit supply are distinct units. **100% of both fees** goes toward Merit backing / compensation for dilution, **without any 80/20 split**. This earmark is a rule, not proof that real collateral or payments exist.

| Event | New Merit | Fee EUR |
|---|---:|---:|
| Case €1,000 | 1,010 | 10 |
| Shard €250 | 250 | 3 |
| **Total** | **1,260** | **13** |

## Explicitly unresolved: do not invent answers

1. Recipient(s) of the 1,000 base Case Merit and the 250 newly minted Shard Merit.
2. Exact issuance timing, acceptance/finality and reversal rules.
3. Child Shard creation/nominal limits and resulting maximum supply.
4. Idempotency, duplicate creation, replay, cancellation, rollback and import handling.
5. Actual backing, custody, redemption, legal obligations, taxation and regulatory treatment.

## Future acceptance criteria (NOT runtime tests)

- Example arithmetic: Case 1,010 + Shard 250 = 1,260 minted Merit; fees €10 + €3 = €13.
- Shard mint is additional, not a transfer from Case; Case founder increment goes only to platform creator.
- Shard creator pays 1.2%; 2% and 80/20 are never used.
- No implementation until unresolved questions are settled and MVP is stable.
