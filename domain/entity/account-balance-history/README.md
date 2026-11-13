# @domain/entity-account-balance-history

> [!CAUTION]
> **Status: UNSTABLE** — New package, API still being designed.

The `balanceHistory` kind: the balance of each asset of an account over a range, for the account graph and its PnL.

- The query is `{ range, countervalue? }`: `range` is one of `day`, `week`, `month`, `year`, `all`, as the portfolio offers them; a read without a query gets `DEFAULT_BALANCE_HISTORY_RANGE`. The granularity of the points is the source's. `countervalue` asks for each point valued in that fiat at its date.
- The result is `{ range, series }`: one `AssetBalanceHistory` per asset (`assetId`, `points`), the native coin first. Each point is `{ date, balance, countervalues? }`, oldest first, the last one being the current balance. Amounts are non-negative integers in the asset's smallest unit; `countervalues` holds, for the fiat ticker a `countervalue` query asks for, what `balance` was worth at `date` in that fiat's smallest unit.
- A read without `countervalue` is crypto only: the graph and the PnL apply the rates of `@domain/entity-market-countervalues` when they read.
- Stored by `AccountUUID`, then by range, as `{ revision, series, countervalueRevisions? }`: a read replaces the series of its range and keeps the others, unless an answer started later already stored that range (a read without a query and `{ range: DEFAULT_BALANCE_HISTORY_RANGE }` answer the same range). The result names its range, so equivalent queries land on it. A point keeps the countervalues it was stored with while its date and balance stay the same, and adds those of the new read; each point keeps, per fiat, the value of the latest answer that had it, whatever order the answers arrive in (`countervalueRevisions`, by asset, date and fiat).
- `selectAccountBalanceHistory(state, accountUUID, range, countervalue?)`, `selectAccountAssetBalanceHistory`: with `countervalue`, each point carries only its value in that fiat, when known; without, none. Apps mount the slice at `accountBalanceHistories`.

Pending, the last error and the source stay in `accountData`, one status per query, as `accountDataQueryKey` writes it. See [the account data layer](../../../docs/account-models/data-layer.md).
