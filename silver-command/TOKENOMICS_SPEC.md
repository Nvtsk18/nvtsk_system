# Merit tokenomics · agreed specification (NOT implemented)

Status: **design only**, excluded from browser MVP 0.4. No payments, exchange, custody, AML/GDPR or tax compliance is implemented. Merit is not tax-exempt merely because it remains inside a system.

## Confirmed issuance and fees

| Event | New Merit minted | Fee paid in EUR | Fee payer | Recipient / allocation |
|---|---:|---:|---|---|
| Create Case with nominal value €1,000 | 1,010 | €10 (1% of €1,000) | Not yet specified | Extra 10 Merit to **platform creator**, NOT Case creator; recipient of base 1,000 Merit unresolved |
| Create Shard with nominal value €250 | 250 **additional** | €3 (1.2% of €250) | **Shard creator** | Recipient of 250 Merit unresolved |

**After both events:** 1,260 newly minted Merit and €13 in fees. Shard issuance does **not** transfer or subtract the Case Merit. The previous 2% Shard fee is superseded by **1.2%**. Fees are fully dedicated to Merit backing / dilution compensation, with **no 80/20 split**. Euro fees and Merit units must never be conflated.

## Unresolved, do not assume
1. Recipient of base Case Merit and newly minted Shard Merit.
2. Exact accrual timing and event finality.
3. Maximum aggregate issuance across child Shards, including nested Shards.
4. Idempotency and retries: duplicate creation and replay prevention.
5. Legal obligations, actual backing, redemption, custody, taxes, regulatory status and evidence of funds.
6. Case fee payer (not explicitly decided).

## Engineering hold
Do not expose balances as real, accept payments, mint production Merit, or claim collateralisation before the open questions and legal review are resolved. Keep this spec separate from the local-only operational MVP.
