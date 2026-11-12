# @features/platform-account-source-portfolio

> [!CAUTION]
> **Status: UNSTABLE** — A proof of concept, built slice by slice; the Portfolio service contract may change.

The Portfolio service as an [account data source](../../../docs/account-data-layer.md). It serves balances and operations, lists the install's portfolio on the service and reconciles its registrations with the local accounts. Balance histories come in a next slice, each as `src/internals/<entity>/{read,map,verdict,reader}.ts` and one line in `readBatch`.

No app ranks it. Only a devtool is meant to create it with `createPortfolioSource({ dispatch, portfolioId })` and inject it with `addAccountDataSource(source, { first: true })`.

- Each batch lists the portfolio (creating it when the service does not know it), registers the accounts it misses, then lists it again every 3 s, for 2 min at most, until no account of the batch is pending on the service: the read, and the UI on it, block meanwhile. A synchronized account is read; one that failed to register, is on a network the fan-out does not track, or is still pending after the wait fails with `PortfolioReadError`. No account is handed to another source.
- Balances: one filtered call per account up to three, else one scan of every page, falling back to one call per account when the scan fails (it times out on a portfolio holding a heavy EVM address). A synchronized account with no balance group holds nothing.
- Operations: one page of `/updates` per account: `limit` (20 by default) updates, the service's `nextToken` as `nextCursor`. An update becomes a native row typed from its native change (`FEES` when it equals the fee, else `IN`, `OUT` or `NONE`) carrying the fee, then one row per token it changed. Every row takes the update's `senders` and `recipients`, empty when the service leaves them out. An update without a block is pending (`blockHeight: null`) and comes first in its page. The query reaches the service: `countervalue` as its `currency`, each row valued with its changes' `currency_value` in the fiat's smallest unit (half up, none when a change has none), and an EVM token's `filterAsset` as its `asset`, `<standard>.<contract>` resolved through CAL. The coin's `filterAsset` stays a local filter: the service's `native` leaves out the updates where the coin only pays the fee, such as a token send. So does a token outside EVM, whose service asset we cannot spell.
- `refresh()` lists the portfolio, creating it when the service does not know it.
- `reconcile(descriptors)` registers what the accounts miss and removes the registrations no account needs. It refuses to run with no account, and never touches a registration shape it does not send.
- Service writes go through a serial queue, so two calls never register the same address twice.
- The listing, the last outcome of each account and an activity log stay in the source, read with `subscribe` / `getSnapshot` (`useSyncExternalStore`).
- One registration shape per family ([`src/family.ts`](./src/family.ts)); the first one that takes the account wins ([`src/registration.ts`](./src/registration.ts)). 
  - [`evm.ts`](./src/evm.ts): one `evm` registration per address; the service fans it out to every EVM network, as `<network>:<lowercase address>`.
  - [`autoDerive.ts`](./src/autoDerive.ts): one `auto_derive` registration per xpub, the service deriving from the first address (`<path>/0/0`); the account is the SHA-256 of the xpub sent. Bitcoin and Bitcoin testnet in purposes 44 and 84 only (the service refuses 49 and 86), with a valid Base58Check xpub, since one the service refuses fails the whole registration call; Cardano with our hex key sent as `acct_xvk`.
  - [`addressAccount.ts`](./src/addressAccount.ts): one `account` registration per address, under our id `<service network>:<address>`, for the networks the service synchronizes: Tron, Tezos, Sui, Stellar, Canton.
  - A family or network the service does not synchronize is not supported: the router keeps it on its other sources.

The portfolio is the install's `PortfolioId`, whose raw value leaves its wrapper only in [`src/client.ts`](./src/client.ts).
