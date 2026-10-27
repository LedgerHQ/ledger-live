# @features/platform-account-source-portfolio

Balances of EVM accounts from the Portfolio service, as an [account data source](../../../docs/account-data-layer.md). [`src/source.ts`](./src/source.ts) only wires the building blocks of [`src/internals/`](./src/internals/): the snapshot store, the serial queue, the portfolio calls, and one folder per entity (`balance/`: read, verdict, reader).

No app ranks it: the Portfolio source devtool (`@devtools/account-source-portfolio`) creates it with `createPortfolioSource({ dispatch, portfolioId })`, injects it ranked first with `addAccountDataSource(source, { first: true })`, and removes it when turned off.

- Each balance batch lists the portfolio (creating it when the service does not know it), registers the addresses it misses, then reads the balances: one filtered call per account up to three, else one scan of every page. An account the service cannot answer whole is rejected with `AccountDataNotServedError`, so the next ranked source answers it.
- `reconcile(descriptors)` also removes the registrations no account needs, and refuses to run with no account.
- One `evm` registration per address; the service fans it out to every EVM network, as `<network>:<lowercase address>`.
- The listing, the last outcome of each account and an activity log stay in the source, read with `subscribe` / `getSnapshot` (`useSyncExternalStore`).
- A new entity (operations, balance history) adds `src/internals/<entity>/{read,verdict,reader}.ts` and one line in `readBatch`.

The portfolio is the install's `PortfolioId`, whose raw value leaves its wrapper only in `src/client.ts`.
