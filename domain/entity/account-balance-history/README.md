# @domain/entity-account-balance-history

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `balanceHistory` kind: the balance of each asset of an account over a range, for the account graph and its PnL.

- The query is `{ range }`, one of `day`, `week`, `month`, `year`, `all`, as the portfolio offers them; a read without a query gets `DEFAULT_BALANCE_HISTORY_RANGE`. The granularity of the points is the source's.
- The result is `{ range, series }`: one `AssetBalanceHistory` per asset (`assetId`, `points`), the native coin first. Each point is `{ date, balance }`, oldest first, the last one being the current balance. Amounts are non-negative integers in the asset's smallest unit.
- Crypto only: the graph and the PnL apply the countervalues of `@domain/entity-market-countervalues` when they read.
- Stored by `AccountUUID`, then by range: a read replaces the series of its range and keeps the others. The result names its range because the received action does not carry the query.
- `selectAccountBalanceHistory`, `selectAccountAssetBalanceHistory`. Apps mount the slice at `accountBalanceHistories`.

Pending, the last error and the source stay in `accountData`, one status per account for every range: it tells how the last read went, whatever its range. See [the account data layer](../../../docs/account-data-layer.md).
