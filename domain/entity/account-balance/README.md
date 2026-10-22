# @domain/entity-account-balance

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `balance` kind: what each asset of an account amounts to, in crypto only. Fiat values come from `@domain/entity-market-countervalues`, joined where a screen shows them.

- One `AccountAssetBalance` per asset (`assetId`, `balance`, `spendableBalance`), keyed by `AccountUUID`. Amounts are non-negative integers in the asset's smallest unit.
- The account's native coin is first. That order is the source's contract: this slice stores the rows as received.
- A balance read replaces the account's rows.
- `selectAccountBalances`, `selectAccountAssetBalance`. Apps mount the slice at `accountBalances`.

Pending, the last error and the source stay in `accountData`. See [the account data layer](../../../docs/account-data-layer.md).
