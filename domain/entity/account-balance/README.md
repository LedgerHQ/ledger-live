# @domain/entity-account-balance

> [!CAUTION]
> **Status: EXPLORATION.** See [the account data layer](../../../docs/account-data-layer.md).

Balance rows keyed by account id, token accounts pointing at their main account through `parentId`,
plus a per-account `{ pending, error?, sourceId? }` status.

```
{ rows: Record<AnyAccountId, { accountId, assetId, balance, spendableBalance, parentId?, at }>,
  status: Record<AccountId, { pending, error?, sourceId? }> }
```

- Declares the `balance` datum in [`AccountData`](../account-data): no query, `AccountBalance[]` as
  the result, the account's own row first.
- `accountBalanceBinding` lets the generic read drive this slice.
- Amounts are non-negative integer strings in the asset's smallest unit.
- A received read replaces every row owned by that account: its own row and its token accounts'.
- Selectors: `selectAccountBalance`, `selectSubAccountBalances`, `selectAccountBalanceStatus`,
  `selectAccountBalanceAt`.
