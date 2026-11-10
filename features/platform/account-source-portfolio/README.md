# @features/platform-account-source-portfolio

> [!CAUTION]
> **Status: UNSTABLE** — A proof of concept, built slice by slice; the Portfolio service contract may change.

The Portfolio service as an [account data source](../../../docs/account-data-layer.md). It does not serve any read yet: it lists the install's portfolio on the service and reconciles its registrations with the local accounts. Balances, operations and balance histories come in the next slices, each as `src/internals/<entity>/{read,map,verdict,reader}.ts` and one line in `readBatch`.

No app ranks it. Only a devtool is meant to create it with `createPortfolioSource({ dispatch, portfolioId })` and inject it with `addAccountDataSource(source, { first: true })`.

- `refresh()` lists the portfolio, creating it when the service does not know it.
- `reconcile(descriptors)` registers what the accounts miss and removes the registrations no account needs. It refuses to run with no account, and never touches a registration shape it does not send.
- Service writes go through a serial queue, so two calls never register the same address twice.
- The listing, the last outcome of each account and an activity log stay in the source, read with `subscribe` / `getSnapshot` (`useSyncExternalStore`).
- One registration shape per family ([`src/family.ts`](./src/family.ts)); the first one that takes the account wins ([`src/registration.ts`](./src/registration.ts)). Today only [`evm.ts`](./src/evm.ts): one `evm` registration per address, which the service fans out to every EVM network as `<network>:<lowercase address>`.

The portfolio is the install's `PortfolioId`, whose raw value leaves its wrapper only in [`src/client.ts`](./src/client.ts).
