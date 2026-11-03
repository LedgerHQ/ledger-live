# @features/platform-account-source-portfolio

> [!CAUTION]
> **Status: UNSTABLE** — A proof of concept, only injected by its devtool; the Portfolio service contract may change.

Balances, balance histories and operations of EVM accounts from the Portfolio service, as an [account data source](../../../docs/account-data-layer.md). [`src/source.ts`](./src/source.ts) only wires the building blocks of [`src/internals/`](./src/internals/): the snapshot store, the serial queue, the portfolio calls, and one folder per entity (`balance/`, `balanceHistory/`, `operations/`: read, map, verdict, reader).

No app ranks it: the Portfolio source devtool (`@devtools/account-source-portfolio`) creates it with `createPortfolioSource({ dispatch, portfolioId })`, injects it ranked first with `addAccountDataSource(source, { first: true })`, and removes it when turned off.

- Each batch lists the portfolio (creating it when the service does not know it), registers the addresses it misses, then lists it again every 3 s, for 2 min at most, until no account of the batch is pending on the service: the read, and the UI on it, block meanwhile. A synchronized account is read; one that failed to register, is on a network the fan-out does not track, or is still pending after the wait fails with `PortfolioReadError`. No account is handed to another source.
- Balances: one filtered call per account up to three, else one scan of every page. A synchronized account with no balance group holds nothing.
- Operations: one page of `/updates` per account: `limit` (20 by default) updates, the service's `nextToken` as `nextCursor`. An update becomes a native row typed from its native change (`FEES` when it equals the fee, else `IN`, `OUT` or `NONE`) carrying the fee, then one row per token it changed. Every row takes the update's `senders` and `recipients`, empty when the service leaves them out. An update without a block is pending (`blockHeight: null`) and comes first in its page; a block with an invalid height fails the response validation. The query reaches the service: `countervalue` as its `currency`, each row valued with its changes' `currency_value` in the fiat's smallest unit (half up, none when a change has none), and a token's `filterAsset` as its `asset`, `<standard>.<contract>` resolved through CAL. The coin's `filterAsset` stays a local filter: the service's `native` leaves out the updates where the coin only pays the fee, such as a token send.
- Balance history: every page of `/balance/history` for the range asked (`month` by default) per account, oldest first. Points are grouped per asset, native coin first; the account fails when its read hits the page cap.
- `reconcile(descriptors)` also removes the registrations no account needs, and refuses to run with no account.
- One `evm` registration per address; the service fans it out to every EVM network, as `<network>:<lowercase address>`.
- The listing, the last balance outcome of each account and an activity log stay in the source, read with `subscribe` / `getSnapshot` (`useSyncExternalStore`).
- A new entity adds `src/internals/<entity>/{read,map,verdict,reader}.ts` and one line in `readBatch`.

The portfolio is the install's `PortfolioId`, whose raw value leaves its wrapper only in `src/client.ts`.
