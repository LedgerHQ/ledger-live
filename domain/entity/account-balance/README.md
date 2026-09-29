# @domain/entity-account-balance

> [!WARNING]
> **EXPLORATION** — see [`@features/platform-account-data`](../../../features/platform/account-data).

Balance rows keyed by account id (token accounts point at their main account through `parentId`), plus a per-account `{ pending, error?, sourceId? }` status.

```
{ rows: Record<AnyAccountId, { accountId, assetId, balance, spendableBalance, parentId?, at }>,
  status: Record<AccountId, { pending, error?, sourceId? }> }
```

- Amounts are non-negative integer strings in the asset's smallest unit.
- A received read replaces every row owned by that account (its own row and its token accounts').
- Selectors: `selectAccountBalance`, `selectSubAccountBalances`, `selectAccountBalanceStatus`, `selectAccountBalanceAt`.
