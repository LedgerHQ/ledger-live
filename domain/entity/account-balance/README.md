# @domain/entity-account-balance

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `balance` kind: what each asset of an account amounts to, in crypto only. Fiat values come from `@domain/entity-market-countervalues`, joined where a screen shows them.

- One `AccountAssetBalance` per asset (`assetId`, `balance`, `spendableBalance`, optional `locked`), keyed by `AccountUUID`. Amounts are non-negative integers in the asset's smallest unit.
- `locked`, when the source knows, breaks down why part of the balance is not spendable: `{ reason, amount }[]` with `reason` one of `reserve` (minimum balance, rent, deposit), `staked`, `unbonding`, `frozen` (Tron resources), `pending`, `other`. Absent means the source does not tell, not that nothing is locked. A family's own figures (Tron energy) are its kind, not a lock.
- The account's native coin is first. That order is the source's contract: this slice stores the rows as received.
- A balance read replaces the account's rows.
- `selectAccountBalances`, `selectAccountAssetBalance`. Apps mount the slice at `accountBalances`.

Pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-models/data-layer.md).
