# @domain/entity-account-balance

> [!CAUTION]
> **Status: EXPLORATION.** See [the account data layer](../../../docs/account-data-layer.md).
>
> A suggestion of shape, to be studied and delivered on its own: nothing here is settled.

The `balance` kind: what each asset of an account amounts to, in crypto only (Proposal 1 of the account balance workshop). Fiat values come from `@domain/entity-market-countervalues`, joined where a screen shows them.

- One `AccountAssetBalance` per asset (`assetId`, `balance`, `spendableBalance`, smallest-unit integer strings), the account's native coin first, keyed by `AccountUUID`.
- A balance read replaces the account's rows.
- `selectAccountBalances`, `selectAccountAssetBalance`, `accountBalancesRemoved`.
